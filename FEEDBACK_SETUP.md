# Activate visitor Feedback with the shared code

Visitors enter **AlexEELs** in Housekeeping → Feedback. A Cloudflare Worker checks the code and saves messages to `data/feedback.json` in `alex5674321/Seguiment_EELs`, branch `main`. Messages are stored in GitHub, separately from `data/diary.json`. No Supabase database is required.

The implementation is ready, but the live service has NOT been deployed or connected. Never send the GitHub token through chat or put it in the repository, HTML, JavaScript, or `feedback-config.js`.

## Activate in Cloudflare

1. Create or sign in to a Cloudflare account, then open **Workers & Pages → Create application → Worker**. Name it `eel-feedback`.
2. In **Edit code**, replace the example with the complete contents of `feedback-worker/worker.mjs`. Save/deploy.
3. In the Worker's **Settings → Variables and Secrets**, add these as **Secret** values:
   - `GITHUB_TOKEN`: a fine-grained GitHub token limited to `alex5674321/Seguiment_EELs`, with **Contents: Read and write**. Use a separate token for this service, with an expiration date you can maintain.
   - `FEEDBACK_CODE`: `AlexEELs`.
4. Add the ordinary variable `ALLOWED_ORIGIN` with value `https://alex5674321.github.io`. Save/deploy the changes.
5. Copy the public Worker URL and put it in `feedback-config.js`, adding `/feedback`:

   ```js
   window.FEEDBACK_CONFIG = {
     endpoint: 'https://eel-feedback.YOUR_SUBDOMAIN.workers.dev/feedback'
   };
   ```

   This endpoint is public and safe to share. No token or access code belongs in that configuration file.
6. Publish the configuration change to GitHub Pages. You can share the public Worker URL in chat to have the frontend configuration completed; keep secret values in Cloudflare.
7. Open Housekeeping → Feedback in another browser, enter the shared code and send a message. Wait for **Feedback saved**, then reload and verify the message appears. Check that `data/feedback.json` was created in GitHub. This live verification is still pending.

Alternatively, developers with Wrangler configured may deploy from `feedback-worker` using `wrangler secret put GITHUB_TOKEN`, `wrangler secret put FEEDBACK_CODE`, then `wrangler deploy`. Secret commands prompt securely; never place values on a command line or in tracked files.

## Behavior

Anyone can read the latest 50 feedback messages. Anyone with the shared code can submit feedback without a GitHub account or the diary editor token. Visitors cannot edit/delete messages or choose a GitHub file/repository to modify. The owner can remove messages by editing `data/feedback.json` in GitHub.

The Worker retries GitHub version conflicts and keeps concurrent messages. A request ID prevents duplicate messages on retry. It does not log or return the GitHub token. The shared code controls submission only; it does not make public messages private. Feedback writes stop if the file reaches 500 KB, requiring owner maintenance rather than silently deleting old messages.

## Checks

```sh
node tests/feedback-worker.mjs
node tests/feedback.cjs
```

The first checks the server logic with a mocked GitHub API. The second checks the browser UI with a mocked feedback service. Neither proves the live Worker is deployed or the token works. No feedback test is written to the real repository.
