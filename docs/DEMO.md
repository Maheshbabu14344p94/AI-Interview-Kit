# Demo notes

The browser can be exercised without MongoDB or an LLM key. In that mode authentication is session-backed in memory and generation falls back honestly to deterministic evidence-based scaffolding where an LLM is unavailable.

For an actual assessment run, configure MongoDB and a real LLM provider in `.env`. The batch command uses the exact same `runPipeline()` implementation as the web endpoint.

The UI deliberately does not show fake progress: the generation screen is populated from pipeline events emitted by the backend.
