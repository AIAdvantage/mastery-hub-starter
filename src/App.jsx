import React, { useEffect, useMemo, useRef, useState } from "react";
import { SignIn, SignUp, useClerk, useUser } from "@clerk/clerk-react";
import { supabase } from "./lib/supabase.js";
import { MONTH6_CONTENT } from "./month6Content.js";

const CURRENT_MONTH_ID = "jul";

const MONTHS = [
  {
    id: "jun",
    label: "June",
    number: "June",
    status: "Hidden",
    hidden: true,
    focus: "Your AI Handles the Paperwork",
    outcome: "By the end of this month, you will have a paperwork system that fills forms, shows what is missing, and gets smarter after each run.",
    image: {
      src: "/month6/alternates/month6-paperwork-alt-1.png",
      alt: "A paperwork form preview used for June",
      kicker: "Current month",
      title: "June: Paperwork",
      caption: "Replay, guide, session prompts, and challenge in one path.",
    },
    resources: [
      {
        type: "Guide",
        title: "June Guide",
        description: "Complete the Paperwork workflow from workspace setup through skill installation.",
        status: "Start here",
      },
      {
        type: "Prompt Pack",
        title: "Live Materials",
        description: "Copy the setup, form-filling, and reset prompts directly into Claude Cowork.",
        status: "Use with guide",
      },
      {
        type: "Challenge Document",
        title: "Mastery Challenge #6: Build a Self-Improving Skill",
        description: "Build a DNA file, harness, working prompt, and installable skill. Run it three times on real data and submit what improved.",
        status: "Submit this month",
      },
      {
        type: "Replay",
        title: "June Recordings",
        description: "Watch the June replay in the AI Advantage Community.",
        status: "Watch replay",
        url: MONTH6_CONTENT.replayUrl,
      },
    ],
  },
  {
    id: "jul",
    label: "July",
    number: "July",
    status: "Current hub",
    focus: "July Guide Prep",
    upstream: "Get the accounts and tools ready before the guide opens.",
    outcome: "Create and sign into the core accounts, install Claude Desktop, and confirm your Claude plan is ready for the July guide.",
    image: {
      src: "/mastery-hero.png",
      alt: "Mastery Hub workspace preview for the current month",
      kicker: "Current month",
      title: "July Guide Prep",
      caption: "Prerequisites now. Full guide coming soon.",
    },
    resources: [
      { type: "Guide", title: "July Guide", description: "Create your GitHub, Lovable, and Mastery Hub access, then make sure Claude Desktop and your Claude plan are ready.", status: "Start here" },
      { type: "Materials", title: "Live Materials", description: "The July live materials will appear here when the training materials are ready.", status: "Coming soon" },
      { type: "Recordings", title: "July Recordings", description: "The July recordings will unlock after the live session.", status: "Coming soon" },
      { type: "Challenge Document", title: "July Challenge", description: "The July challenge will unlock after the guide is published.", status: "Coming soon" },
    ],
  },
  { id: "aug", label: "August", number: "August", status: "Upcoming", focus: "Write Your Book", upstream: "Legacy and knowledge transfer.", outcome: "Turn your expertise or story into a structured manuscript workflow.", resources: [] },
  { id: "sep", label: "September", number: "September", status: "Upcoming", focus: "AI Email Command Center", upstream: "Communication as leverage.", outcome: "Draft, triage, and summarize email so you only touch what matters.", resources: [] },
  { id: "oct", label: "October", number: "October", status: "Upcoming", focus: "Monthly Implementation", upstream: "Build one useful business system at a time.", outcome: "Create a repeatable workflow you can keep using after the live session ends.", resources: [] },
  { id: "nov", label: "November", number: "November", status: "Upcoming", focus: "Member Resources", upstream: "Turn learning into practical tools.", outcome: "Collect the guide, prompts, challenge, and winner showcase for the month in one place.", resources: [] },
  { id: "dec", label: "December", number: "December", status: "Upcoming", focus: "Year-End Mastery", upstream: "Review what worked and turn it into leverage for the next year.", outcome: "Use AI to review, summarize, and systemize your strongest wins from the year.", resources: [] },
];

const VISIBLE_MONTHS = MONTHS.filter((month) => !month.hidden);
const CURRENT_MONTH = MONTHS.find((month) => month.id === CURRENT_MONTH_ID) || VISIBLE_MONTHS[0] || MONTHS[0];

const HUB_FEATURES = [
  {
    name: "Monthly Resources",
    tag: "Learn",
    summary: "Choose the current month, start with the prerequisite checklist, then return when the full guide and prompts unlock.",
    includes: ["Month selector", "Prerequisites", "Guide status", "Prompt status"],
  },
  {
    name: "Challenges",
    tag: "Apply",
    summary: "The July challenge will open after the guide is published. Until then, use this area to see what is ready.",
    includes: ["Monthly status", "Prereq link", "Guide unlock", "Challenge unlock"],
  },
  {
    name: "Member Archive",
    tag: "Review",
    summary: "Browse past challenges and featured work so you can learn from what other members are building.",
    includes: ["Past submissions", "Winner examples", "Monthly collections", "Reusable ideas"],
  },
];

const HOME_VISUALS = [
  {
    src: "/month6/paperwork-folder-structure.png",
    alt: "Paperwork folder structure created for June",
    label: "Workspace",
    title: "Clean folder system",
  },
  {
    src: "/month6/alternates/month6-paperwork-alt-1.png",
    alt: "Filled form preview from the paperwork workflow",
    label: "Output",
    title: "Filled form preview",
  },
  {
    src: "/month6/claude-skills-panel.png",
    alt: "Claude skills panel with the Paperwork skill",
    label: "Skill",
    title: "Installed workflow",
  },
];

const ARCHIVE_ITEMS = [
  { month: "July", type: "Challenge", title: "July Challenge", status: "Coming soon" },
  { month: "August", type: "Challenge", title: "Write Your Book", status: "Coming soon" },
  { month: "September", type: "Challenge", title: "AI Email Command Center", status: "Coming soon" },
];

const SUBMISSION_STORAGE_KEY = "mastery-hub-submissions";

const TUTORIAL_STEPS = [
  "Start with the current month hub.",
  "Watch the tutorial and live training replays.",
  "Submit the monthly challenge from the submissions page.",
  "Browse the archive to learn from past member work.",
];

const NAV_ITEMS = [
  { path: "/", label: "Home" },
  { path: "/monthly-resources", label: "Monthly Resources" },
  { path: "/challenges", label: "Challenges" },
  { path: "/tutorial", label: "Tutorial" },
];

const MOD_HELP_URL = "https://community.aiadvantage.com/c/ask-answer-questions/";
const GUIDE_HELP_URL = "https://mastery.alfredos.app/monthly-resources/june/guide";
const CLAUDE_DESKTOP_URL = "https://claude.com/download";
const GITHUB_URL = "https://github.com/";
const LOVABLE_URL = "https://lovable.dev/";

const JULY_PREREQUISITES = [
  {
    label: "GitHub account created and logged in",
    detail: "Open GitHub and make sure you can access your account before the July guide.",
    link: GITHUB_URL,
    linkLabel: "Open GitHub",
  },
  {
    label: "Lovable account created and logged in",
    detail: "Open Lovable and confirm you can start from your workspace.",
    link: LOVABLE_URL,
    linkLabel: "Open Lovable",
  },
  {
    label: "Mastery Hub account created and logged in",
    detail: "Use the same email or Google account connected to your AI Mastery access.",
    link: "/sign-in",
    linkLabel: "Sign in to Mastery Hub",
    internal: true,
  },
  {
    label: "Claude Desktop installed",
    detail: "Install Claude Desktop on your computer so you are ready for the workflow when the guide opens.",
    link: CLAUDE_DESKTOP_URL,
    linkLabel: "Download Claude Desktop",
  },
  {
    label: "Claude Pro, Max, or Team active",
    detail: "Confirm your Claude plan is active and that you are signed into the account you plan to use during the guide.",
    link: "https://claude.com/settings/billing",
    linkLabel: "Check Claude plan",
  },
];

function monthGuideTitle(month) {
  return `${month.label} Guide`;
}

function monthRecordingsTitle(month) {
  return `${month.label} Recordings`;
}


const STEP_SUBHEADLINES = {
  "Step 1: Create Your Paperwork Folder + Connect Cowork": "Connect Claude Cowork to one clean workspace so it can create, read, and update your paperwork files.",
  "Step 2: Get Your Materials Bundle": "Download the June materials and let Claude unpack the exact folder structure for the workflow.",
  "Step 3: Paperwork Setup": "Use Igor's demo DNA to generate the first paperwork profile Claude will use to fill forms.",
  "Step 4: Review the Files": "Open the generated profile so you can see the kind of reusable information the system stores.",
  "Step 5: Fill Your Form": "Run the form-filling prompt and produce a completed W-8BEN from the profile Claude just built.",
  "Step 6: Read the Missing-Info Section": "Use Claude's gap list to see what the profile still needs before the next run.",
  "Step 7: Reset. Let Claude Clean Up.": "Clear the demo files while keeping the reusable workspace, prompts, form, and skill folder.",
  "Step 8: Install the Paperwork Skill": "Turn the workflow into an installed Claude skill so you can launch it from Cowork without pasting prompts.",
  "Step 9: Add YOUR DNA + Run the Skill": "Swap in your own DNA, run the skill, answer missing fields, and grow your paperwork profile.",
  "Step 10: Run the Skill Again (See the Compounding)": "Run a second form to watch the missing-info list shrink as your profile gets sharper.",
};

const BEFORE_START_ITEMS = [
  {
    label: "Your DNA files ready",
    detail: "Have your personal DNA and business DNA nearby. You will use them when the guide switches from Igor's demo files to your own files.",
  },
  {
    label: "Claude Pro, Max, or Team plan",
    detail: "Cowork is required for this workflow, so make sure you are signed into a Claude plan that includes it.",
  },
  {
    label: "Claude Desktop app installed",
    detail: "Install the desktop app before Step 1, then open the Cowork tab inside Claude.",
    link: CLAUDE_DESKTOP_URL,
    linkLabel: "Download Claude Desktop",
  },
  {
    label: "June Materials Bundle ZIP",
    detail: "Download the ZIP before Step 2. You will move it into your Paperwork folder and let Claude unpack it.",
    link: MONTH6_CONTENT.materialsUrl,
    linkLabel: "Download Materials Bundle ZIP",
  },
];

function getPath() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  if (path === "/monthly-hubs") return "/monthly-resources";
  if (path === "/challenge-archive") return "/challenges";
  if (path === "/submit") return "/challenges/july";
  return path;
}

export default function App() {
  const [path, setPath] = useState(getPath);
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH_ID);
  const [submissionStatus, setSubmissionStatus] = useState("");
  const [submissions, setSubmissions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SUBMISSION_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const currentMonth = useMemo(
    () => MONTHS.find((month) => month.id === selectedMonth) || CURRENT_MONTH,
    [selectedMonth]
  );
  const archiveRows = useMemo(
    () => [
      ...submissions.map((submission) => ({
        month: submission.month,
        type: "Member submission",
        title: submission.title,
        status: submission.status,
      })),
      ...ARCHIVE_ITEMS,
    ],
    [submissions]
  );

  useEffect(() => {
    function handlePopState() {
      setPath(getPath());
      window.scrollTo({ top: 0 });
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigate(nextPath, options = {}) {
    if (nextPath === path) return;
    if (options.replace) {
      window.history.replaceState({}, "", nextPath);
    } else {
      window.history.pushState({}, "", nextPath);
    }
    setPath(nextPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const submission = {
      id: crypto.randomUUID(),
      month: data.get("month"),
      member_name: data.get("memberName"),
      title: data.get("title"),
      share_link: data.get("shareLink"),
      notes: data.get("notes"),
      status: "Submitted for review",
      created_at: new Date().toISOString(),
    };

    setSubmissionStatus("Saving submission...");

    if (supabase) {
      const { error } = await supabase.from("mastery_challenge_submissions").insert(submission);
      if (error) {
        setSubmissionStatus("Your submission was saved. The team can review it from the latest queue.");
      } else {
        setSubmissionStatus("Submission received. Nice work.");
      }
    } else {
      setSubmissionStatus("Submission received. Nice work.");
    }

    const nextSubmissions = [submission, ...submissions].slice(0, 8);
    setSubmissions(nextSubmissions);
    localStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify(nextSubmissions));
    form.reset();
  }

  const isAuthPath = path === "/sign-in" || path === "/sign-up";
  const isLayoutLabPath = path === "/homepage-layouts";

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => navigate("/")} aria-label="AI Mastery home">
          <span className="brand-mark">AI</span>
          <span>Mastery Hub</span>
        </button>

        <nav className="nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              className={item.path === "/" ? (path === "/" ? "active" : "") : (path.startsWith(item.path) ? "active" : "")}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <AuthStatus navigate={navigate} />
      </header>

      <main>
        {isAuthPath && <AuthPage mode={path === "/sign-up" ? "signUp" : "signIn"} navigate={navigate} />}
        {!isAuthPath && isLayoutLabPath && <HomepageLayoutLab navigate={navigate} />}
        {!isAuthPath && path === "/" && <HomePage navigate={navigate} />}
        {!isAuthPath && path.startsWith("/monthly-resources") && (
          <MonthlyResourcesPage
            currentMonth={currentMonth}
            path={path}
            navigate={navigate}
          />
        )}
        {!isAuthPath && path.startsWith("/challenges") && (
          <ChallengesPage
            archiveRows={archiveRows}
            handleSubmit={handleSubmit}
            path={path}
            navigate={navigate}
            submissionStatus={submissionStatus}
            submissions={submissions}
          />
        )}
        {!isAuthPath && path === "/tutorial" && <TutorialPage />}
        {!isAuthPath && !isLayoutLabPath && !path.startsWith("/monthly-resources") && !path.startsWith("/challenges") && !NAV_ITEMS.some((item) => item.path === path) && <HomePage navigate={navigate} />}
      </main>
    </div>
  );
}

function AuthStatus({ navigate }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  async function handleSignOut() {
    setIsMenuOpen(false);
    await signOut({ redirectUrl: "/" });
  }

  if (isLoaded && isSignedIn) {
    return (
      <div className="member-menu">
        <span className="member-pill">
          <span className="status-dot" />
          Member access
        </span>
        <div className="account-menu" ref={menuRef}>
          <button
            className="account-trigger"
            type="button"
            aria-label="Open account menu"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="" />
            ) : (
              <span>{user?.firstName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || "M"}</span>
            )}
          </button>
          {isMenuOpen && (
            <div className="account-dropdown" role="menu" aria-label="Account menu">
              <a
                href={MOD_HELP_URL}
                target="_blank"
                rel="noreferrer"
                role="menuitem"
                onClick={() => setIsMenuOpen(false)}
              >
                AIA Club
              </a>
              <button type="button" role="menuitem" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <button className="signin" type="button" onClick={() => navigate("/sign-in")}>
      <span className="status-dot status-dot-muted" />
      Sign in
    </button>
  );
}

function AuthPage({ mode, navigate }) {
  const isSignUp = mode === "signUp";
  const [authStalled, setAuthStalled] = useState(false);

  useEffect(() => {
    setAuthStalled(false);
    const timer = window.setTimeout(() => {
      const hasClerkFields = Boolean(
        document.querySelector(".auth-panel input, .auth-panel [data-clerk-element]")
      );
      if (!hasClerkFields) setAuthStalled(true);
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [mode]);

  return (
    <section className="auth-shell" aria-label="Mastery Hub member sign in">
      <div className="auth-copy">
        <p className="section-kicker">Private member platform</p>
        <h1>{isSignUp ? "Create your Mastery access." : "Sign in to Mastery Hub."}</h1>
        <p>
          Use the email or Google account connected to your AI Mastery access.
        </p>
        <div className="auth-switch">
          {isSignUp ? (
            <button type="button" onClick={() => navigate("/sign-in")}>Already have access? Sign in</button>
          ) : (
            <button type="button" onClick={() => navigate("/sign-up")}>Need access? Create account</button>
          )}
        </div>
      </div>
      <div className="auth-panel">
        {authStalled && (
          <div className="auth-fallback" role="status">
            <span className="status-dot status-dot-muted" />
            <h2>Member sign-in is not connected on this domain yet.</h2>
            <p>
              The hub is ready for member access, but the authentication provider needs to allow this live domain before the fields can appear.
            </p>
          </div>
        )}
        {isSignUp ? (
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/"
            appearance={clerkAppearance}
          />
        ) : (
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/"
            appearance={clerkAppearance}
          />
        )}
      </div>
    </section>
  );
}

const clerkAppearance = {
  variables: {
    colorPrimary: "#8f6929",
    colorText: "#312820",
    colorTextSecondary: "#76695d",
    colorBackground: "#fffdf8",
    colorInputBackground: "#fffdf8",
    colorInputText: "#312820",
    borderRadius: "8px",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  elements: {
    cardBox: "clerk-card-box",
    card: "clerk-card",
    headerTitle: "clerk-title",
    headerSubtitle: "clerk-subtitle",
    formButtonPrimary: "clerk-primary-button",
  },
};

function HomePage({ navigate }) {
  const [mapGlow, setMapGlow] = useState({ x: 62, y: 34, active: false });
  const currentMonth = CURRENT_MONTH;

  function handleMapMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    setMapGlow({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
      active: true,
    });
  }

  return (
    <>
      <section
        className={`hero command-hero ${mapGlow.active ? "map-active" : ""}`}
        style={{
          "--map-glow-x": `${mapGlow.x}%`,
          "--map-glow-y": `${mapGlow.y}%`,
        }}
        onPointerMove={handleMapMove}
        onPointerLeave={() => setMapGlow((current) => ({ ...current, active: false }))}
      >
        <div className="hero-bg" />
        <div className="map-glow" aria-hidden="true" />
        <div className="hero-overlay" />
        <div className="hero-inner">
          <div className="hero-content">
            <p className="eyebrow">Private member platform</p>
            <h1>Mastery Hub</h1>
            <p className="hero-copy">
              Start with the right next step. Monthly resources, challenges, and member examples, organized around what to do this month.
            </p>
            <div className="hero-actions">
              <button onClick={() => navigate("/monthly-resources")}>Open Monthly Resources</button>
              <button className="secondary" onClick={() => navigate("/challenges")}>
                Open Challenges
              </button>
            </div>
          </div>
          <div
            className="hero-current-panel"
            aria-label="Current month"
            style={{ "--month-image": `url(${currentMonth.image.src})` }}
          >
            <div className="hero-current-copy">
              <span>{currentMonth.image.kicker}</span>
              <strong>{currentMonth.image.title}</strong>
              <small>{currentMonth.image.caption}</small>
              <button type="button" onClick={() => navigate("/monthly-resources/july")}>Open July</button>
            </div>
          </div>
        </div>
      </section>

      <section className="section home-system" aria-labelledby="plans-title">
        <div className="section-heading home-system-heading">
          <p className="section-kicker">How to use the hub</p>
          <h2 id="plans-title">Learn the system, apply it, then study what worked.</h2>
          <p className="muted">July starts with the setup checklist. The full guide, prompts, and challenge will appear here when the training materials are ready.</p>
        </div>
        <div className="plan-grid">
          {HUB_FEATURES.map((feature) => (
            <article className="plan-card" key={feature.name}>
              <div className="plan-topline">
                <span>{feature.tag}</span>
                <small>{feature.includes.length} parts</small>
              </div>
              <h3>{feature.name}</h3>
              <p>{feature.summary}</p>
              <ul>
                {feature.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function HomepageLayoutLab({ navigate }) {
  const layouts = [
    {
      id: "command",
      eyebrow: "Option 1",
      title: "Command Center",
      description: "Best if the homepage should feel like the member’s starting point. Clear actions first, current month second, visuals supporting the workflow.",
      className: "layout-command",
    },
    {
      id: "path",
      eyebrow: "Option 2",
      title: "Monthly Path",
      description: "Best if we want beginners to instantly understand the sequence: replay, guide, prompts, challenge. Very clear, very calm.",
      className: "layout-path",
    },
    {
      id: "showcase",
      eyebrow: "Option 3",
      title: "Visual Showcase",
      description: "Best if the homepage should feel more premium and visual. It leads with real screenshots and makes the Hub feel alive.",
      className: "layout-showcase",
    },
  ];

  return (
    <section className="layout-lab" aria-labelledby="layout-lab-title">
      <div className="layout-lab-head">
        <p className="section-kicker">Homepage layout lab</p>
        <h1 id="layout-lab-title">Three alternate homepage directions.</h1>
        <p>
          Same Warm Paper style, different structure. Pick the one that feels clearest for Mastery members.
        </p>
      </div>
      <div className="layout-lab-grid">
        {layouts.map((layout) => (
          <LayoutPreview key={layout.id} layout={layout} navigate={navigate} />
        ))}
      </div>
    </section>
  );
}

function LayoutPreview({ layout, navigate }) {
  if (layout.id === "command") {
    return (
      <article className={`layout-preview ${layout.className}`}>
        <LayoutIntro layout={layout} />
        <div className="command-preview-grid">
          <div className="command-preview-main">
            <p className="section-kicker">Private member platform</p>
            <h2>Start with the right next step.</h2>
            <p>Monthly resources, challenges, and member examples, organized around what to do this month.</p>
            <div className="preview-actions">
              <button type="button" onClick={() => navigate("/monthly-resources")}>Open Monthly Resources</button>
              <button type="button" onClick={() => navigate("/challenges")}>Open Challenges</button>
            </div>
          </div>
          <div className="command-preview-panel">
            <span>Current month</span>
            <strong>June: Paperwork</strong>
            <small>Replay, guide, session prompts, and challenge in one path.</small>
          </div>
        </div>
      </article>
    );
  }

  if (layout.id === "path") {
    const steps = ["Replay", "Guide", "Prompts", "Challenge"];

    return (
      <article className={`layout-preview ${layout.className}`}>
        <LayoutIntro layout={layout} />
        <div className="path-preview">
          <div>
            <p className="section-kicker">June</p>
            <h2>Your AI Handles the Paperwork</h2>
            <p>Follow the month in order. Watch the session, use the guide, copy the prompts, then submit the challenge.</p>
          </div>
          <div className="path-steps" aria-label="Monthly resource path">
            {steps.map((step, index) => (
              <div className="path-step" key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={`layout-preview ${layout.className}`}>
      <LayoutIntro layout={layout} />
      <div className="showcase-preview">
        <div className="showcase-copy">
          <p className="section-kicker">What members are building</p>
          <h2>Build the system once. Reuse it every time.</h2>
          <p>Real workflow visuals carry the homepage, with the main actions underneath instead of competing for attention.</p>
        </div>
        <div className="showcase-shots">
          {HOME_VISUALS.map((visual) => (
            <img key={visual.src} src={visual.src} alt="" loading="lazy" />
          ))}
        </div>
      </div>
    </article>
  );
}

function LayoutIntro({ layout }) {
  return (
    <div className="layout-intro">
      <span>{layout.eyebrow}</span>
      <h2>{layout.title}</h2>
      <p>{layout.description}</p>
    </div>
  );
}

function MonthlyResourcesPage({ currentMonth, path, navigate }) {
  const segment = path.split("/")[2] || "";
  const pageMonth = MONTHS.find((month) => month.label.toLowerCase() === segment) || currentMonth;

  if (path === "/monthly-resources") {
    return (
      <section className="section page-section month-section" aria-labelledby="months-title">
        <Breadcrumbs items={[{ label: "Monthly Resources" }]} navigate={navigate} />
        <div className="section-heading">
          <p className="section-kicker">Monthly resources</p>
          <h1 id="months-title" className="page-title">Choose your month.</h1>
          <p className="muted">Open the current month to find the guide prep materials. Future months unlock when they go live.</p>
        </div>
        <MonthChoiceGrid activeId={CURRENT_MONTH_ID} basePath="/monthly-resources" navigate={navigate} />
      </section>
    );
  }

  if (path.startsWith("/monthly-resources/june")) {
    return <RedirectRoute to="/monthly-resources/july" navigate={navigate} />;
  }

  if (path === "/monthly-resources/july/guide" || path === "/monthly-resources/july/prerequisites") {
    return <JulyPrerequisitesPage navigate={navigate} />;
  }

  if (path.startsWith("/monthly-resources/july/guide/")) {
    return <RedirectRoute to="/monthly-resources/july/guide" navigate={navigate} />;
  }

  if (path === "/monthly-resources/june/guide") {
    return <GuidePage navigate={navigate} />;
  }

  if (path.startsWith("/monthly-resources/june/guide/")) {
    return <RedirectRoute to="/monthly-resources/june/guide" navigate={navigate} />;
  }

  if (path === "/monthly-resources/june/prompts") {
    return <SessionPromptsPage navigate={navigate} />;
  }

  return <MonthResourcesMenu month={pageMonth} segment={segment} navigate={navigate} />;
}

function MonthResourcesMenu({ month, segment, navigate }) {
  if (segment === "july") {
    return <JulyResourcesMenu month={month} navigate={navigate} />;
  }

  if (segment !== "june") {
    return <UpcomingMonth month={month} navigate={navigate} />;
  }

  const guideTitle = monthGuideTitle(month);
  const recordingsTitle = monthRecordingsTitle(month);

  return (
    <section className="section page-section month-section" aria-label={`${month.label} paperwork resources`}>
      <Breadcrumbs
        items={[
          { label: "Monthly Resources", path: "/monthly-resources" },
          { label: "June" },
        ]}
        navigate={navigate}
      />
      <MonthVisualCard
        month={month}
        actionLabel="Open the Guide"
        onAction={() => navigate("/monthly-resources/june/guide")}
      />
      <div className="resource-grid resource-grid-three">
        <a className="resource-card resource-card-link" href={MONTH6_CONTENT.replayUrl} target="_blank" rel="noreferrer">
          <div className="resource-card-top">
            <span>Replay</span>
          </div>
          <h4>{recordingsTitle}</h4>
          <p>Watch the live session replay before or during the guide walkthrough.</p>
        </a>
        <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/monthly-resources/june/guide")}>
          <div className="resource-card-top">
            <span>Guide</span>
          </div>
          <h4>{guideTitle}</h4>
          <p>Open the full step-by-step guide with screenshots and the materials download.</p>
        </button>
        <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/monthly-resources/june/prompts")}>
          <div className="resource-card-top">
            <span>Live materials</span>
          </div>
          <h4>Live Materials</h4>
          <p>Copy the prompts for following along with the replay and running the workflow.</p>
        </button>
      </div>
    </section>
  );
}

function JulyResourcesMenu({ month, navigate }) {
  const guideTitle = monthGuideTitle(month);
  const recordingsTitle = monthRecordingsTitle(month);

  return (
    <section className="section page-section month-section" aria-label="July resources">
      <Breadcrumbs
        items={[
          { label: "Monthly Resources", path: "/monthly-resources" },
          { label: "July" },
        ]}
        navigate={navigate}
      />
      <MonthVisualCard
        month={month}
        actionLabel="Open Prerequisites"
        onAction={() => navigate("/monthly-resources/july/guide")}
      />
      <div className="resource-grid resource-grid-three">
        <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/monthly-resources/july/guide")}>
          <div className="resource-card-top">
            <span>Guide</span>
            <small>Start here</small>
          </div>
          <h4>{guideTitle}</h4>
          <p>Confirm GitHub, Lovable, Mastery Hub, Claude Desktop, and your Claude plan before the guide opens.</p>
        </button>
        <article className="resource-card">
          <div className="resource-card-top">
            <span>Live materials</span>
            <small>Coming soon</small>
          </div>
          <h4>Live Materials</h4>
          <p>The slides, prompts, and downloads from the live session will appear here when they are ready.</p>
        </article>
        <article className="resource-card">
          <div className="resource-card-top">
            <span>Recordings</span>
            <small>Coming soon</small>
          </div>
          <h4>{recordingsTitle}</h4>
          <p>The July live session recording will appear here after the session is complete.</p>
        </article>
      </div>
    </section>
  );
}

function MonthVisualCard({ month = CURRENT_MONTH, actionLabel, onAction }) {
  const image = month.image || CURRENT_MONTH.image;

  return (
    <article className="month-visual-card" aria-label={`${month.label} month visual card`}>
      <div className="month-visual-copy">
        <p className="section-kicker">{month.number}</p>
        <h3>{month.focus}</h3>
        <p>
          {month.outcome}
        </p>
        {actionLabel && (
          <button type="button" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
      <figure className="month-image-panel">
        <img src={image.src} alt={image.alt} loading="lazy" />
        <figcaption>
          <span>{image.kicker}</span>
          <strong>{image.title}</strong>
          <small>{image.caption}</small>
        </figcaption>
      </figure>
    </article>
  );
}

function GuidePage({ navigate }) {
  const guide = useMemo(() => getGuideModel(MONTH6_CONTENT.guide), []);

  return (
    <section className="section page-section month-section has-hover-toc" aria-labelledby="guide-title">
      <HoverTableOfContents title="Guide contents" items={guide.tocItems} />
      <Breadcrumbs
        items={[
          { label: "Monthly Resources", path: "/monthly-resources" },
          { label: "June", path: "/monthly-resources/june" },
          { label: "Guide" },
        ]}
        navigate={navigate}
      />
      <section className="resource-section guide-workbench-section">
        <div className="resource-section-head">
          <div>
            <p className="section-kicker">Guide</p>
            <h1 id="guide-title" className="page-title">June Guide: Fill Any Form with Claude</h1>
            <p>Build a paperwork system that fills forms from your DNA, shows what is missing, and gets smarter every time you run it.</p>
          </div>
          <LinkButton href={MONTH6_CONTENT.materialsUrl}>Download Materials</LinkButton>
      </div>
      <div className="workbench-layout">
        <div className="workbench-stack">
          {guide.introSections.map((section) => (
            <IntroSectionCard section={section} key={section.title} />
          ))}
          {guide.steps.map((step, index) => (
            <article className="workbench-step" id={step.id} key={step.id}>
              <div className="workbench-step-top">
                <small>{String(index + 1).padStart(2, "0")}</small>
                <StepHelpActions guide={guide} step={step} stepNumber={index + 1} />
              </div>
              <h3>{step.title}</h3>
              <p className="workbench-step-subtitle">{step.summary}</p>
              <MarkdownBlocks blocks={step.blocks} />
            </article>
          ))}
          {guide.closingSections.map((section) => (
            <article className="workbench-step workbench-close" id={section.id} key={section.title}>
              <div className="workbench-step-top">
                <span>Finish</span>
              </div>
              <h3>{section.title}</h3>
              <MarkdownBlocks blocks={section.blocks} />
            </article>
          ))}
        </div>
      </div>
      </section>
    </section>
  );
}

function HoverTableOfContents({ title = "Contents", items = [] }) {
  const [activeId, setActiveId] = useState(items[0]?.id || "");

  useEffect(() => {
    if (!items.length) return undefined;

    const hashId = window.location.hash.replace("#", "");
    if (hashId && items.some((item) => item.id === hashId)) {
      setActiveId(hashId);
    }

    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean);

    if (!sections.length || !("IntersectionObserver" in window)) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveId(visible.target.id);
        }
      },
      {
        rootMargin: "-18% 0px -68% 0px",
        threshold: [0.01, 0.2, 0.45],
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <nav className="hover-toc" aria-label={title}>
      <div className="hover-toc-tab" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="hover-toc-panel">
        <div className="hover-toc-head">
          <span>{title}</span>
        </div>
        <div className="hover-toc-list">
          {items.map((item) => (
            <a
              className={`hover-toc-link hover-toc-link-${item.level || 1}${activeId === item.id ? " active" : ""}`}
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setActiveId(item.id)}
            >
              <span>{item.marker}</span>
              <strong>{item.label}</strong>
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

function guideTocItems(guide) {
  return [
    ...guide.introSections.map((section, index) => ({
      id: section.id,
      marker: index === 0 ? "Start" : "Prep",
      label: section.title,
      level: 1,
    })),
    ...guide.steps.map((step) => ({
      id: step.id,
      marker: String(step.stepNumber).padStart(2, "0"),
      label: step.shortTitle,
      level: 1,
    })),
    ...guide.closingSections.map((section) => ({
      id: section.id,
      marker: "End",
      label: section.title,
      level: 1,
    })),
  ];
}

function markdownTocItems(content) {
  const blocks = buildMarkdownBlocks(content);
  const seen = new Map();

  return blocks
    .filter((block) => block.type === "h3" || block.type === "h4")
    .map((block) => {
      const baseId = sectionId(block.text);
      const nextCount = (seen.get(baseId) || 0) + 1;
      seen.set(baseId, nextCount);
      const id = nextCount === 1 ? baseId : `${baseId}-${nextCount}`;
      return {
        id,
        marker: block.type === "h3" ? "Part" : "Step",
        label: block.text,
        level: block.type === "h3" ? 1 : 2,
      };
    });
}

function blocksWithHeadingIds(content) {
  const seen = new Map();

  return buildMarkdownBlocks(content).map((block) => {
    if (block.type !== "h3" && block.type !== "h4" && block.type !== "h5") return block;
    const baseId = sectionId(block.text);
    const nextCount = (seen.get(baseId) || 0) + 1;
    seen.set(baseId, nextCount);
    return {
      ...block,
      id: nextCount === 1 ? baseId : `${baseId}-${nextCount}`,
    };
  });
}

function MarkdownHeading({ block }) {
  const Tag = block.type;

  return (
    <Tag id={block.id}>
      {renderInlineMarkdown(block.text)}
    </Tag>
  );
}

function IntroSectionCard({ section }) {
  const isBeforeStart = section.title === "Before You Start";

  if (!isBeforeStart) {
    return (
      <article className="workbench-step workbench-intro" id={section.id}>
        <div className="workbench-step-top">
          <span>Prep</span>
        </div>
        <h3>{section.title}</h3>
        <MarkdownBlocks blocks={section.blocks} />
      </article>
    );
  }

  return (
    <article className="workbench-step workbench-intro before-start-card" id={section.id}>
      <div className="workbench-step-top">
        <span>Prep checklist</span>
      </div>
      <div className="before-start-layout">
        <div>
          <h3>{section.title}</h3>
          <p className="workbench-step-subtitle">
            Get these four pieces ready before you start the Paperwork workflow.
          </p>
        </div>
      </div>
      <BeforeStartChecklist />
    </article>
  );
}

function BeforeStartChecklist() {
  return (
    <div className="before-start-checklist">
      {BEFORE_START_ITEMS.map((item) => (
        <div className="before-start-item" key={item.label}>
          <span className="before-start-check" aria-hidden="true" />
          <div>
            <strong>{item.label}</strong>
            <p>{item.detail}</p>
            {item.link && (
              <LinkButton href={item.link}>{item.linkLabel}</LinkButton>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StepHelpActions({ guide, step, stepNumber }) {
  const [status, setStatus] = useState("");

  async function handleModHelp() {
    await copyText(buildModHelpMessage(step, stepNumber));
    setStatus("Mod message copied");
    window.setTimeout(() => setStatus(""), 1800);
  }

  async function handleAiHelp() {
    await copyText(buildAiHelpMessage(guide, step, stepNumber));
    setStatus("AI context copied");
    window.setTimeout(() => setStatus(""), 1800);
  }

  return (
    <div className="step-help-actions" aria-label={`Help actions for ${step.title}`}>
      <button type="button" onClick={handleAiHelp}>Ask AI</button>
      <a href={MOD_HELP_URL} target="_blank" rel="noreferrer" onClick={handleModHelp}>Ask mods</a>
      {status && <span role="status">{status}</span>}
    </div>
  );
}

function RedirectRoute({ to, navigate }) {
  useEffect(() => {
    navigate(to, { replace: true });
  }, [navigate, to]);

  return (
    <section className="section page-section">
      <p className="muted">Opening the current month...</p>
    </section>
  );
}

function JulyPrerequisitesPage({ navigate }) {
  return (
    <section className="section page-section month-section" aria-labelledby="july-prerequisites-title">
      <Breadcrumbs
        items={[
          { label: "Monthly Resources", path: "/monthly-resources" },
          { label: "July", path: "/monthly-resources/july" },
          { label: "Prerequisites" },
        ]}
        navigate={navigate}
      />
      <section className="resource-section">
        <div className="resource-section-head">
          <div>
            <p className="section-kicker">July guide prep</p>
            <h1 id="july-prerequisites-title" className="page-title">Get ready before the July guide opens.</h1>
            <p>Complete these setup steps now so you can jump straight into the workflow when the full guide is published.</p>
          </div>
        </div>
        <div className="before-start-checklist">
          {JULY_PREREQUISITES.map((item, index) => (
            <div className="before-start-item" key={item.label}>
              <span className="before-start-check" aria-label={`Step ${index + 1}`} />
              <div>
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
                {item.internal ? (
                  <button type="button" className="link-button" onClick={() => navigate(item.link)}>
                    {item.linkLabel}
                  </button>
                ) : (
                  <LinkButton href={item.link}>{item.linkLabel}</LinkButton>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

function SessionPromptsPage({ navigate }) {
  return (
    <section className="section page-section month-section" aria-labelledby="prompts-title">
      <Breadcrumbs
        items={[
          { label: "Monthly Resources", path: "/monthly-resources" },
          { label: "June", path: "/monthly-resources/june" },
          { label: "Live Materials" },
        ]}
        navigate={navigate}
      />
      <section className="resource-section">
        <div className="resource-section-head">
          <div>
            <p className="section-kicker">Prompts</p>
            <h1 id="prompts-title" className="page-title">June Live Materials</h1>
            <p>Use these prompts while following the replay. Copy each prompt into Claude Cowork at the matching step.</p>
          </div>
          <LinkButton href={MONTH6_CONTENT.materialsUrl}>Download Materials</LinkButton>
        </div>
        <div className="prompt-list">
          {MONTH6_CONTENT.prompts.map((prompt) => (
            <PromptCard key={prompt.title} prompt={prompt} />
          ))}
        </div>
      </section>
    </section>
  );
}

function UpcomingMonth({ month, navigate }) {
  return (
    <section className="section page-section month-section">
      <Breadcrumbs
        items={[
          { label: "Monthly Resources", path: "/monthly-resources" },
          { label: month.label },
        ]}
        navigate={navigate}
      />
      <div className="section-heading">
        <p className="section-kicker">{month.number}</p>
        <h1 className="page-title">{month.focus}</h1>
        <p className="muted">This month is not open yet. The replay, guide, and session prompts will appear here when it goes live.</p>
      </div>
    </section>
  );
}

function Breadcrumbs({ items, navigate }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <button type="button" onClick={() => navigate("/")}>Home</button>
      {items.map((item) => (
        <React.Fragment key={item.label}>
          <span>/</span>
          {item.path ? (
            <button type="button" onClick={() => navigate(item.path)}>{item.label}</button>
          ) : (
            <strong>{item.label}</strong>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

function MonthChoiceGrid({ activeId, basePath, navigate }) {
  return (
    <div className="month-choice-grid" aria-label="Mastery months">
      {VISIBLE_MONTHS.map((month) => {
        const isActive = month.id === activeId;
        return (
          <button
            key={month.id}
            type="button"
            className={`month-choice ${isActive ? "active" : "disabled"}`}
            disabled={!isActive}
            onClick={() => navigate(`${basePath}/${month.label.toLowerCase()}`)}
          >
            {month.image && (
              <img className="month-choice-image" src={month.image.src} alt="" loading="lazy" />
            )}
            <span>{month.label}</span>
            <small>{month.number}</small>
            <strong>{isActive ? "Current" : "Coming soon"}</strong>
          </button>
        );
      })}
    </div>
  );
}

function LinkButton({ href, children }) {
  return (
    <a className="link-button" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

function PromptCard({ prompt }) {
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt.text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <details className="prompt-card">
      <summary>
        <span>{prompt.title}</span>
        <small>Open prompt</small>
      </summary>
      <div className="prompt-actions">
        <button type="button" onClick={copyPrompt}>{copied ? "Copied" : "Copy prompt"}</button>
      </div>
      <pre>{prompt.text}</pre>
    </details>
  );
}

function GuideImageGallery({ images = [] }) {
  if (!images.length) return null;

  return (
    <div className="guide-image-gallery" aria-label="Guide screenshots">
      {images.map((image) => (
        <figure key={image.src}>
          <img src={image.src} alt={image.alt} loading="lazy" />
          <figcaption>{image.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function MarkdownBlocks({ blocks }) {
  return (
    <div className="markdown-document markdown-document-embedded">
      {blocks.map((block, index) => <MarkdownBlock key={`${index}-${block.type}-${block.text?.slice(0, 12)}`} block={block} />)}
    </div>
  );
}

function MarkdownDocument({ content }) {
  const blocks = useMemo(() => blocksWithHeadingIds(content), [content]);

  return (
    <div className="markdown-document">
      {blocks.map((block, index) => <MarkdownBlock key={`${index}-${block.type}-${block.text?.slice(0, 12)}`} block={block} />)}
    </div>
  );
}

function getGuideModel(content) {
  const sections = splitGuideSections(content);
  const introTitles = new Set(["What You'll Have When Done", "Before You Start"]);
  const closingTitles = new Set(["Next Steps"]);
  const steps = [];
  let phase = "Prep";

  sections.forEach((section) => {
    if (section.title.startsWith("PART 1")) phase = "Demo";
    if (section.title.startsWith("PART 2")) phase = "Your files";
    if (section.title.startsWith("Step ")) {
      steps.push({
        ...section,
        phase,
        stepNumber: steps.length + 1,
        shortTitle: section.title.replace(/^Step \d+:\s*/, ""),
        summary: STEP_SUBHEADLINES[section.title] || "",
      });
    }
  });

  return {
    introSections: sections.filter((section) => introTitles.has(section.title)),
    steps,
    closingSections: sections
      .filter((section) => closingTitles.has(section.title))
      .map((section) => ({
        ...section,
        title: section.title === "Next Steps" ? "You Did It! Next Steps" : section.title,
      })),
    tocItems: guideTocItems({
      introSections: sections.filter((section) => introTitles.has(section.title)),
      steps,
      closingSections: sections
        .filter((section) => closingTitles.has(section.title))
        .map((section) => ({
          ...section,
          title: section.title === "Next Steps" ? "You Did It! Next Steps" : section.title,
        })),
    }),
    fullContext: content,
  };
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

function buildModHelpMessage(step, stepNumber) {
  return [
    "Hi mods, I need help with the June Paperwork guide.",
    "",
    `Guide link: ${GUIDE_HELP_URL}`,
    `Current location: Step ${stepNumber}: ${step.shortTitle}`,
    `What this step is for: ${step.summary}`,
    "",
    "What I need help with:",
    "[Write what happened, what you tried, and any extra context here. Add a screenshot if useful.]",
  ].join("\n");
}

function buildAiHelpMessage(guide, step, stepNumber) {
  const stepList = guide.steps
    .map((item, index) => `${index + 1}. ${item.shortTitle}: ${item.summary}`)
    .join("\n");

  return [
    "You are helping me complete the AI Mastery June Paperwork guide.",
    "",
    "Overall guide goal:",
    "Build a paperwork system that fills forms from my DNA, shows what is missing, and gets smarter every time I run it.",
    "",
    "All guide steps:",
    stepList,
    "",
    `My current location: Step ${stepNumber}: ${step.title}`,
    `What this step is for: ${step.summary}`,
    "",
    "Current step instructions:",
    blocksToPlainText(step.blocks),
    "",
    "What I need from you:",
    "Help me complete this exact step. Ask me for only the missing information you need. Keep the instructions practical and specific to Claude Cowork and this Paperwork workflow.",
    "",
    "My extra context:",
    "[Paste what happened, any error message, or a screenshot description here.]",
    "",
    "Full guide context:",
    guide.fullContext,
  ].join("\n");
}

function blocksToPlainText(blocks = []) {
  return blocks
    .map((block) => {
      if (block.type === "image") return `[Image: ${block.alt}]`;
      if (block.type === "code") return `\n${block.text}\n`;
      return block.text || "";
    })
    .filter(Boolean)
    .join("\n");
}

function splitGuideSections(content) {
  const blocks = buildMarkdownBlocks(content);
  const sections = [];
  let current = null;

  blocks.forEach((block) => {
    if ((block.type === "h3" || block.type === "h4") && block.text !== "Table of Contents") {
      current = {
        id: sectionId(block.text),
        title: block.text,
        blocks: [],
      };
      sections.push(current);
      return;
    }

    if (current && block.type !== "rule" && block.type !== "space") {
      current.blocks.push(block);
    }
  });

  return sections.filter((section) => section.blocks.length || section.title.startsWith("Step "));
}

function sectionId(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildMarkdownBlocks(content) {
  const blocks = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i].replace(/^\t+/, "");
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      blocks.push({ type: "space" });
      continue;
    }

    if (trimmed === "## Table of Contents") continue;

    if (trimmed.startsWith("```")) {
      const codeLines = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i].replace(/^\t+/, ""));
        i += 1;
      }
      blocks.push({ type: "code", text: codeLines.join("\n").trimEnd() });
      continue;
    }

    const image = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      blocks.push({ type: "image", alt: image[1], src: image[2] });
      continue;
    }

    if (/^-{3,}$/.test(trimmed)) {
      blocks.push({ type: "rule" });
      continue;
    }

    if (trimmed.startsWith("### ")) blocks.push({ type: "h5", text: trimmed.replace(/^### /, "") });
    else if (trimmed.startsWith("## ")) blocks.push({ type: "h4", text: trimmed.replace(/^## /, "") });
    else if (trimmed.startsWith("# ")) blocks.push({ type: "h3", text: trimmed.replace(/^# /, "") });
    else if (trimmed.startsWith("- [ ] ")) blocks.push({ type: "check", text: trimmed.replace("- [ ] ", "") });
    else if (trimmed.startsWith("- ")) blocks.push({ type: "bullet", text: trimmed.replace("- ", "") });
    else if (/^\d+\./.test(trimmed)) blocks.push({ type: "step", text: trimmed });
    else blocks.push({ type: "paragraph", text: trimmed });
  }

  return blocks.filter((block, index, allBlocks) => {
    if (block.type !== "space") return true;
    return index > 0 && index < allBlocks.length - 1 && allBlocks[index - 1].type !== "space";
  });
}

function MarkdownBlock({ block }) {
  if (block.type === "space") return <div className="md-space" />;
  if (block.type === "rule") return <hr className="md-rule" />;
  if (block.type === "code") return <pre className="md-code">{block.text}</pre>;
  if (block.type === "image") {
    return (
      <figure className="md-figure">
        <img className="md-image" src={block.src} alt={block.alt} loading="eager" />
        {block.alt && <figcaption>{block.alt}</figcaption>}
      </figure>
    );
  }
  if (block.type === "h3" || block.type === "h4" || block.type === "h5") return <MarkdownHeading block={block} />;
  if (block.type === "check") return <p className="md-check">{renderInlineMarkdown(block.text)}</p>;
  if (block.type === "bullet") return <p className="md-bullet">{renderInlineMarkdown(block.text)}</p>;
  if (block.type === "step") return <p className="md-step">{renderInlineMarkdown(block.text)}</p>;
  return <p>{renderInlineMarkdown(block.text)}</p>;
}

function renderInlineMarkdown(text = "") {
  const nodes = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];

    if (token.startsWith("**")) {
      nodes.push(<strong key={`${match.index}-strong`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={`${match.index}-code`}>{token.slice(1, -1)}</code>);
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        nodes.push(
          <a key={`${match.index}-link`} href={link[2]} target="_blank" rel="noreferrer">
            {link[1].replace(/\*\*/g, "")}
          </a>
        );
      }
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function ChallengesPage({ archiveRows, handleSubmit, path, navigate, submissionStatus, submissions }) {
  const segment = path.split("/")[2] || "";
  const child = path.split("/")[3] || "";

  if (path === "/challenges") {
    return (
      <section className="section page-section archive-section" aria-labelledby="challenges-title">
        <Breadcrumbs items={[{ label: "Challenges" }]} navigate={navigate} />
        <div className="section-heading">
          <p className="section-kicker">Challenges</p>
          <h1 id="challenges-title" className="page-title">Choose your challenge month.</h1>
          <p className="muted">Open the current month to find the challenge guide, submit your work, and review submissions. Future challenges unlock when they go live.</p>
        </div>
        <MonthChoiceGrid activeId={CURRENT_MONTH_ID} basePath="/challenges" navigate={navigate} />
      </section>
    );
  }

  if (path.startsWith("/challenges/june")) {
    return <RedirectRoute to="/challenges/july" navigate={navigate} />;
  }

  if (segment !== "july") {
    const month = MONTHS.find((item) => item.label.toLowerCase() === segment && !item.hidden) || CURRENT_MONTH;
    return (
      <section className="section page-section archive-section">
        <Breadcrumbs
          items={[
            { label: "Challenges", path: "/challenges" },
            { label: month.label },
          ]}
          navigate={navigate}
        />
        <div className="section-heading">
          <p className="section-kicker">{month.number}</p>
          <h1 className="page-title">{month.focus}</h1>
          <p className="muted">This challenge is not open yet. The guide, submission page, and submissions will appear here when the month goes live.</p>
        </div>
      </section>
    );
  }

  return <CurrentChallengeComingSoon month={CURRENT_MONTH} navigate={navigate} />;

  if (child === "guide") {
    return <ChallengeGuidePage navigate={navigate} />;
  }

  if (child === "submit") {
    return (
      <SubmitPage
        breadcrumbs={[
          { label: "Challenges", path: "/challenges" },
          { label: "June", path: "/challenges/june" },
          { label: "Submit" },
        ]}
        handleSubmit={handleSubmit}
        navigate={navigate}
        submissionStatus={submissionStatus}
        submissions={submissions}
      />
    );
  }

  if (child === "submissions") {
    return <ChallengeSubmissionsPage archiveRows={archiveRows} navigate={navigate} />;
  }

  return (
    <section className="section page-section archive-section" aria-labelledby="june-challenge-title">
      <Breadcrumbs
        items={[
          { label: "Challenges", path: "/challenges" },
          { label: "June" },
        ]}
        navigate={navigate}
      />
      <div className="section-heading section-heading-compact">
        <h1 id="june-challenge-title" className="page-title">Build a Self-Improving Skill</h1>
      </div>
      <MonthVisualCard
        month={MONTHS[0]}
        actionLabel="Open Challenge Guide"
        onAction={() => navigate("/challenges/june/guide")}
      />
      <div className="resource-grid resource-grid-three">
        <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/challenges/june/guide")}>
          <div className="resource-card-top">
            <span>Challenge guide</span>
          </div>
          <h4>Mastery Challenge #6</h4>
          <p>Read the full mission, rules, deliverables, deadline, and judging notes for June.</p>
        </button>
        <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/challenges/june/submit")}>
          <div className="resource-card-top">
            <span>Submit</span>
            <small>Form</small>
          </div>
          <h4>Submit Your Challenge</h4>
          <p>Send your project link, title, and notes for the team to review.</p>
        </button>
        <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/challenges/june/submissions")}>
          <div className="resource-card-top">
            <span>Submissions</span>
            <small>Review</small>
          </div>
          <h4>Recent Submissions</h4>
          <p>See recent submissions saved in this browser and the monthly challenge collection.</p>
        </button>
      </div>
    </section>
  );
}

function CurrentChallengeComingSoon({ month, navigate }) {
  return (
    <section className="section page-section archive-section" aria-labelledby="july-challenge-title">
      <Breadcrumbs
        items={[
          { label: "Challenges", path: "/challenges" },
          { label: "July" },
        ]}
        navigate={navigate}
      />
      <div className="section-heading">
        <p className="section-kicker">{month.number}</p>
        <h1 id="july-challenge-title" className="page-title">July challenge coming soon.</h1>
        <p className="muted">The July challenge will unlock after the guide is published. For now, start with the July guide prerequisites.</p>
      </div>
      <div className="hero-actions">
        <button type="button" onClick={() => navigate("/monthly-resources/july/guide")}>Open July Prerequisites</button>
      </div>
    </section>
  );
}

function ChallengeGuidePage({ navigate }) {
  const tocItems = useMemo(() => markdownTocItems(MONTH6_CONTENT.challenge), []);

  return (
    <section className="section page-section archive-section has-hover-toc" aria-labelledby="archive-title">
      <HoverTableOfContents title="Challenge contents" items={tocItems} />
      <Breadcrumbs
        items={[
          { label: "Challenges", path: "/challenges" },
          { label: "June", path: "/challenges/june" },
          { label: "Challenge Guide" },
        ]}
        navigate={navigate}
      />
      <div className="resource-section">
        <div className="resource-section-head">
          <div>
            <p className="section-kicker">Challenge guide</p>
            <h1 id="archive-title" className="page-title">Mastery Challenge #6: Build a Self-Improving Skill</h1>
            <p>Use this guide to complete the June challenge and submit the strongest version of your work.</p>
          </div>
        </div>
        <MarkdownDocument content={MONTH6_CONTENT.challenge} />
      </div>
    </section>
  );
}

function ChallengeSubmissionsPage({ archiveRows, navigate }) {
  return (
    <section className="section page-section archive-section" aria-labelledby="archive-title">
      <Breadcrumbs
        items={[
          { label: "Challenges", path: "/challenges" },
          { label: "June", path: "/challenges/june" },
          { label: "Submissions" },
        ]}
        navigate={navigate}
      />
      <div className="section-heading">
        <p className="section-kicker">Submissions</p>
        <h1 id="archive-title" className="page-title">June challenge submissions.</h1>
        <p className="muted">Use the archive to revisit past challenges, review your own work, and learn from standout member examples.</p>
      </div>
      <div className="archive-table" role="table" aria-label="Challenge archive">
        <div className="archive-row archive-head" role="row">
          <span>Month</span>
          <span>Type</span>
          <span>Collection</span>
          <span>Status</span>
        </div>
        {archiveRows.map((item) => (
          <div className="archive-row" role="row" key={`${item.month}-${item.title}`}>
            <span>{item.month}</span>
            <span>{item.type}</span>
            <span>{item.title}</span>
            <span>{item.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SubmitPage({ breadcrumbs = [{ label: "Challenges", path: "/challenges" }, { label: "Submit" }], handleSubmit, navigate, submissionStatus, submissions }) {
  return (
    <section className="section page-section" aria-labelledby="submit-title">
      <Breadcrumbs items={breadcrumbs} navigate={navigate} />
      <div className="split">
        <div>
          <p className="section-kicker">Challenge submission</p>
          <h1 id="submit-title" className="page-title">Submit your monthly Mastery challenge.</h1>
          <p className="muted">
            Share your project link, add a few notes for the team, and submit it for review.
          </p>
        </div>
        <form className="submission-card" onSubmit={handleSubmit}>
          <label>
            Challenge month
            <select name="month" defaultValue="June">
              {MONTHS.map((month) => (
                <option key={month.id}>{month.label}</option>
              ))}
            </select>
          </label>
          <label>
            Member name
            <input name="memberName" placeholder="Your name" required />
          </label>
          <label>
            Submission title
            <input name="title" placeholder="Name your challenge submission" required />
          </label>
          <label>
            Share link
            <input name="shareLink" type="url" placeholder="Paste your Loom, doc, or project link" required />
          </label>
          <label>
            Notes for the team
            <textarea name="notes" placeholder="What should we pay attention to?" />
          </label>
          <button type="submit">Submit challenge</button>
          {submissionStatus && <p className="submission-status">{submissionStatus}</p>}
          {submissions.length > 0 && (
            <div className="submission-queue" aria-label="Recent submissions">
              <strong>Recent submissions</strong>
              {submissions.slice(0, 3).map((submission) => (
                <a href={submission.share_link} key={submission.id} target="_blank" rel="noreferrer">
                  <span>{submission.month}</span>
                  {submission.title}
                </a>
              ))}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

function TutorialPage() {
  return (
    <section className="section page-section tutorial-section" aria-labelledby="tutorial-title">
      <div className="section-heading">
        <p className="section-kicker">Tutorial</p>
        <h1 id="tutorial-title" className="page-title">Start here when you open the hub.</h1>
        <p className="muted">Follow this short path whenever a new month opens so you can move from training to implementation quickly.</p>
      </div>
      <div className="tutorial-grid">
        {TUTORIAL_STEPS.map((step, index) => (
          <article key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{step}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
