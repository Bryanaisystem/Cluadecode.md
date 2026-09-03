# Website / Prototype Approach

Prototypes are outreach assets, not demos for their own sake — the framing to a prospect is "here is everything I built for you," never "just a demo." Avoid both failure modes: treating it as throwaway, or over-engineering for months instead of shipping fast.

## Build process
1. **Free pre-planning step in Gemini** (before touching the build tool): generate a fictional brand persona + realistic content up front (not lorem-ipsum placeholders), get design-best-practice and tech-stack recommendations. Front-loading real content means the build tool gets it right on the first pass instead of burning credits on content-fixing regenerations.
2. **Build in v0 by Vercel, in explicit phases** using a saved implementation plan — Hero/Features → About/Testimonials/Pricing → FAQ/Contact → assembly + image generation. Never regenerate the whole project for a small change; reference "phase N" instead. This is the core cost/predictability lever.
3. **Fix Open Graph metadata + favicon before showing a prospect.** These are two separate things (browser-tab favicon vs. social-preview OG image) — both need to be set and the site redeployed, or it reads as an obvious no-code template.

## Why this sells right now — the AI Awareness Cycle
Business owners feel pressure to "get a better website" — not because AI itself is impressive, but because of 4 converging forces:
1. **Search is changing** — more AI-generated answers / zero-click results, so visitors arrive partly convinced or partly skeptical, raising the bar on what a landing page must do immediately
2. **AEO (answer-engine optimization)** — being the source an AI assistant cites is now its own distribution channel, not just SEO
3. **Landing-page economics** — the standard is shifting to one page per offer/audience, meaning businesses need an ongoing website *system*, not a single static site
4. **Mainstream AI website builders** (Wix, Webflow, Framer, Shopify) have normalized AI-built sites, resetting the baseline expectation for every business

The pitch is never "I need AI" — the business owner articulates it as "I need a better website." The prototype makes that concrete and revenue-grade.
