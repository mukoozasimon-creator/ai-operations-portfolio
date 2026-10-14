# Shadow AI Posture Framework

An interactive framework for inventorying AI tools, assessing exposure and recording decisions. It supports governance work; it does not enforce SSO, revoke credentials or certify compliance. The Ask panel depends on a Claude artifact environment and is not a general standalone AI integration.

[Live demonstration](https://shadow-ai-posture.netlify.app/)

## Read and run

Start with `index.html`; browser JavaScript and styles are inline or in adjacent files. No API key is required. From the repository root:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory projects/shadow-ai-posture
```

Open http://localhost:4173/. Stop the server before previewing a different project. This basic preview does not apply Netlify `_headers` or `_redirects`.

## Snapshot boundary

This is a source snapshot from the local public-site package, prepared on 14 October 2026. It is not a claim of byte-for-byte equality with the live deployment. Private configuration, customer records and the private AI_Ops repository history are not included.

## Existing browser tests

The original regression suite is included in `tests/`. From this project folder, install the development dependencies with `npm install`, install Chromium with `npx playwright install chromium`, then run `npm test`. These tests were not rerun for this source export.

The existing CC BY 4.0 license is preserved in `LICENSE`.
