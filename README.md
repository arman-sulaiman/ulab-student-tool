# ULAB Student Tool — v2.1.0

React + JavaScript + Node.js, with responsive light/dark UI, cover-page creation, browser-local PDF merging, AI screenshot-to-weekly-routine, and a protected admin dashboard.

## Start on Windows

Use Node.js **22.13 or newer** (Node 24 recommended). In the extracted project folder:

```powershell
npm install
npm run setup-fonts
npm run setup-admin
npm run dev
```

Open **http://localhost:5173**. Save the admin password printed by `setup-admin`; it creates/updates `.env` without exposing your credentials to the frontend. Run it again only to reset the password and invalidate sessions. Do not overwrite `.env` with `.env.example` after this step.

For AI extraction, sign in at `/admin`, open **AI settings & failures**, enter your Gemini API key and model, then save. New installations receive AI_CONFIG_ENCRYPTION_KEY from setup-admin. Existing installations should run `npm run setup-ai-encryption` and restart first. Alternatively, use GEMINI_API_KEY/GEMINI_MODEL in your server environment. The default model is `gemini-2.5-flash`. Setup & safety displays the actual configured model. AI requires your own available model/quota. Manual routine creation does not require AI.

For a production build on your computer:

```sh
npm run build
npm start
```

Open http://localhost:3001. A prebuilt frontend is included, but rebuild after source edits.

## Admin dashboard

Open `/admin` directly; the admin entry is intentionally hidden from the student navigation. Sign in with your generated password. Admin sessions last eight hours and use HttpOnly, SameSite cookies (Secure on production/Vercel). Passwords are stored as scrypt hashes in environment configuration; sessions, settings and analytics are persisted in the database. Login and AI rate limits use the database, including across serverless instances.

### Analytics

Date filters use Asia/Dhaka. Blank dates show all recorded activity. Tracking starts with this version; previous usage cannot be recovered.

- **Website visits:** frontend page loads, including refreshes; direct `/admin` loads are excluded.
- **Unique visitors:** distinct anonymous browser identifiers among recorded actions.
- **Cover pages generated:** successful server PDF generation, not proof of download.
- **PDF merge exports:** successful browser merge/export actions (including a one-file rename).
- **PDFs processed in merges:** total number of input PDFs across those actions.
- **Routine PDFs generated:** successful browser routine PDF exports; repeat exports count again.
- **AI users:** distinct browser identifiers with at least one successful non-empty AI extraction.
- **Successful AI extractions:** non-empty, validated extraction responses.
- **Daily activity:** counts by date and action.

Unique browsers are estimates, not verified student accounts. Clearing cookies, changing devices, bots, blocked tracking and network failures affect counts. Browser export events are self-reported and cannot be treated as audited usage. Repeated event IDs are deduplicated; legitimate new actions get new IDs. No student names, IDs, filenames, PDFs or screenshot content are stored in analytics.

### Website customization

Change the site title, sidebar badge, sidebar message (line breaks supported), independent-utility text, and footer/copyright wording. Upload separate website and cover-page logos (PNG, max 500 KB, max 3000 pixels per dimension). Restore defaults individually. Save applies changes to the current page; other open tabs see them after refresh. Logos are persisted in the database and cover logo changes also appear in exported PDFs, with aspect ratio preserved.

The **About this tool** text is also editable (up to 2,000 characters).

The **PDF Typography panel has been removed** from Setup & safety. **AI Extraction** replaces the previous Gemini Extraction heading and declares Google Gemini plus the configured model ID.

## Storage and hosting

- **Local:** leave `DATABASE_URL` blank. SQLite is created at `data/ulab.sqlite` (or `DATA_DIR`). Back up the entire data directory while the app is stopped.
- **Vercel:** PostgreSQL is required. Set `DATABASE_URL` to a pooled PostgreSQL connection string, e.g. Neon. Settings, logos, sessions, rate limits and counters persist outside the function filesystem.
- **Other Node hosts:** use PostgreSQL, or a mounted persistent disk with `DATA_DIR`; never use ephemeral disk for production SQLite.

See **DEPLOYMENT.md** for Vercel and other Node hosting steps. The project has not been published. PostgreSQL/Vercel deployment is configured but not live-tested with your account.

## Fonts and cover templates

`npm run setup-fonts` copies regular/bold Times New Roman from your Windows/macOS font installation into `fonts/times.ttf` and `fonts/timesbd.ttf`. On Linux, supply your own licensed copies. Proprietary font files are not redistributed in this ZIP. They are required for cover export; the app does not substitute another font. Upload/bundle them on your host subject to your font licence. Preview loads these fonts from `/fonts` when available.

Five A4 cover types: Assignment, Lab Assignment, Lab Report, Project Report and Open-Ended Lab Report. Individual and 2/3/5-student group submissions; department/school selectors, optional numbers/titles, uppercase names, blue/black accents, custom download names and overflow checks. See `reference/REVIEW.md` for the mapping to the six supplied PDFs.

## Student tools and privacy

PDFs are merged/reordered in the browser (50 MB per input). Files are not uploaded for merging. Digital signatures, form structures and bookmarks are not guaranteed to survive a merge.

Cover data goes to your Node server to create the PDF but is not saved. Draft cover/routine fields remain in localStorage. Clear saved drafts on shared devices. Anonymous cookies measure usage; the UI discloses tracking under Setup & safety.

Screenshots go through the server to Google only after the user chooses AI extraction. The app does not save them. Screenshots above 2.8 MB are resized/compressed before sending to accommodate hosted request limits; crop screenshots if text becomes unclear. The extraction prompt handles merged registration cells and different lab times on different days. Verify extracted data before exporting. English/Latin routine PDFs and Unicode JSON backups are supported.

## Source map / validation

- `src/Admin.jsx`: admin login, analytics and branding editor.
- `src/main.jsx`, `src/style.css`: student UI and themes.
- `src/tracking.js`: browser events and screenshot compression.
- `server/admin.js`: auth, settings and analytics endpoints.
- `server/store.js`: SQLite/PostgreSQL persistence.
- `server/index.js`: Express app, cover and AI APIs; exported for Vercel.
- `api/index.js`, `vercel.json`: Vercel function entry and routing.
- `server/pdf.js`, `src/routine-pdf.js`: PDF generators.
- `npm test`: 14 tests including a multi-request admin integration test.

Verified: production build; auth/unauthorized access; cross-origin mutation rejection; invalid logo rejection; PNG saving; settings/counters across server restart; event deduplication; counts; logout revocation; existing PDF/data tests. PDF/JPG rasterization and revised single/five-person cover layouts were inspected; cover layout verification used a temporary substitute font, since Times New Roman is user-supplied. UI browser interaction testing, live Gemini, real Google Calendar import, device WhatsApp sharing, and hosted PostgreSQL/Vercel verification were not available. No API keys or administrator credentials are included.


## New in 2.1.0

- **Calculate result:** GPA from course codes, marks or grades and credits; CGPA from semester GPAs and credits. Uses the provided scale: A+ 4.0, A 4.0, A- 3.8, B+ 3.3, B 3.0, B- 2.8, C+ 2.5, C 2.2, D 1.5, F 0.0. No early rounding; display is rounded to two decimals. Decimal marks use exact lower thresholds. Retake/transfer policies are not inferred.
- **PDF Books Library:** disabled navigation item marked Coming soon.
- **Cover typography:** 16 pt main type/title/course/section; 14 pt semester/course code/date; 15 pt student/faculty name; 13 pt ID/department/designation/school. The supplied DOCX confirms print point units; explicit requested sizes take precedence over mixed 13.5 pt runs in the document. Logo moved down 20 pt for additional top margin. Long covers still receive a one-page overflow error instead of clipping.
- **Default filenames:** first student ID + course code + compact cover type + optional number. Example: `243014043_CSE2201_LabReport_1.pdf`. Spaces removed; user can override. Group covers use the first listed student's ID.
- **WhatsApp:** generating the cover opens a phone-number dialog. Download-and-open-chat accepts an international number; attach the PDF manually and press Send inside WhatsApp. Devices supporting native file sharing also show a Share PDF attachment button, where the user chooses WhatsApp and the recipient. Browser click-to-chat cannot auto-attach a file to a specified number. No WhatsApp Business API, upload server or automatic message sending is implemented.
- **Routine JPG:** renders the exact PDF design at 2.5× resolution (about 2105 × 1488 per page). One page downloads as JPG; multi-page exports are a ZIP of JPGs. Fonts and PDF worker are bundled locally. English/Latin export text is supported.
- **Google Calendar:** downloads an ICS file with weekly recurrence from semester start to end, using Asia/Dhaka UTC+06:00. Import it on desktop via Google Calendar → Settings → Import & export. This is file export, not OAuth account synchronization. Holidays are not excluded; importing repeatedly can duplicate events.
- **AI administration:** API key and model can be updated immediately from `/admin`. Saved keys use AES-256-GCM encryption under the separate AI_CONFIG_ENCRYPTION_KEY environment secret. Dashboard values override environment values. Blank key keeps the current key; removing the saved key falls back to environment configuration. Keys are never returned in API responses.
- **AI failures:** admin sees up to 100 recent handled server-side failures from the last 90 days (time, model, sanitized reason). Missing key, rate limit, provider status, timeout, invalid response and no-classes responses are recorded. No images, extracted text or credentials are logged. Requests blocked before reaching the extraction handler or disconnected clients cannot always be recorded.

### Upgrade an existing 2.0 installation

Back up your `.env` and database. Copy the new source files, retaining `.env`, `data/`, your font files and host environment values. Then:

```sh
npm install
npm run setup-ai-encryption
npm run build
npm start
```

Do not run setup-admin unless you intend to reset the administrator password. New database tables initialize automatically; existing site settings and analytics remain. Copy the new AI_CONFIG_ENCRYPTION_KEY to your hosting environment before saving an API key. Keep that encryption key stable and backed up separately from the database; replacing it makes previously encrypted keys unreadable, requiring you to re-enter the provider key. The secret is not included in this ZIP.
