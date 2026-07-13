Add the exact Google Search Console verification meta tag to the site-wide `<head>` and redeploy.

### Steps
1. **Insert meta tag** into `src/routes/__root.tsx` inside the existing `head()` `meta` array, without changing any other tags or content:
   ```tsx
   { name: "google-site-verification", content: "PxVCAAJqIHloSlakfwG2HkLWDaM-L2f-hjdtUejgqgQ" }
   ```
2. **Verify** with a quick typecheck/build to ensure no regressions.
3. **Publish** the project so the updated `<head>` goes live on the deployed URL.