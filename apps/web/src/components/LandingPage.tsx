import { useState, useEffect, useRef } from "react";
import "../landing.css";

// ── CDN ASSETS ──────────────────────────────────────────────────────────────
const LOGO_DARK  = "/sine/Sine-sort.svg";
const LOGO_LIGHT = "/sine/Sine-hvit.svg";

// App mockup images (generated)
const IMG_CHAT       = "/sine/sine-chat-mockup.png";
const IMG_CALENDAR   = "/sine/sine-calendar-mockup.png";
const IMG_CONNECTORS = "/sine/sine-connectors-mockup.png";
const IMG_LIBRARY    = "/sine/sine-library-mockup.png";

// Nature background paintings (Gemini-generated Norwegian landscapes)
const BG_MOUNTAIN   = "https://d2xsxph8kpxj0f.cloudfront.net/310519663215301248/mRNQuoggx2LarwPy6pojqf/Gemini_Generated_Image_3ol3u3ol3u3ol3u3_bb6304dd.png";
const BG_STAVE      = "https://d2xsxph8kpxj0f.cloudfront.net/310519663215301248/mRNQuoggx2LarwPy6pojqf/Gemini_Generated_Image_g0v8hog0v8hog0v8_8c9d434c.png";
const BG_FJORD      = "https://d2xsxph8kpxj0f.cloudfront.net/310519663215301248/mRNQuoggx2LarwPy6pojqf/Gemini_Generated_Image_vtlyktvtlyktvtly_b84d3a15.png";
const BG_WATERFALL  = "https://d2xsxph8kpxj0f.cloudfront.net/310519663215301248/mRNQuoggx2LarwPy6pojqf/Gemini_Generated_Image_x181mgx181mgx181_a6ac7765.png";

// ── FADE-IN ANIMATION ────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
          }, delay);
        }
      },
      { threshold: 0.1 }
    );
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.style.transition = "opacity 0.55s ease, transform 0.55s ease";
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return <div ref={ref}>{children}</div>;
}

// ── COMPARISON DATA ──────────────────────────────────────────────────────────
const COMPARE_ROWS = [
  { feature: "Utfører oppgaver autonomt",  traditional: "Nei — bare svarer",       sine: "Ja — handler direkte" },
  { feature: "Kobler til dine verktøy",    traditional: "Begrenset",                sine: "Gmail, Meta, GitHub, m.fl." },
  { feature: "Repeterende oppgaver",       traditional: "Manuell oppsett",          sine: "Agentisk kalender" },
  { feature: "Husker kontekst",            traditional: "Tilbakestilles per chat",  sine: "Persistent hukommelse" },
  { feature: "Kjører i bakgrunnen",        traditional: "Nei",                      sine: "Ja — 24/7 automatisering" },
  { feature: "Norsk språk & lovgivning",   traditional: "Varierende",               sine: "Bygget for norske bedrifter" },
];

const FREEDOM_CARDS = [
  { icon: "🤖", title: "Autonom utførelse",    desc: "Sine handler — ikke bare svarer. Den utfører oppgaver direkte i verktøyene dine." },
  { icon: "🔗", title: "Connectors",           desc: "Koble til Gmail, Meta Ads, GitHub, Instagram og mer. Sine jobber der du jobber." },
  { icon: "📅", title: "Agentisk kalender",    desc: "Sett opp repeterende oppgaver. Sine kjører dem automatisk til rett tid." },
  { icon: "🧠", title: "Persistent hukommelse",desc: "Sine husker kontekst, preferanser og tidligere arbeid på tvers av samtaler." },
  { icon: "📚", title: "Skills & bibliotek",   desc: "Bygg egne arbeidsflyter og lagre dem som gjenbrukbare skills." },
  { icon: "🔒", title: "Norsk & trygt",        desc: "Bygget for norske bedrifter — GDPR-kompatibelt og med norsk språkforståelse." },
];

const STEPS_NO = [
  { title: "Beskriv oppgaven",    desc: "Fortell Sine hva du vil ha gjort — på norsk, i naturlig språk. Last opp filer, lenker eller kontekst." },
  { title: "Koble til verktøy",   desc: "Velg hvilke connectors Sine skal bruke: Gmail, Meta Ads, GitHub, Instagram eller egne API-er." },
  { title: "Sine gjør jobben",    desc: "Sine utfører oppgaven, rapporterer tilbake og lagrer resultatet i biblioteket ditt." },
];

const STEPS_EN = [
  { title: "Describe the task",   desc: "Tell Sine what you want done — in plain language. Upload files, links, or context." },
  { title: "Connect your tools",  desc: "Choose which connectors Sine should use: Gmail, Meta Ads, GitHub, Instagram or custom APIs." },
  { title: "Sine does the work",  desc: "Sine executes the task, reports back, and saves the result to your library." },
];

const PLANS = [
  {
    name: "Gratis", nameEn: "Free", price: "0", period: "/mnd", periodEn: "/mo",
    desc: "Kom i gang gratis", descEn: "Get started for free", featured: false,
    features: ["100 kreditter/mnd","2 connectors","Grunnleggende skills","Bibliotek (1 GB)","Norsk AI-agent"],
    featuresEn: ["100 credits/mo","2 connectors","Basic skills","Library (1 GB)","Norwegian AI agent"],
    cta: "Kom i gang", ctaEn: "Get started",
  },
  {
    name: "Pro", nameEn: "Pro", price: "149", period: "/mnd", periodEn: "/mo",
    desc: "For profesjonelle og team", descEn: "For professionals and teams", featured: true,
    badge: "Mest populær", badgeEn: "Most popular",
    features: ["1 000 kreditter/mnd","Alle connectors","Agentisk kalender","Ubegrensede skills","Bibliotek (50 GB)","Prioritert support"],
    featuresEn: ["1,000 credits/mo","All connectors","Agentic calendar","Unlimited skills","Library (50 GB)","Priority support"],
    cta: "Prøv gratis i 14 dager", ctaEn: "Try free for 14 days",
  },
  {
    name: "Bedrift", nameEn: "Enterprise", price: "Kontakt", priceEn: "Contact",
    period: "", periodEn: "", desc: "Tilpasset for store team", descEn: "Custom for large teams", featured: false,
    features: ["Ubegrensede kreditter","Dedikert support","SSO & SAML","Tilpassede connectors","SLA-garanti"],
    featuresEn: ["Unlimited credits","Dedicated support","SSO & SAML","Custom connectors","SLA guarantee"],
    cta: "Ta kontakt", ctaEn: "Contact us",
  },
];

const FAQ_NO = [
  { q: "Hva er Sine?", a: "Sine er en norsk AI-agent som faktisk utfører oppgaver for deg — ikke bare svarer på spørsmål. Den kobler seg til verktøyene du bruker og handler autonomt på dine vegne." },
  { q: "Hva er forskjellen fra ChatGPT?", a: "ChatGPT og lignende verktøy svarer på spørsmål. Sine handler. Den kan sende e-post, oppdatere annonser, lage rapporter og poste innhold — automatisk, uten at du trenger å gjøre det manuelt." },
  { q: "Hvilke verktøy kan Sine koble til?", a: "Sine støtter connectors til Gmail, Google Calendar, Meta Ads, Instagram, GitHub og mer. Vi legger til nye connectors kontinuerlig basert på brukernes behov." },
  { q: "Hva er kreditter?", a: "Kreditter brukes for hver oppgave Sine utfører. Enkle oppgaver koster færre kreditter, komplekse oppgaver med mange steg koster mer. Du kan alltid kjøpe ekstra kreditter." },
  { q: "Er Sine GDPR-kompatibelt?", a: "Ja. Sine er bygget for norske og europeiske bedrifter med GDPR i fokus. Data lagres i EU, og du har full kontroll over hva agenten har tilgang til." },
  { q: "Kan jeg prøve Sine gratis?", a: "Ja! Gratis-planen gir deg 100 kreditter per måned uten kredittkort. Pro-planen kan prøves gratis i 14 dager." },
];

const FAQ_EN = [
  { q: "What is Sine?", a: "Sine is a Norwegian AI agent that actually executes tasks for you — not just answers questions. It connects to your tools and acts autonomously on your behalf." },
  { q: "How is Sine different from ChatGPT?", a: "ChatGPT and similar tools answer questions. Sine acts. It can send emails, update ads, generate reports, and post content — automatically, without manual work." },
  { q: "Which tools can Sine connect to?", a: "Sine supports connectors to Gmail, Google Calendar, Meta Ads, Instagram, GitHub and more. We continuously add new connectors based on user needs." },
  { q: "What are credits?", a: "Credits are used for each task Sine performs. Simple tasks cost fewer credits, complex multi-step tasks cost more. You can always purchase additional credits." },
  { q: "Is Sine GDPR compliant?", a: "Yes. Sine is built for Norwegian and European businesses with GDPR in mind. Data is stored in the EU, and you have full control over what the agent has access to." },
  { q: "Can I try Sine for free?", a: "Yes! The free plan gives you 100 credits per month with no credit card required. The Pro plan can be tried free for 14 days." },
];

interface LandingPageProps {
  onEnterApp: () => void;
}

export function LandingPage({ onEnterApp }: LandingPageProps) {
  const [isDark, setIsDark] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [lang, setLang] = useState<"no" | "en">("no");
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const logo = isDark ? LOGO_LIGHT : LOGO_DARK;
  const t = (no: string, en: string): string => lang === "no" ? no : en;

  const PILLS = lang === "no" ? [
    "Lag ukentlig salgsrapport",
    "Post på Instagram",
    "Svar på kundemail",
    "Oppdater Meta Ads-budsjett",
    "Analyser nettstedstrafikk",
  ] : [
    "Create weekly sales report",
    "Post on Instagram",
    "Reply to customer emails",
    "Update Meta Ads budget",
    "Analyze website traffic",
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onEnterApp();
  }

  const steps = lang === "no" ? STEPS_NO : STEPS_EN;
  const faq   = lang === "no" ? FAQ_NO   : FAQ_EN;

  return (
    <div className={`sine-page${isDark ? " dark" : ""}`} style={{ overflowY: "auto", height: "100vh" }}>

      {/* ── ANNOUNCEMENT BAR ─────────────────────────────────────────────── */}
      <div className="announce-bar">
        <span className="announce-badge">Nytt</span>
        <span>{t("Agentisk kalender er nå tilgjengelig —", "Agentic calendar is now available —")}</span>
        <button onClick={onEnterApp} className="announce-link" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          {t("Prøv det nå →", "Try it now →")}
        </button>
      </div>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav className="s-nav">
        <div className="s-nav-inner">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="s-nav-logo" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <img src={logo} alt="Sine" />
          </button>
          <div className="s-nav-links">
            <a href="#features">{t("Funksjoner", "Features")}</a>
            <a href="#pricing">{t("Priser", "Pricing")}</a>
            <a href="#faq">FAQ</a>
            <button onClick={onEnterApp} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", font: "inherit", padding: "0.35rem 0.75rem" }}>{t("Appen", "App")}</button>
          </div>
          <div className="s-nav-actions">
            <button onClick={onEnterApp} className="s-nav-login">
              {t("Logg inn", "Log in")}
            </button>
            <button onClick={onEnterApp} className="s-nav-cta">
              {t("Kom i gang", "Get started")}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="s-hero">
        <div className="s-hero-inner">
          <h1 className="s-hero-h1">
            {lang === "no" ? (
              <>Din norske AI-agent<br />som faktisk gjør jobben</>
            ) : (
              <>Your Norwegian AI agent<br />that actually gets things done</>
            )}
          </h1>
          <p className="s-hero-sub">
            {t(
              "Sine kobler seg til verktøyene du bruker og utfører oppgaver automatisk — fra e-post og rapporter til annonser og sosiale medier.",
              "Sine connects to your tools and executes tasks automatically — from emails and reports to ads and social media."
            )}
          </p>

          {/* CTA buttons removed — Manus style: chat input is the primary CTA */}

          {/* Chat box — Manus style: input first, pills below */}
          <div className="s-chat-box">
            <div className="s-chat-input-box">
              <textarea
                className="s-chat-textarea"
                placeholder={t("Hva vil du at Sine skal gjøre?", "What would you like Sine to do?")}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); } }}
                rows={2}
              />
              <div className="s-chat-toolbar">
                <div className="s-chat-toolbar-left">
                  <button type="button" className="s-chat-tool-btn" title={t("Legg til", "Add")}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                </div>
                <div className="s-chat-toolbar-right">
                  <button
                    type="button"
                    className={`s-chat-send-btn${chatInput.trim().length > 0 ? ' active' : ''}`}
                    onClick={handleSubmit}
                    disabled={chatInput.trim().length === 0}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="s-chat-pills">
              {PILLS.map((pill) => (
                <button
                  key={pill}
                  className="s-chat-pill"
                  onClick={() => setChatInput(pill)}
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY SINE ─────────────────────────────────────────────────────── */}
      <section className="s-section s-section--gray" id="features">
        <FadeIn>
          <div className="s-container">
            <div className="s-section-header">
              <p className="s-label">{t("Hvorfor Sine", "Why Sine")}</p>
              <h2 className="s-h2">{t("Tradisjonell AI svarer.\nSine handler.", "Traditional AI answers.\nSine acts.")}</h2>
              <p className="s-section-sub">
                {t(
                  "De fleste AI-verktøy stopper ved å generere tekst. Sine går videre — den utfører oppgaven direkte i verktøyene du allerede bruker.",
                  "Most AI tools stop at generating text. Sine goes further — it executes the task directly in the tools you already use."
                )}
              </p>
            </div>

            <div className="s-table-wrap">
              <table className="s-compare-table">
                <thead>
                  <tr>
                    <th>{t("Funksjon", "Feature")}</th>
                    <th>{t("Tradisjonell AI", "Traditional AI")}</th>
                    <th>Sine</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row) => (
                    <tr key={row.feature}>
                      <td className="s-td-feature">{row.feature}</td>
                      <td className="s-td-no">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          {row.traditional}
                        </span>
                      </td>
                      <td className="s-td-yes">
                        <span className="s-check-wrap">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          {row.sine}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── FEATURE: CHAT ────────────────────────────────────────────────── */}
      <section className="s-feature-section">
        <FadeIn>
          <div className="s-feature-grid s-container">
            <div className="s-feature-img">
              <div className="s-nature-bg" style={{backgroundImage: `url(${BG_FJORD})`}}>
                <img src={IMG_CHAT} alt="Sine AI Chat" />
              </div>
            </div>
            <div className="s-feature-text">
              <p className="s-label">{t("AI-agent", "AI Agent")}</p>
              <h2 className="s-h3">
                {lang === "no" ? <>Fortell Sine hva du vil.<br />Den gjør resten.</> : <>Tell Sine what you want.<br />It does the rest.</>}
              </h2>
              <p className="s-feature-desc">
                {t("Skriv en oppgave i naturlig norsk — last opp filer, lenker eller kontekst. Sine analyserer, planlegger og utfører oppgaven autonomt.", "Write a task in natural language — upload files, links, or context. Sine analyzes, plans, and executes the task autonomously.")}
              </p>
              <ul className="s-feature-bullets">
                {[t("Forstår norsk kontekst og nyanser","Understands Norwegian context and nuances"),t("Husker tidligere samtaler og preferanser","Remembers previous conversations and preferences"),t("Kan håndtere komplekse, flerstegede oppgaver","Handles complex, multi-step tasks"),t("Rapporterer tilbake med resultater og filer","Reports back with results and files")].map((item) => (
                  <li key={item}><span className="s-bullet-check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── FEATURE: CALENDAR ────────────────────────────────────────────── */}
      <section className="s-feature-section">
        <FadeIn>
          <div className="s-feature-grid s-feature-grid--rev s-container">
            <div className="s-feature-img">
              <div className="s-nature-bg" style={{backgroundImage: `url(${BG_MOUNTAIN})`}}>
                <img src={IMG_CALENDAR} alt="Sine Agentisk Kalender" />
              </div>
            </div>
            <div className="s-feature-text">
              <p className="s-label">{t("Agentisk kalender", "Agentic Calendar")}</p>
              <h2 className="s-h3">
                {lang === "no" ? <>Automatiser repeterende<br />oppgaver én gang.</> : <>Automate recurring<br />tasks once.</>}
              </h2>
              <p className="s-feature-desc">
                {t("Sett opp en oppgave én gang — Sine kjører den automatisk til rett tid, hver gang. Ukentlige rapporter, daglige e-poster, månedlige analyser.", "Set up a task once — Sine runs it automatically at the right time, every time. Weekly reports, daily emails, monthly analyses.")}
              </p>
              <ul className="s-feature-bullets">
                {[t("Daglig, ukentlig, månedlig eller tilpasset frekvens","Daily, weekly, monthly or custom frequency"),t("Kjøres i norsk tid (CET/CEST)","Runs in Norwegian time (CET/CEST)"),t("Kobles til connectors for automatisk utførelse","Connects to connectors for automatic execution"),t("Manuell kjøring for testing","Manual run for testing")].map((item) => (
                  <li key={item}><span className="s-bullet-check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── FEATURE: CONNECTORS ──────────────────────────────────────────── */}
      <section className="s-feature-section">
        <FadeIn>
          <div className="s-feature-grid s-container">
            <div className="s-feature-img">
              <div className="s-nature-bg" style={{backgroundImage: `url(${BG_WATERFALL})`}}>
                <img src={IMG_CONNECTORS} alt="Sine Connectors" />
              </div>
            </div>
            <div className="s-feature-text">
              <p className="s-label">{t("Connectors", "Connectors")}</p>
              <h2 className="s-h3">
                {lang === "no" ? <>Koble til verktøyene<br />du allerede bruker.</> : <>Connect to the tools<br />you already use.</>}
              </h2>
              <p className="s-feature-desc">
                {t("Sine integrerer direkte med Gmail, Meta Ads, Google Calendar, Instagram, GitHub og mer. Ingen koding nødvendig.", "Sine integrates directly with Gmail, Meta Ads, Google Calendar, Instagram, GitHub and more. No coding required.")}
              </p>
              <ul className="s-feature-bullets">
                {[t("Gmail — send og les e-post automatisk","Gmail — send and read emails automatically"),t("Meta Ads — oppdater budsjetter og annonser","Meta Ads — update budgets and ads"),t("GitHub — push kode og les repositories","GitHub — push code and read repositories"),t("Instagram — post innhold og analyser","Instagram — post content and analyze")].map((item) => (
                  <li key={item}><span className="s-bullet-check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── FEATURE: LIBRARY ─────────────────────────────────────────────── */}
      <section className="s-feature-section">
        <FadeIn>
          <div className="s-feature-grid s-feature-grid--rev s-container">
            <div className="s-feature-img">
              <div className="s-nature-bg" style={{backgroundImage: `url(${BG_STAVE})`}}>
                <img src={IMG_LIBRARY} alt="Sine Bibliotek" />
              </div>
            </div>
            <div className="s-feature-text">
              <p className="s-label">{t("Bibliotek", "Library")}</p>
              <h2 className="s-h3">
                {lang === "no" ? <>Alt Sine lager,<br />samlet på ett sted.</> : <>Everything Sine creates,<br />in one place.</>}
              </h2>
              <p className="s-feature-desc">
                {t("Rapporter, bilder, kode, regneark — alt Sine produserer lagres automatisk i biblioteket ditt, organisert og søkbart.", "Reports, images, code, spreadsheets — everything Sine produces is automatically saved to your library, organized and searchable.")}
              </p>
              <ul className="s-feature-bullets">
                {[t("Automatisk organisering etter filtype","Automatic organization by file type"),t("Søk på tvers av alle filer og samtaler","Search across all files and conversations"),t("Last ned eller del direkte fra biblioteket","Download or share directly from the library"),t("Koblet til samtalen som skapte filen","Linked to the conversation that created the file")].map((item) => (
                  <li key={item}><span className="s-bullet-check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── FREEDOM GRID ─────────────────────────────────────────────────── */}
      <section className="s-section s-section--gray">
        <FadeIn>
          <div className="s-container">
            <div className="s-section-header">
              <p className="s-label">{t("Frihet til å fokusere", "Freedom to focus")}</p>
              <h2 className="s-h2">{t("Alt du trenger.\nIngenting du ikke trenger.", "Everything you need.\nNothing you don't.")}</h2>
            </div>
            <div className="s-freedom-grid">
              {FREEDOM_CARDS.map((card, i) => (
                <FadeIn key={card.title} delay={i * 80}>
                  <div className="s-freedom-card">
                    <div className="s-freedom-icon">{card.icon}</div>
                    <div className="s-freedom-title">{card.title}</div>
                    <div className="s-freedom-desc">{card.desc}</div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── 3-STEP GUIDE ─────────────────────────────────────────────────── */}
      <section className="s-section">
        <FadeIn>
          <div className="s-container--narrow">
            <div className="s-section-header">
              <p className="s-label">{t("Kom i gang på 3 minutter", "Get started in 3 minutes")}</p>
              <h2 className="s-h2">{t("Enkelt å starte.\nKraftfullt å bruke.", "Simple to start.\nPowerful to use.")}</h2>
            </div>
            <div className="s-steps">
              {steps.map((step, i) => (
                <div className="s-step" key={step.title}>
                  <div className="s-step-num">{i + 1}</div>
                  <div>
                    <div className="s-step-title">{step.title}</div>
                    <div className="s-step-desc">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="s-steps-cta">
              <button onClick={onEnterApp} className="s-btn-primary">
                {t("Start nå — gratis", "Start now — free")}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section className="s-section s-section--gray" id="pricing">
        <FadeIn>
          <div className="s-container">
            <div className="s-section-header">
              <p className="s-label">{t("Priser", "Pricing")}</p>
              <h2 className="s-h2">{t("Enkle, transparente priser.", "Simple, transparent pricing.")}</h2>
              <p className="s-section-sub">
                {t("Ingen skjulte kostnader. Betal kun for det du bruker.", "No hidden costs. Pay only for what you use.")}
              </p>
              <div style={{ display: "flex", justifyContent: "center", marginTop: "1.5rem" }}>
                <div className="s-billing-toggle">
                  <button className={`s-toggle-btn${billing === "monthly" ? " active" : ""}`} onClick={() => setBilling("monthly")}>{t("Månedlig", "Monthly")}</button>
                  <button className={`s-toggle-btn${billing === "yearly" ? " active" : ""}`} onClick={() => setBilling("yearly")}>
                    {t("Årlig", "Yearly")}
                    <span className="s-save-badge">{t("Spar 17%", "Save 17%")}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="s-pricing-grid">
              {PLANS.map((plan) => (
                <div key={plan.name} className={`s-pricing-card${plan.featured ? " s-pricing-card--featured" : ""}`}>
                  {plan.badge && <div className="s-pricing-badge">{lang === "no" ? plan.badge : plan.badgeEn}</div>}
                  <div className="s-pricing-name">{lang === "no" ? plan.name : plan.nameEn}</div>
                  <div className="s-pricing-price">
                    {lang === "no" ? (plan.price === "Kontakt" ? "Kontakt" : `kr ${billing === "yearly" && plan.price !== "0" ? Math.round(parseInt(plan.price) * 0.83) : plan.price}`) : (plan.priceEn ?? plan.price)}
                    {plan.period && <span>{lang === "no" ? plan.period : plan.periodEn}</span>}
                  </div>
                  <div className="s-pricing-desc">{lang === "no" ? plan.desc : plan.descEn}</div>
                  <hr className="s-pricing-hr" />
                  <ul className="s-pricing-features">
                    {(lang === "no" ? plan.features : plan.featuresEn).map((f) => (
                      <li key={f}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><polyline points="20 6 9 17 4 12"/></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={onEnterApp} className={`s-pricing-cta${plan.featured ? " primary" : ""}`}>
                    {lang === "no" ? plan.cta : plan.ctaEn}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="s-section" id="faq">
        <FadeIn>
          <div className="s-container--narrow">
            <div className="s-section-header">
              <p className="s-label">FAQ</p>
              <h2 className="s-h2">{t("Ofte stilte spørsmål", "Frequently asked questions")}</h2>
            </div>
            <div className="s-faq">
              {faq.map((item, i) => (
                <div key={i} className="s-faq-item">
                  <button className="s-faq-trigger" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{item.q}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: "transform 0.2s", transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)" }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {openFaq === i && <div className="s-faq-body">{item.a}</div>}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="s-cta-banner">
        <FadeIn>
          <h2 className="s-cta-h2">
            {lang === "no" ? <>Klar til å la Sine<br />gjøre jobben for deg?</> : <>Ready to let Sine<br />do the work for you?</>}
          </h2>
          <p className="s-cta-sub">
            {t("Gratis å starte. Ingen kredittkort nødvendig.", "Free to start. No credit card required.")}
          </p>
          <button onClick={onEnterApp} className="s-cta-btn">
            {t("Kom i gang gratis", "Get started free")}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </FadeIn>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="s-footer">
        <div className="s-footer-top">
          <div className="s-footer-brand">
            <img src={LOGO_LIGHT} alt="Sine" className="s-footer-logo" />
            <p className="s-footer-tagline">
              {t("Din norske AI-agent.\nMindre manuelt arbeid,\nmer intelligent automatisering.", "Your Norwegian AI agent.\nLess manual work,\nmore intelligent automation.")}
            </p>
          </div>

          <div className="s-footer-col">
            <h5>{t("Produkt", "Product")}</h5>
            <ul>
              <li><a href="#features">{t("Funksjoner", "Features")}</a></li>
              <li><a href="#pricing">{t("Priser", "Pricing")}</a></li>
              <li><button onClick={onEnterApp} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", font: "inherit", padding: 0 }}>{t("Appen", "App")}</button></li>
              <li><a href="#">{t("Oppdateringer", "Updates")}</a></li>
            </ul>
          </div>

          <div className="s-footer-col">
            <h5>{t("Ressurser", "Resources")}</h5>
            <ul>
              <li><a href="#">{t("Dokumentasjon", "Documentation")}</a></li>
              <li><a href="#">{t("API", "API")}</a></li>
              <li><a href="#">{t("Status", "Status")}</a></li>
              <li><a href="#">{t("Blogg", "Blog")}</a></li>
            </ul>
          </div>

          <div className="s-footer-col">
            <h5>{t("Selskap", "Company")}</h5>
            <ul>
              <li><a href="#">{t("Om Sine", "About Sine")}</a></li>
              <li><a href="https://jtec.no" target="_blank" rel="noopener noreferrer" style={{ fontSize: "1.5em", fontWeight: 600 }}>Johnsen Technology</a></li>
              <li><a href="#">{t("Kontakt", "Contact")}</a></li>
              <li><a href="#">{t("Karriere", "Careers")}</a></li>
            </ul>
          </div>

          <div className="s-footer-col">
            <h5>{t("Juridisk", "Legal")}</h5>
            <ul>
              <li><a href="#">{t("Personvern", "Privacy")}</a></li>
              <li><a href="#">{t("Vilkår", "Terms")}</a></li>
              <li><a href="#">{t("Informasjonskapsler", "Cookies")}</a></li>
              <li><a href="#">GDPR</a></li>
            </ul>
          </div>
        </div>

        <div className="s-footer-bottom">
          <div className="s-footer-social">
            <a href="#" aria-label="X / Twitter">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.858L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href="https://github.com/larsottojohnsen" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
            </a>
          </div>

          <div className="s-footer-copy">
            © {new Date().getFullYear()} <a href="https://jtec.no" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", fontSize: "1.5em", fontWeight: 600 }}>Johnsen Technology AS</a>. {t("Alle rettigheter forbeholdt.", "All rights reserved.")}
          </div>

          <div className="s-footer-toggles">
            <button className="s-toggle-pill" onClick={() => setLang(lang === "no" ? "en" : "no")}>
              🌐 {lang === "no" ? "English" : "Norsk"}
            </button>
            <button className="s-toggle-pill" onClick={() => setIsDark(d => !d)}>
              {isDark ? "☀️" : "🌙"} {isDark ? (lang === "no" ? "Lys modus" : "Light mode") : (lang === "no" ? "Mørk modus" : "Dark mode")}
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
