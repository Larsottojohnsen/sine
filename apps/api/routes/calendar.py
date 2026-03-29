"""
Sine Agentic Calendar — Backend API Routes
Handles recurring tasks CRUD and execution logging via Supabase.
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
import os
from supabase import create_client

router = APIRouter(prefix="/calendar", tags=["calendar"])

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_user_id(authorization: str) -> str:
    """Extract user ID from Supabase JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization")
    token = authorization.replace("Bearer ", "")
    sb = get_supabase()
    user = sb.auth.get_user(token)
    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user.user.id


# ── Schemas ──────────────────────────────────────────────────

class RecurringTaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    category: str = "Tilpasset"
    color: str = "#1A93FE"
    frequency: str  # daily | weekly | monthly | custom
    custom_days: Optional[List[int]] = None
    day_of_week: Optional[int] = None
    day_of_month: Optional[int] = None
    time_of_day: str = "09:00"
    connector_id: Optional[str] = None
    connector_name: Optional[str] = None
    agent_prompt: str
    ends_at: Optional[str] = None
    is_active: bool = True
    auto_approved: bool = False
    source: str = "manual"


class TaskExecutionCreate(BaseModel):
    task_id: str
    scheduled_for: str  # ISO datetime string
    triggered_by: str = "manual"  # manual | scheduler


# ── Routes ───────────────────────────────────────────────────

@router.get("/tasks")
async def list_tasks(authorization: str = Header(None)):
    """List all recurring tasks for the authenticated user."""
    user_id = get_user_id(authorization)
    sb = get_supabase()
    result = sb.table("recurring_tasks") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .execute()
    return {"tasks": result.data}


@router.post("/tasks")
async def create_task(body: RecurringTaskCreate, authorization: str = Header(None)):
    """Create a new recurring task."""
    user_id = get_user_id(authorization)
    sb = get_supabase()
    result = sb.table("recurring_tasks").insert({
        "user_id": user_id,
        "title": body.title,
        "description": body.description,
        "category": body.category,
        "color": body.color,
        "frequency": body.frequency,
        "custom_days": body.custom_days,
        "day_of_week": body.day_of_week,
        "day_of_month": body.day_of_month,
        "time_of_day": body.time_of_day,
        "connector_id": body.connector_id,
        "connector_name": body.connector_name,
        "agent_prompt": body.agent_prompt,
        "ends_at": body.ends_at,
        "is_active": body.is_active,
        "auto_approved": body.auto_approved,
        "source": body.source,
    }).execute()
    return {"task": result.data[0] if result.data else None}


@router.patch("/tasks/{task_id}")
async def update_task(task_id: str, body: dict, authorization: str = Header(None)):
    """Update a recurring task (partial update)."""
    user_id = get_user_id(authorization)
    sb = get_supabase()
    # Verify ownership
    existing = sb.table("recurring_tasks") \
        .select("id") \
        .eq("id", task_id) \
        .eq("user_id", user_id) \
        .single() \
        .execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Task not found")
    result = sb.table("recurring_tasks") \
        .update(body) \
        .eq("id", task_id) \
        .execute()
    return {"task": result.data[0] if result.data else None}


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, authorization: str = Header(None)):
    """Delete a recurring task."""
    user_id = get_user_id(authorization)
    sb = get_supabase()
    sb.table("recurring_tasks") \
        .delete() \
        .eq("id", task_id) \
        .eq("user_id", user_id) \
        .execute()
    return {"success": True}


@router.post("/tasks/{task_id}/run")
async def run_task_now(task_id: str, authorization: str = Header(None)):
    """
    Manually trigger a task to run immediately.
    Creates an execution log entry and (in production) dispatches to agent runner.
    """
    user_id = get_user_id(authorization)
    sb = get_supabase()

    # Get task and verify ownership
    task_result = sb.table("recurring_tasks") \
        .select("*") \
        .eq("id", task_id) \
        .eq("user_id", user_id) \
        .single() \
        .execute()
    if not task_result.data:
        raise HTTPException(status_code=404, detail="Task not found")

    task = task_result.data

    # Create execution log
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    exec_result = sb.table("task_executions").insert({
        "task_id": task_id,
        "user_id": user_id,
        "scheduled_for": now,
        "started_at": now,
        "status": "running",
        "triggered_by": "manual",
    }).execute()

    execution_id = exec_result.data[0]["id"] if exec_result.data else None

    # TODO: In production, dispatch to agent runner with task["agent_prompt"]
    # For now, mark as success immediately
    if execution_id:
        sb.table("task_executions") \
            .update({"status": "success", "finished_at": now, "result_summary": "Kjørt manuelt (demo)"}) \
            .eq("id", execution_id) \
            .execute()

    return {
        "success": True,
        "execution_id": execution_id,
        "task_title": task["title"],
        "message": f"Oppgave '{task['title']}' er startet",
    }


@router.get("/tasks/{task_id}/executions")
async def list_executions(task_id: str, limit: int = 20, authorization: str = Header(None)):
    """List recent executions for a task."""
    user_id = get_user_id(authorization)
    sb = get_supabase()
    result = sb.table("task_executions") \
        .select("*") \
        .eq("task_id", task_id) \
        .eq("user_id", user_id) \
        .order("scheduled_for", desc=True) \
        .limit(limit) \
        .execute()
    return {"executions": result.data}
