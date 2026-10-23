# EEL Journal

A public internship journal for GitHub Pages. English interface, dark theme, no application dependencies or build step.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

The app reads `data/diary.json` from GitHub first and falls back to the local copy if the API is unavailable. Keep your existing diary file when updating the application. User-written titles, descriptions, notes and weekly summaries are preserved in their original language.

## Use the journal

- **Overview:** compact expandable task rows, indented subtasks and total logged time. Expand a row to see its activities. Parent totals include subtasks.
- **Calendar:** a monthly scheduling calendar. Select a day to see its activities in the right-hand agenda, then use **+ Schedule task**. On mobile the agenda appears below the month.
- **Tracking:** compact weekly cards that expand when clicked, with editable titles and summaries alongside calendar activities. Use **Edit card** or **+ Weekly card**. Moving a summary to another week does not move calendar activities.
- **Tasks:** minimized cards open a full task detail with description, dates, start/end times and total time dedicated directly to that task. Today/week counters appear in Tracking, not task details. Create, edit and delete tasks and subtasks. Drag the handle or use the up/down arrows to reorder them. Change the parent task in the edit form.
- **My tasks:** open a task from the sidebar, edit it with the pencil or delete it with **×**. Deletion requires confirmation, preserves activities without that task, and moves direct subtasks to the top level.
- **Housekeeping:** a simple notes board for questions, reminders and ideas. Create, edit or delete notes. No activity logging or completion checkboxes; existing notes remain available.

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

## Task views and mobile use

Use **By tasks** for the indented hierarchy, or **By status** for the four-column board: **TO DO**, **In progress**, **Checking**, **Done**. Drag the task handle into a column to save its status. On mobile or with a keyboard, use the card’s **Move to** selector. Each subtask has its own status. Existing tasks default to **TO DO** until changed. The status is saved alongside each task and preserved when editing.

Use **Refresh** to load the latest diary data without signing out. On mobile, the board stacks vertically, controls have larger touch targets, and unnecessary headings are hidden. Refresh is unavailable while saving or editing an open form, so it cannot discard the form.

Task cards are compact in both views. Open **Manage** on a card to change its status; drag handles and edit/delete controls remain available in edit mode.

## Visitor Feedback

Housekeeping includes a separate Feedback area for visitors using the shared code `AlexEELs`, without a GitHub account or the diary editor token. It requires an external storage connection; until then, the UI clearly indicates that messages cannot be saved. See [FEEDBACK_SETUP.md](FEEDBACK_SETUP.md) to connect the GitHub-backed feedback service.

Weekly cards and activity lists use chronological order: oldest first, newest last, with same-day activities ordered by start time. Public feedback is also displayed oldest first within the latest 50 messages. Manual task order remains controlled by drag handles and arrows.

Housekeeping has a compact **Feedback inbox** and an unread count in the navigation. Expand a message to mark it read, or choose **Mark all as read**. Read status is stored in this browser and does not sync between devices. Feedback is checked on page load, on entering Housekeeping, with Refresh feedback, and every minute while the page is visible. Visitor submission is available under **Leave feedback** or on the direct Feedback page.

Feedback messages appear as cards. In **Edit mode**, use **Edit feedback** to update the author name or message using your editor GitHub token. Edits preserve the original message date and show an edited timestamp. New visitor messages are retained if they arrive during a save; a simultaneous edit to the same message triggers a warning instead of overwriting it. No Worker redeployment is needed for this editor feature.
