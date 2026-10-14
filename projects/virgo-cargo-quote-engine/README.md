# Virgo Cargo Quote Engine

A working browser-based reconstruction of a freight quoting interface. The original private Claude and Zapier workflow supported commercial operations and served more than 50 shippers. This snapshot does not include that private workflow, live rates, customer records or Zapier configuration.

[Live demonstration](https://virgo-cargo-quote-engine.netlify.app/)

## Read and run

Start with `index.html`; browser JavaScript and styles are inline or in adjacent files. No API key is required. From the repository root:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory projects/virgo-cargo-quote-engine
```

Open http://localhost:4173/. Stop the server before previewing a different project. This basic preview does not apply Netlify `_headers` or `_redirects`.

## Snapshot boundary

This is a source snapshot from the local public-site package, prepared on 14 October 2026. It is not a claim of byte-for-byte equality with the live deployment. Private configuration, customer records and the private AI_Ops repository history are not included.
