# DS LAB - Data Science Laboratory: Experiments & Projects

A multi-page portal (HTML + CSS + vanilla JS) with an Express backend.
All data lives in JSON files (`backend/data`) and uploads in `backend/uploads`, so it survives refreshes and server restarts. No database setup is needed.

## Run it
```bash
cd backend
npm install
npm start
```
Open **http://localhost:5000** (the Express server also serves the frontend).
Always open the site through this address - opening the HTML files directly from disk will not reach the API.
To change the port, edit `backend/.env`.

## Pages
| Page | Purpose |
|---|---|
| `index.html` | Home with Subjects / Experiments / Tools / Resources cards |
| `subjects.html` -> `subject-details.html?id=` -> `module-details.html?id=&module=` | Subject, its 5 modules, module content (PDF, videos, Q&A) |
| `experiments.html` -> `experiment-details.html?id=` -> `sub-experiment-details.html?id=` | Experiments, sub-experiments (chips like 1A, 1B open a preview, Read More opens details) |
| `tools.html`, `resources.html` | Card lists with add / edit / delete / details |
| `profile.html` | Student profile (also shown as the compact card top-right) |

## Folder map
- `frontend/js/api.js` - fetch wrapper. `main.js` - shared UI (header, toasts, modals, code blocks, module editor, sub-experiment widgets, reusable Tools/Resources page).
- `backend/src/server.js` - all REST routes, validation, uploads, JSON storage.

## Rules enforced by the backend
- Images: JPG/JPEG/PNG/WEBP. Videos: MP4/WEBM/MOV, max 100 MB. Module PDFs: PDF only.
- GitHub and YouTube URLs are validated before saving.
- Editing never removes media unless you choose a replacement or tick "Remove". Replaced/removed files are deleted from disk.
- Each subject always has exactly 5 modules.

## Using the long description
Blank line = new paragraph. A line starting with `## ` becomes a sub-heading.

## Adding future features (Assignments, Notes, Marks ...)
1. Add a new entry to `DATA_FILES` in `server.js`.
2. For simple card lists call `registerCatalog({...})` or add routes beside the existing ones.
3. Copy `tools.html` / `tools.js` as a starting page and add a link in `NAV_ITEMS` (`main.js`).

## Optional videos (Modules, Experiments, Tools, Resources)
Every form has **Video (Optional)** with *Upload Video* OR *Video Link* (either, both or neither). YouTube / Shorts links are embedded, direct `.mp4/.webm/.mov` links use the video player, other links show a "Watch Video" button. Uploaded videos are limited to 100 MB.

## Run Code
Open an experiment (or sub-experiment): edit the code, click **Run Code**, and the result appears under **Execution Output** (status, output, errors). **Save Code** stores the edited code.
- Supported: Python, JavaScript (Node.js), C, C++, Java and R - only if that runtime is installed on the machine running the backend (otherwise a clear "runtime is not available" message is shown).
- Each run is a separate child process in a temporary folder with a 10 second time limit, a 100 KB output limit, and cleanup afterwards. The server keeps running if the code fails.
- **Security note:** this is process isolation, not a full sandbox - the code runs with the same permissions as the Node server. Use it on your own computer or a trusted lab network only; do not expose it to the public internet.

## DS LAB logo
Profile page -> **DS LAB Logo** -> Change Logo -> preview -> Save Logo (PNG/JPG/JPEG/WEBP). Stored in `backend/uploads/logo` and `backend/data/settings.json`. "Reset to default" brings back the original DS mark.

## Default logo (MBU)
Put the Mohan Babu University logo at **`frontend/assets/mbu-logo.png`** (exact name, PNG). It is the default header logo. Until the file exists the header shows the "DS" mark instead.
A custom logo uploaded via Profile -> Edit Logo overrides it; "Remove / Reset Logo" returns to the MBU logo.