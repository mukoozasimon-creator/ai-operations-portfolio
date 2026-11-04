# AI Operations Portfolio

I build tools around the people who have to use them: clear language, manageable steps and an explanation of what happens next. This repo is a small window into that work.

Claude & Codex for software development. I frame the problem, direct the build, review the output, test behavior, and repair failures. This portfolio combines source snapshots and live tools. Each entry explains what is implemented, what is illustrative and what it demonstrates.

## Start here

For commercial operations, start with **Virgo Cargo**. For AI project readiness and evidence-based recommendations, explore **Hold Short**. For plain-language learning and enablement, open **Level Ground**. **Shadow AI Posture** shows my approach to AI inventory and exposure assessment.

| Project | Live site | What you are looking at |
| --- | --- | --- |
| [Virgo Cargo Quote Engine](projects/virgo-cargo-quote-engine/) | [Open demo](https://virgo-cargo-quote-engine.netlify.app/) | A working browser-based reconstruction of a freight quoting interface. The original private Claude and Zapier workflow supported commercial operations and served multiple shippers. This snapshot does not include that private workflow, live rates, customer records or Zapier configuration. |
| [Hold Short](#hold-short) | [Open tool](https://holdshort.netlify.app/) | An AI project readiness review with a 12-question quick check and a fuller review of up to 33 questions. Turns self-reported answers into risk flags, explanations and corrective actions. Educational decision support; not an audit, assurance or prediction of success. |
| [Level Ground](#level-ground) | [Open tool](https://level-ground-plain-words.netlify.app/) | A searchable plain-language resource for technical and workplace terms, with consistent explanations, practical examples, pronunciation guidance and adjustable reading controls. Supports learning and self-service reference. |
| [Shadow AI Posture Framework](projects/shadow-ai-posture/) | [Open demo](https://shadow-ai-posture.netlify.app/) | An interactive framework for inventorying AI tools, assessing exposure and recording decisions. It supports governance work; it does not enforce SSO, revoke credentials or certify compliance. The Ask panel depends on a Claude artifact environment and is not a general standalone AI integration. |
| [AI Ops Control Room](projects/ai-ops-control-room/) | [Open demo](https://ai-ops-control-room.netlify.app/) | An interactive demonstration and learning tool explaining identity, access, ownership and operating controls. SSO, SCIM and RBAC are illustrated concepts, not connected enterprise services.
| [AI Adoption Engine](projects/ai-adoption-engine/) | [Open demo](https://ai-adoption-engine.netlify.app/) | An interactive reference model for trying, checking, sharing and improving AI use. Examples are invented; no live AI, accounts or business systems are connected. |
| [TalentSync Ops](projects/talentsync-ops/) | [Open demo](https://talentsync-ops.netlify.app/) | A static concept for people, talent and customer success workflows, including guided puzzles and a sample workspace. Records are fictional and matching results are fixed examples. No live AI, database, messaging or calendar integration is connected. |

## Hold Short

**AI project readiness and decision support** | [Open Hold Short](https://holdshort.netlify.app/)

I turned research on AI project failures into a structured review covering 29 risk areas across eight systems. Users can inspect the reasoning, see corrective actions and prepare a report for a project owner. The sample project, Larkspur Freight, is fictional and provides a quick way to explore the tool.

The check flags unresolved questions and leaves the decision with a person. Answers and supporting evidence are self-reported; the tool does not independently verify them or certify compliance. Its references to NIST AI RMF and ISO/IEC 42001 provide guidance. Related terminology opens an explanation linked to Level Ground.

**What it demonstrates:** research synthesis, operational judgment, risk communication and turning an ambiguous decision into explicit next steps.

## Level Ground

**Plain-language learning and enablement** | [Open Level Ground](https://level-ground-plain-words.netlify.app/)

I built a resource for the technical and workplace words people are expected to already know. Each entry follows the same structure: what it is, what it looks like, where you meet it, the catch and an optional deeper explanation. Search, linked terms, pronunciation guidance and adjustable reading controls help readers choose their own depth and pace.

The live resource contained 302 entries across seven categories when checked on 2 November 2026. Individual entries can be shared, and Hold Short links directly to relevant explanations.

**What it demonstrates:** clear documentation, structured learning content, attention to different reading needs and practical support for unfamiliar systems.

These two sections document the live tools. Their source snapshots are not included in this repository at this update. No measured learning, adoption or business-outcome claims are made.

## Run locally

The five source projects linked under `projects/` are self-contained static HTML, CSS and JavaScript, with their own READMEs. Python 3 is sufficient for a local preview; no application API keys are needed.

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

