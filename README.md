# AI Operations Portfolio

I build tools around the people who have to use them: clear language, manageable steps and an explanation of what happens next. This repo is a small window into that work.

Claude & Codex for software development. I frame the problem, direct the build, review the output, test behavior, and repair failures. These are browser-based source examples, not evidence that every demo is connected to a live AI service.

## Start here

For an operational example, start with **Virgo Cargo**. For governance and usability, explore **Shadow AI Posture**. The other projects show how I explain systems and guide adoption.

| Project and source | Live site | What you are looking at |
| --- | --- | --- |
| [Virgo Cargo Quote Engine](projects/virgo-cargo-quote-engine/) | [Open demo](https://virgo-cargo-quote-engine.netlify.app/) | A working browser-based reconstruction of a freight quoting interface. The original private Claude and Zapier workflow supported commercial operations and served multiple shippers. This snapshot does not include that private workflow, live rates, customer records or Zapier configuration. |
| [Shadow AI Posture Framework](projects/shadow-ai-posture/) | [Open demo](https://shadow-ai-posture.netlify.app/) | An interactive framework for inventorying AI tools, assessing exposure and recording decisions. It supports governance work; it does not enforce SSO, revoke credentials or certify compliance. The Ask panel depends on a Claude artifact environment and is not a general standalone AI integration. |
| [AI Ops Control Room](projects/ai-ops-control-room/) | [Open demo](https://ai-ops-control-room.netlify.app/) | An interactive demonstration and learning tool explaining identity, access, ownership and operating controls. SSO, SCIM and RBAC are illustrated concepts, not connected enterprise services.
| [AI Adoption Engine](projects/ai-adoption-engine/) | [Open demo](https://ai-adoption-engine.netlify.app/) | An interactive reference model for trying, checking, sharing and improving AI use. Examples are invented; no live AI, accounts or business systems are connected. |
| [TalentSync Ops](projects/talentsync-ops/) | [Open demo](https://talentsync-ops.netlify.app/) | A static concept for people, talent and customer success workflows, including guided puzzles and a sample workspace. Records are fictional and matching results are fixed examples. No live AI, database, messaging or calendar integration is connected. |

## Run locally

Each project is self-contained static HTML, CSS and JavaScript, with its own README. Python 3 is sufficient for a local preview; no application API keys are needed.

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory projects/virgo-cargo-quote-engine
```

Open http://localhost:4173/. External fonts or reference links may require an internet connection. Netlify configuration files are preserved where supplied, but Python's preview server does not apply their rules.

## Where AI_Ops fits

AI_Ops is my brain, a private working environment for research, building, verification and handoffs. A prompt bank holds reusable instructions; OSINT supports source research; BARAZA and its Juggernaut review challenge assumptions; failure records and session wrap-ups preserve lessons. These are supervised workflows, not a claim to reproduce brain function or guarantee autonomous reliability.

The public Control Room is a separate teaching demonstration. This repository shares public-facing project code; it does not expose my private workspace, full prompt bank, research dossiers, credentials or session history.

## Review boundaries

Existing tests are included where available; this export does not claim a fresh comprehensive functional or accessibility audit.

## Attribution and reuse

Created by Simon Mukooza with Agentic AI. Existing project and third-party license notices remain in their respective folders. Shadow AI Posture retains its CC BY 4.0 notice. No blanket license is granted for the remaining code or assets in this repository.

[Simon Mukooza on LinkedIn](https://www.linkedin.com/in/simonmukooza/)
