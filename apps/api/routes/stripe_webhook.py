"""
Stripe Webhook Handler for Sine
Handles: checkout.session.completed, invoice.paid, customer.subscription.deleted
"""
import os
import stripe
from fastapi import APIRouter, Request, HTTPException
from supabase import create_client

router = APIRouter()

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

stripe.api_key = STRIPE_SECRET_KEY

def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Credit amounts per package (credits for stripe price id)
CREDIT_PACKAGES = {
    "price_1000_credits": 1000,
    "price_2000_credits": 2000,
    "price_5000_credits": 5000,
    "price_10000_credits": 10000,
}

PRO_MONTHLY_CREDITS = 1000

@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    supabase = get_supabase()

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        await handle_checkout_completed(supabase, session)

    elif event["type"] == "invoice.paid":
        invoice = event["data"]["object"]
        await handle_invoice_paid(supabase, invoice)

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        await handle_subscription_deleted(supabase, subscription)

    elif event["type"] == "customer.subscription.updated":
        subscription = event["data"]["object"]
        await handle_subscription_updated(supabase, subscription)

    return {"status": "ok"}


async def handle_checkout_completed(supabase, session):
    """Handle one-time credit purchases and new Pro subscriptions"""
    customer_id = session.get("customer")
    metadata = session.get("metadata", {})
    mode = session.get("mode")
    user_id = metadata.get("user_id")

    if not user_id:
        # Try to find user by customer ID
        result = supabase.table("profiles").select("id").eq("stripe_customer_id", customer_id).single().execute()
        if result.data:
            user_id = result.data["id"]

    if not user_id:
        return

    if mode == "payment":
        # One-time credit purchase
        line_items = stripe.checkout.Session.list_line_items(session["id"])
        for item in line_items.data:
            price_id = item.price.id
            credits = CREDIT_PACKAGES.get(price_id, 0)
            if credits > 0:
                supabase.rpc("add_credits", {
                    "p_user_id": user_id,
                    "p_amount": credits,
                    "p_type": "purchase",
                    "p_description": f"Kjøp av {credits} kreditter",
                    "p_metadata": {"stripe_session_id": session["id"], "stripe_price_id": price_id}
                }).execute()

    elif mode == "subscription":
        # New Pro subscription - give 1000 credits immediately
        subscription_id = session.get("subscription")
        supabase.table("profiles").update({
            "plan": "pro",
            "stripe_customer_id": customer_id
        }).eq("id", user_id).execute()

        supabase.table("subscriptions").upsert({
            "user_id": user_id,
            "stripe_subscription_id": subscription_id,
            "plan": "pro",
            "status": "active"
        }).execute()

        supabase.rpc("add_credits", {
            "p_user_id": user_id,
            "p_amount": PRO_MONTHLY_CREDITS,
            "p_type": "pro_monthly",
            "p_description": "Pro-abonnement aktivert – 1 000 kreditter",
            "p_metadata": {"stripe_subscription_id": subscription_id}
        }).execute()


async def handle_invoice_paid(supabase, invoice):
    """Handle monthly Pro renewal - give 1000 credits"""
    subscription_id = invoice.get("subscription")
    if not subscription_id:
        return

    # Skip first invoice (handled by checkout.session.completed)
    if invoice.get("billing_reason") == "subscription_create":
        return

    result = supabase.table("subscriptions").select("user_id").eq(
        "stripe_subscription_id", subscription_id
    ).single().execute()

    if not result.data:
        return

    user_id = result.data["user_id"]
    supabase.rpc("add_credits", {
        "p_user_id": user_id,
        "p_amount": PRO_MONTHLY_CREDITS,
        "p_type": "pro_monthly",
        "p_description": "Månedlig Pro-fornyelse – 1 000 kreditter",
        "p_metadata": {"stripe_invoice_id": invoice["id"]}
    }).execute()


async def handle_subscription_deleted(supabase, subscription):
    """Downgrade user to free plan when subscription is canceled"""
    subscription_id = subscription.get("id")
    supabase.table("subscriptions").update({"status": "canceled"}).eq(
        "stripe_subscription_id", subscription_id
    ).execute()

    result = supabase.table("subscriptions").select("user_id").eq(
        "stripe_subscription_id", subscription_id
    ).single().execute()

    if result.data:
        supabase.table("profiles").update({"plan": "free"}).eq(
            "id", result.data["user_id"]
        ).execute()


async def handle_subscription_updated(supabase, subscription):
    """Update subscription status in database"""
    subscription_id = subscription.get("id")
    status = subscription.get("status")
    supabase.table("subscriptions").update({"status": status}).eq(
        "stripe_subscription_id", subscription_id
    ).execute()


@router.post("/create-checkout-session")
async def create_checkout_session(request: Request):
    """Create a Stripe Checkout session for credit purchase or Pro subscription"""
    body = await request.json()
    user_id = body.get("user_id")
    price_id = body.get("price_id")
    mode = body.get("mode", "payment")  # "payment" or "subscription"
    success_url = body.get("success_url", "https://larsottojohnsen.github.io/sine/?payment=success")
    cancel_url = body.get("cancel_url", "https://larsottojohnsen.github.io/sine/?payment=canceled")

    if not user_id or not price_id:
        raise HTTPException(status_code=400, detail="Missing user_id or price_id")

    supabase = get_supabase()

    # Get or create Stripe customer
    profile = supabase.table("profiles").select("stripe_customer_id, email").eq("id", user_id).single().execute()
    customer_id = profile.data.get("stripe_customer_id") if profile.data else None

    if not customer_id:
        customer = stripe.Customer.create(
            email=profile.data.get("email") if profile.data else None,
            metadata={"user_id": user_id}
        )
        customer_id = customer.id
        supabase.table("profiles").update({"stripe_customer_id": customer_id}).eq("id", user_id).execute()

    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode=mode,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"user_id": user_id}
    )

    return {"url": session.url}
