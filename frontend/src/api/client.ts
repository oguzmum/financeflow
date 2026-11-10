import createClient from "openapi-fetch";
import type { paths } from "./schema";

// Typed client generated from the contract (api/openapi.yaml, ADR-0006). schema.d.ts is generated, not committed.
// Absolute base URL: the app and the API are served from the same origin.
// fetch is looked up per request (not captured at import), so tests can stub it.
export const api = createClient<paths>({
  baseUrl: new URL("/api", window.location.href).href,
  fetch: (request) => globalThis.fetch(request),
});
