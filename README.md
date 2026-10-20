# EEL Journal

A public internship journal for GitHub Pages. English interface, dark theme, no application dependencies or build step.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

The app reads `data/diary.json` from GitHub first and falls back to the local copy if the API is unavailable. Keep your existing diary file when updating the application. User-written titles, descriptions, notes and weekly summaries are preserved in their original language.

## Use the journal

- **Overview:** today's hours, weekly and total time, a weekly card and time by task.
- **Calendar:** day, week and month views, plus upcoming activities.
- **Tracking:** editable weekly titles and summaries alongside calendar activities. Use **Edit card** or **+ Weekly card**. Moving a summary to another week does not move calendar activities.
- **Tasks:** create, edit and delete tasks and subtasks. Drag the handle or use the up/down arrows to reorder them. Change the parent task in the edit form.
- **My tasks:** open a task from the sidebar, edit it with the pencil or delete it with **×**. Deletion requires confirmation, preserves activities without that task, and moves direct subtasks to the top level.
- **Housekeeping:** create, edit, complete and delete notes.

Activity forms ask for start and end dates and times. Duration is calculated automatically. End must be after start; select the following end date for overnight work. Existing activities containing only a start time and duration remain compatible, and their end time is calculated when editing. Time is attributed to the activity's start date. Future activities are shown as planned and excluded from Overview and weekly logged totals until their start time. Reload to update those calculations.

## Edit and save

Create a fine-grained GitHub token for `alex5674321/Seguiment_EELs`, with **Contents: Read and write** permission. Select **Edit mode**, enter the token and sign in. Never commit or share your token. It stays in memory until logout, reload or page close.

Edits write to `data/diary.json` on `main`. Wait for **Saved to GitHub ✓**. Concurrent changes trigger a warning and reload the latest data so that you can apply your change again. Deleting an item does not remove its earlier versions from Git history. The diary is public; do not store confidential information.

## Publish

In GitHub **Settings → Pages**, select **Deploy from a branch**, branch **main**, folder **/ (root)**. The site is https://alex5674321.github.io/Seguiment_EELs/. Deployment may take a few minutes; refresh after it completes.

## Browser checks

With Playwright available in Node's module path and Chromium installed, start the local server above and run:

```sh
node --check app.js
node tests/browser.cjs
```

The test defaults to `/usr/bin/chromium`; use `CHROMIUM_PATH` to select another executable. It mocks GitHub requests and never writes test data to the real diary. It covers navigation, fallback loading, editing, ordering, sidebar deletion, weekly summaries, concurrent changes, time validation, legacy durations, overnight activities and mobile layout.
