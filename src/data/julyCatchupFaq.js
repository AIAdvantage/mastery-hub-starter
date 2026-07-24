export const JULY_CATCHUP_FAQ = {
  title: "FAQ & Catchup",
  eyebrow: "July catchup",
  intro:
    "The clearest answers from the July workshop and follow-up questions. Short, practical, and built so you can find the next step without rewatching the whole session.",
  heroImage: {
    src: "/july/faq/ChatGPT_Image_Jul_16_2026_01_20_52_PM.png",
    alt: "AI Mastery catch-up session resource hub cover",
  },
  quickStart: {
    kicker: "Start here",
    title: "Fastest ways to get unstuck",
    intro: "Do these in order before you restart, rebuild, or assume the whole Hub is broken.",
    items: [
      "Open the July Guide and use the Ask AI button on the exact step where you are stuck.",
      "Watch the step-by-step installation replay in Mastery Replays. Pause and rewind instead of trying to match live pace.",
      "Use the Hub Doctor or live workshop aid skill from the July materials to diagnose your setup.",
      "Post a screenshot in Mastery Community so the team can see the exact screen you are on.",
    ],
  },
  sections: [
    {
      title: "How do I connect my Clone to my AgentHub?",
      kicker: "Clone + Hub",
      visuals: [
        {
          src: "/july/faq/07-connect-your-clone.jpg",
          alt: "Your Clone and your Hub connected together",
          caption: "Your Clone. Your Hub. One connection.",
        },
        {
          src: "/july/faq/file_228---e0924f8c-87d5-4618-954c-98bbb4b0605b.jpg",
          alt: "Clone Project card in Claude Cowork",
          caption: "Your Clone Project card in Cowork.",
        },
        {
          src: "/july/faq/file_229---0962ae4c-5cae-4e80-ae1c-61dcbd9f0f65.jpg",
          alt: "Context panel showing Clone and AgentHub folders connected",
          caption: "The Context panel shows both folders connected together.",
        },
      ],
      answer: [
        "So basically, your Clone knows you. Your AgentHub is where the work shows up. To make them useful together, your Clone needs access to the AgentHub folder.",
        "Open your Clone Project in Cowork. In the Context panel, add the AgentHub folder. Once both folders are attached to the same project, your Clone can see the Hub and help you decide what to do with it.",
      ],
      checklistTitle: "Before you start",
      checklist: [
        "Your Clone Project is open in Cowork.",
        "Your Clone folder is already attached.",
        "Your AgentHub folder exists on your computer.",
      ],
      promptTitle: "First message to paste",
      prompt:
        "Hey! I just connected my AgentHub. Do you see it? Can you tell me what is inside it, what you think it is useful for, and what we should do with it first?",
    },
    {
      title: "What happens if I move from personal Google to Microsoft 365?",
      kicker: "Connectors",
      visuals: [
        {
          src: "/july/faq/q01-anno-microsoft-move.jpg",
          alt: "Anno's question about moving from personal Google to Microsoft 365",
          caption: "Question card: personal Google to Microsoft 365.",
        },
        {
          src: "/july/faq/08-keep-hub-change-keys-microsoft.jpg",
          alt: "Keep the Hub and change the connected keys for Microsoft 365",
          caption: "Moving to Microsoft 365: keep the Hub, change the keys.",
        },
      ],
      answer: [
        "You do not rebuild the Hub. The Hub is the display. Your inbox is just one of the taps feeding it.",
        "If you move to business Microsoft 365, connect Outlook instead of Gmail inside Claude. The rest stays the same: Claude reads the source, writes the card, publishes it to GitHub, and the Hub displays it.",
      ],
      checklistTitle: "The path",
      checklist: [
        "Connect the inbox you actually use: Gmail or Outlook.",
        "Tell Claude what to read and what card to create.",
        "Claude writes and pushes the card.",
        "The Hub shows the result.",
      ],
    },
    {
      title: "How secure is my business information?",
      kicker: "Security",
      visuals: [
        {
          src: "/july/faq/03-one-hub-every-agent.jpg",
          alt: "One Hub connected to every agent",
          caption: "The Hub is the vault. Tokens are the keys.",
        },
      ],
      answer: [
        "The setup is private by design, but privacy still depends on good housekeeping. Your repo should be private, your tokens should stay out of chats and docs, and your deployed Hub should have login before you treat it as private.",
        "If your company has rules around Microsoft 365, client data, or internal files, follow those rules first. The tool can connect things. You still decide what should be connected.",
      ],
      checklistTitle: "Keep tight",
      checklist: [
        "Use 2FA.",
        "Keep the repo private.",
        "Keep token files off public folders.",
        "Never paste tokens into a chat.",
        "Add login before sharing a deployed Hub.",
      ],
    },
    {
      title: "I finished Lovable and GitHub, but where is the 'you arrived' moment?",
      kicker: "Progress check",
      visuals: [
        {
          src: "/july/faq/q10-no-youve-arrived.jpg",
          alt: "Question card about no you arrived moment",
          caption: "Question card: there is no giant finish-line screen.",
        },
        {
          src: "/july/faq/06-cards-are-the-proof-arrived.jpg",
          alt: "Cards are the proof that the Hub is working",
          caption: "Cards in the Hub are the proof. That is the arrived signal.",
        },
      ],
      answer: [
        "Yeah, this part is confusing because there is no giant finish-line screen. Nothing is necessarily broken.",
        "The signal is simple: if cards appear in your Hub, you arrived. That is the proof. The Hub is reading from GitHub, and your setup is working.",
        "If your Hub says Your vault is empty, that is usually an empty shelf, not a broken Hub. Tools and Library stay empty until the first markdown card is committed.",
      ],
      checklistTitle: "Check this first",
      checklist: [
        "Run Prompt 2 or your Daily Briefing.",
        "Confirm Claude pushed a card to GitHub.",
        "Reload the Hub page once.",
        "If cards appear, you arrived.",
      ],
    },
    {
      title: "GitHub token trouble: where is it, why did it disappear, and why is Lovable stuck?",
      kicker: "Token",
      answer: [
        "The GitHub token is the key. You create it in GitHub, then use it where the guide tells you. GitHub only shows the token once, so if you lose it, you did not break anything. Just generate a fresh one.",
        "Lovable's Submit button usually stays grey because it is waiting for two things: the token and the repo name. Once both fields have values, Submit wakes up.",
      ],
      checklistTitle: "Token path",
      checklist: [
        "GitHub profile picture.",
        "Settings.",
        "Developer settings.",
        "Fine-grained personal access tokens.",
        "Generate new token.",
        "Repository access: Only select repositories, then pick your Hub repo.",
        "Permissions: Contents = Read and write.",
      ],
      promptTitle: "If Lovable fields disappeared",
      prompt:
        "Bring up the field to enter the GitHub token secret again, and afterwards the field where I can input the repo name.",
    },
    {
      title: "What exactly is my repo name?",
      kicker: "Repo name",
      visuals: [
        {
          src: "/july/faq/02-repo-address-token-key.jpg",
          alt: "Repo address and token key metaphor",
          caption: "Repo equals address. Token equals key. Every agent needs both.",
        },
      ],
      answer: [
        "Your repo name is not your Hub display name, and it is not the full web address. It looks like yourusername/agent-hub-xxxx.",
        "When you are looking at your repo in GitHub, it is the part of the address right after github.com. In Lovable, click the plus icon at the bottom left of the chat and choose GitHub. Your repo is listed there too.",
      ],
      checklistTitle: "Good vs wrong",
      checklist: [
        "Good: yourusername/agent-hub-xxxx.",
        "Wrong: My AI Hub.",
        "Wrong: https://github.com/yourusername/agent-hub-xxxx.",
      ],
    },
    {
      title: "Why does Cowork look different from the video?",
      kicker: "Cowork update",
      answer: [
        "You did not install it wrong. Claude changed the Cowork interface mid-month, so some videos show the older layout.",
        "Cowork now lives inside the chat window. The Project or folder button near the chat box is where you attach your AgentHub folder.",
      ],
      checklistTitle: "If it feels missing",
      checklist: [
        "Click Chat, then switch back to Cowork.",
        "Restart Claude Desktop once.",
        "Use the Project or folder button to attach the AgentHub folder.",
        "Do not reinstall just because the layout changed.",
      ],
    },
    {
      title: "Cowork says github.com is blocked. What do I do?",
      kicker: "Allowlist",
      visuals: [
        {
          src: "/july/faq/q06-claude-wont-connect.jpg",
          alt: "Question card about Claude not connecting to the Hub",
          caption: "Question card: Claude will not connect to the Hub.",
        },
      ],
      answer: [
        "If you see blocked-by-allowlist or a 403 error, Cowork is not allowed to reach GitHub yet. That is a permission issue, not a failed build.",
        "Open Claude Desktop settings, go to Capabilities, find the Domain allowlist, and add github.com to Additional allowed domains. On a Team or Enterprise account, your admin may need to do this.",
      ],
      checklistTitle: "Fix",
      checklist: [
        "Claude Desktop settings.",
        "Capabilities.",
        "Domain allowlist.",
        "Additional allowed domains.",
        "Add github.com.",
      ],
    },
    {
      title: "My Daily Briefing runs, but nothing shows in the Hub. What should I check?",
      kicker: "Daily Briefing",
      visuals: [
        {
          src: "/july/faq/q02-hub-time-savings.jpg",
          alt: "Question card about how the Hub reduces routine work",
          caption: "Question card: how the Hub reduces routine work.",
        },
        {
          src: "/july/faq/05-taps-fill-hub-organizes.jpg",
          alt: "The taps fill and the Hub organizes",
          caption: "The taps fill. The Hub organizes.",
        },
      ],
      answer: [
        "The briefing does not save a normal file on your computer. It pushes a card to GitHub, and the Hub reads from there.",
        "If the task runs but nothing appears, check the folder, token, GitHub allowlist, and reload before you change the whole setup.",
      ],
      checklistTitle: "Check in order",
      checklist: [
        "The scheduled task has your AgentHub folder attached.",
        "The AgentHub folder contains gh-token.txt.",
        "Cowork can reach github.com.",
        "The card was pushed to GitHub.",
        "Reload the Hub after the task finishes.",
      ],
    },
    {
      title: "Should I publish my Hub?",
      kicker: "Publish",
      visuals: [
        {
          src: "/july/faq/04-lock-the-door-google-login.jpg",
          alt: "Lock the Hub with Google login",
          caption: "Lock the door. Add Google login.",
        },
      ],
      answer: [
        "Add login first, then publish. Without login, anyone with the link can open your Hub.",
        "If Lovable flags security issues during publishing, run Try to Fix All and let it work. If a prompt looks unclear, screenshot it and ask in Mastery Community before clicking through.",
      ],
      promptTitle: "Prompt to paste into Lovable",
      prompt:
        "I want to add Google login and restrict access to only my email address.\n\nUse Supabase auth with Google sign-in.\nOnly allow this email: [YOUR EMAIL]\nIf anyone else signs in, show a clear access denied message.\nDo not make any other design changes.",
    },
    {
      title: "What is the Hub, really?",
      kicker: "Mental model",
      visuals: [
        {
          src: "/july/faq/03-one-hub-every-agent.jpg",
          alt: "One Hub as the shared source for every agent",
          caption: "One Hub. Every connected agent works from the same place.",
        },
      ],
      answer: [
        "The Hub is where your AI work lands. It is not the engine. It is the display.",
        "Think of it like a pool. Your sources are the taps: email, meetings, files, calendar, tasks. Claude does the reading and sorting. The Hub is where the useful output collects so you can actually see it.",
      ],
      checklistTitle: "The simple model",
      checklist: [
        "Sources are taps.",
        "Claude is the engine.",
        "GitHub is the shelf where the cards live.",
        "The Hub is the display.",
      ],
    },
    {
      title: "How can the Hub reduce time on routine work?",
      kicker: "Under the hood",
      visuals: [
        {
          src: "/july/faq/q09-scheduled-tasks-expenses-tar.jpg",
          alt: "Question card about scheduled tasks and expense tracking",
          caption: "Question card: scheduled tasks, expense tracking, and TAR forms.",
        },
      ],
      answer: [
        "The Hub saves time when Claude is doing recurring work and publishing the result somewhere you can inspect quickly.",
        "The Meetings Center tile is not doing the thinking. Claude does the thinking. A scheduled task reads the source, creates the useful summary or card, pushes it to GitHub, and the Hub shows it.",
      ],
      checklistTitle: "The three pieces",
      checklist: [
        "The tap: meetings, mail, calendar, files, or another source.",
        "The engine: Claude reading, sorting, and writing.",
        "The display: the Hub showing the finished card.",
      ],
    },
    {
      title: "Something is broken. Should I delete everything and start over?",
      kicker: "Fix forward",
      answer: [
        "Almost never. Starting over usually takes longer than fixing the one small thing that is actually wrong.",
        "Most stuck states come down to the repo name, token, connected folder, GitHub allowlist, or a card that has not been pushed yet. Fix forward first.",
      ],
      checklistTitle: "Do this instead",
      checklist: [
        "Use Ask AI on the exact guide step.",
        "Run the Hub Doctor or live workshop aid skill.",
        "Post a screenshot in Mastery Community.",
        "Use Lovable View history if a design change went sideways.",
      ],
    },
    {
      title: "This is a lot. What are my next steps?",
      kicker: "Anti-overwhelm",
      visuals: [
        {
          src: "/july/faq/q08-lot-to-digest.jpg",
          alt: "Question card about next steps after a lot to digest",
          caption: "Question card: turn the overwhelm into next steps.",
        },
      ],
      answer: [
        "Totally fair. The move is not to wire everything at once. That is how this gets overwhelming.",
        "Connect your Clone to your AgentHub, ask it what it sees, then pick one useful tap. One source, one card, one visible win. That is enough to start.",
      ],
      checklistTitle: "Do this next",
      checklist: [
        "Connect Clone plus AgentHub folder.",
        "Ask the Clone what it sees.",
        "Pick one source to connect next.",
        "Create one useful card.",
        "Reload the Hub and confirm it appears.",
      ],
    },
  ],
};
