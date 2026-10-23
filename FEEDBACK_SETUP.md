# Connect code-protected visitor feedback

The feedback UI is implemented, but cannot save real visitor messages until an external Supabase project is connected. GitHub Pages serves static files and cannot validate a shared code or write messages on its own. The diary's GitHub token is never used for visitor feedback.

1. Create a Supabase project at https://supabase.com/dashboard (or use your existing project).
2. Open **SQL Editor**, paste the contents of `supabase/feedback.sql`, and run it. The script can run repeatedly without removing messages.
3. In the project's **Connect** dialog / **Settings → API Keys**, copy the project URL and **publishable** key (or the legacy **anon** key).
4. Put these two public values in `feedback-config.js`:

   ```js
   window.FEEDBACK_CONFIG = {
     url: 'https://YOUR_PROJECT.supabase.co',
     publicKey: 'YOUR_PUBLISHABLE_KEY'
   };
   ```

   Never use a secret key, service_role key, database password or GitHub token here. This file is public.
5. Publish the updated files to GitHub Pages. In **Housekeeping → Feedback**, enter `AlexEELs`, a name if desired, and a message. After **Feedback saved**, reload from another browser and check that the message is visible. This live verification has not yet been performed.

Messages are public; only submission requires the shared code. Visitors have no permission to edit or delete messages. The server-side `submit_journal_feedback` function checks the code, trims the message and enforces length limits. Direct anonymous table inserts are disabled. The project owner can remove unwanted feedback through the Supabase Table Editor. The latest 50 messages are displayed.

If cloud network settings restrict external connections, add the exact `YOUR_PROJECT.supabase.co` hostname without replacing existing allowed destinations. Visitors also need to be able to reach this project from their browsers.

## Validation

`node tests/feedback.cjs` tests the browser flow with a mocked Supabase API. It checks wrong codes, confirmed saves, reloads, error handling and untrusted message rendering. It does not prove the external project is connected.

The SQL was also exercised in a temporary PostgreSQL-compatible PGlite instance: repeatable setup, wrong-code rejection, correct-code insertion, public reading, and denial of direct insert/delete were verified.
