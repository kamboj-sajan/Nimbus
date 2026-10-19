# Nimbus ☁️

A real-time collaborative cloud IDE: Monaco editor, a real terminal, live preview, and an
isolated runtime per user, all in the browser.

- **Editor:** Monaco (the editor behind VS Code) with highlighting for 50+ languages, autosave and ⌘/Ctrl+S
- **Real-time sync:** edits stream over Socket.IO to your other tabs and straight into your runtime
- **Terminal:** a real shell (node-pty + xterm.js) running inside your workspace
- **Live preview:** open any port your app listens on, proxied and access-checked per user
- **File explorer:** create, rename and delete files and folders, including nested paths
- **Two-way file sync:** files changed in the terminal (`npm init`, `git clone`, …) are persisted automatically
- **Accounts:** registration, login (email or username), email verification, forgot/reset/change password
- **Per-user runtimes:** one Kubernetes Deployment + Service per user, created on demand

## Architecture

```mermaid
flowchart LR
  B[Browser<br/>React · Monaco · xterm] -->|REST /api, Socket.IO| API[api<br/>auth · files · collab hub]
  B -->|/spawn /status /delete| O[orchestrator]
  B -->|/user/&lt;name&gt;/&lt;port&gt;/* HTTP + WS| O
  O -->|creates| R[runtime per user<br/>PTY · fs · watcher]
  O -->|proxies| R
  R -->|hydrate snapshot| API
  API --> DB[(PostgreSQL)]
  API --> S[(Azure Blob /<br/>local disk)]
```

| Service | Port | What it does |
| --- | --- | --- |
| [`web/`](web) | 5173 | React 19 + Vite SPA: landing, auth pages, IDE |
| [`api/`](api) | 3001 | Express 5 API: JWT auth, workspace files on Azure Blob or local disk, Socket.IO collaboration hub. Drizzle ORM + PostgreSQL |
| [`orchestrator/`](orchestrator) | 3002 | Starts each user's runtime (Kubernetes or local process) and reverse-proxies HTTP and WebSocket traffic to it, checking the user's token |
| [`runtime/`](runtime) | 3000 | Runs inside each workspace: terminal sessions, applies live editor changes to disk, watches the workspace for changes |

**What happens when you edit:** Monaco emits a change batch. The browser sends it to the API hub,
which relays it to your other tabs, and to your runtime, which applies it to disk so the terminal
always runs your latest code. A debounced autosave writes the file to storage.

**What happens when you open the IDE:** the browser calls `POST /spawn` and polls `GET /status`
until the runtime is running. On boot the runtime downloads your files from
`GET /api/files/snapshot`, using a short-lived read-only token minted by the orchestrator. The
browser then connects the runtime socket at `/user/<username>/3000/socket.io/`.

## Quick start (local, zero config)

Requirements: Node.js 20+ (22 recommended) and macOS or Linux.

```bash
npm run setup   # installs every service
npm run dev     # api + orchestrator + web
```

Open http://localhost:5173, create an account, and you're in. No Postgres, Azure, Docker or
Kubernetes needed, because local development defaults to:

- **embedded PostgreSQL** ([PGlite](https://pglite.dev)) at `.nimbus/db`
- **local-disk storage** at `.nimbus/storage`
- **local orchestrator mode**: each user's runtime is a child process with its workspace in `.nimbus/workspaces/<username>`

To wipe all local data, run `npm run reset`.

> ⚠️ Local mode has **no isolation**. The terminal is a shell on your machine with your user's
> permissions, and preview ports map straight to `localhost`. Use it for development only.

Want a real Postgres? `docker compose up -d`, then set
`DATABASE_URL=postgres://nimbus:nimbus@localhost:5432/nimbus` in `api/.env`.

## Configuration

Each service has a commented `.env.example`. The most important settings:

| Variable | Service | Default | Notes |
| --- | --- | --- | --- |
| `JWT_SECRET` | api, orchestrator | dev value | **Required in production, and must be identical in both** |
| `DATABASE_URL` | api | *(empty → PGlite)* | Migrations in `api/drizzle/` run automatically on boot |
| `STORAGE_DRIVER` | api | `local` | `azure` uses `AZURE_STORAGE_CONNECTION_STRING` / `AZURE_STORAGE_CONTAINER_NAME` |
| `REQUIRE_EMAIL_VERIFICATION` | api | `false` | Without SMTP settings, links are printed to the API console |
| `ORCHESTRATOR_MODE` | orchestrator | `local` | `kubernetes` for real per-user pods |
| `RUNTIME_API_URL` | orchestrator | `http://localhost:3001` | API URL as seen *from inside* a runtime |
| `VITE_API_URL`, `VITE_ORCHESTRATOR_URL` | web | localhost URLs | Leave empty when everything is served behind one ingress |

## API reference

All `/api` routes except register, login, the password-reset flow and verify-email require
`Authorization: Bearer <token>`.

**Auth** (`/api/auth`): `POST /register` · `POST /login` · `POST /logout` · `GET /me` ·
`GET /verify-email?token=` · `POST /forgot-password` · `POST /reset-password` · `POST /change-password`

**Files** (`/api/files`): `GET /tree` · `GET /list` · `GET /content?path=` · `PUT /content` ·
`POST /` *(create file/folder)* · `PATCH /` *(rename/move)* · `DELETE /` · `GET /snapshot`

**Orchestrator:** `POST /spawn` · `GET /status` · `POST /delete` · `ANY /user/<username>/<port>/*` (proxy)

**Runtime** (via the proxy): `GET /health` · `GET /fs/tree` · `POST|PATCH|DELETE /fs/entry` · `PUT /fs/file`

**Socket events**

| Socket | Client → server | Server → client |
| --- | --- | --- |
| API hub (`auth: { token }`) | `file:open`, `file:close`, `doc:changes`, `doc:saved` | `doc:changes`, `doc:saved`, `tree:changed` |
| Runtime (`query: { token }`) | `editor:changes`, `terminal:start`, `terminal:input`, `terminal:resize` | `terminal:output`, `terminal:exit`, `fs:add`, `fs:change`, `fs:remove`, `editor:error` |

## Deploying to Kubernetes

1. Build and push the four images (`api/`, `orchestrator/`, `runtime/`, `web/` each have a Dockerfile):
   ```bash
   docker build -t ghcr.io/your-org/nimbus-api:latest api
   docker build -t ghcr.io/your-org/nimbus-orchestrator:latest orchestrator
   docker build -t ghcr.io/your-org/nimbus-runtime:latest runtime
   docker build -t ghcr.io/your-org/nimbus-web:latest web
   ```
2. Update the image names and your domain in [`deploy/k8s/`](deploy/k8s) (`10-config.yaml`, `30`–`60`).
3. `cp deploy/k8s/11-secrets.example.yaml deploy/k8s/11-secrets.yaml` and fill in real values (this file is git-ignored).
4. Install [ingress-nginx](https://kubernetes.github.io/ingress-nginx/), then run `./deploy/deploy.sh`.

The manifests include least-privilege RBAC for the orchestrator, and NetworkPolicies so that only
the orchestrator can reach workspace pods and workspaces can't reach Postgres. NetworkPolicies need
a CNI that enforces them (for example Calico or Cilium).

## Security notes

- Every proxied request and WebSocket upgrade is checked: the token's username must match the
  `/user/<username>/…` path. A CORS preflight is the one exception, because browsers never send
  credentials with it.
- Preview iframes authenticate with an HttpOnly cookie scoped to `/user/<username>`, set by `/spawn`.
- Runtimes never receive storage credentials or `JWT_SECRET`. They only get a read-only, 24-hour
  `snapshot` token. Shells started in the terminal have `NIMBUS_*` variables removed from their environment.
- Workspace file paths are normalised, and `..` is rejected in the API, the runtime and storage.
- For production, serve previews from a separate subdomain so untrusted app code doesn't share an
  origin with the IDE.

## Known limitations

- Collaboration relays raw change batches (there's no OT/CRDT). If two tabs type in the same spot at
  the same moment, they can drift apart until the file is reopened. Yjs would be the natural upgrade.
- One workspace per user. Multi-project and team sharing aren't implemented yet.
- The API runs as a single replica. Scaling it needs sticky sessions and a shared Socket.IO adapter.
- Apps in the preview are served under `/user/<name>/<port>/`, so dev servers that use absolute asset
  paths need a matching base path (for example Vite's `--base`).
