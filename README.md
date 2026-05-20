<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/deab171b-38d9-4dae-90db-e7740b6bcbfc

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set one AI key in `.env.local`:
   - Free/simple route: `OPENROUTER_API_KEY` with `OPENROUTER_MODEL="openrouter/free"`
   - Google route: `GEMINI_API_KEY`
3. Run the app:
   `npm run dev`

If no AI key is configured, the app still completes intake forms using the local rule-based playbook fallback.
