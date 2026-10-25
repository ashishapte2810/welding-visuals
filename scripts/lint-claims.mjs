#!/usr/bin/env node
// Lint a claim registry without building a figure.  node lint-claims.mjs <claims.json> <sources.json>
import { loadRegistry, lintRegistry } from "../kit/claims.mjs";
const [c, s] = process.argv.slice(2); if (!c || !s) { console.error("usage: lint-claims.mjs <claims.json> <sources.json>"); process.exit(2); }
try { const r = lintRegistry(loadRegistry(c, s)); console.log(`ok: ${r.claims.length} claims, ${Object.keys(r.sources).length} sources`); } catch (e) { console.error(e.message); process.exit(1); }
