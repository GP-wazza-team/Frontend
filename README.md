# Wazza AI — Frontend

React + Vite frontend for the Wazza AI platform. Provides the dashboard, chat interface, asset library, and generation controls.

---

## Running with Docker (recommended)

### 1. Clone the repo

```bash
git clone https://github.com/GP-wazza-team/Frontend.git
cd Frontend
```

### 2. Run the full stack

The frontend is designed to run alongside the backend. Use Docker Compose from the project root:

```bash
# From the wazza/ root directory (contains docker-compose.yml)
docker compose up --build
```

This starts:
- **Frontend** → http://localhost:3000
- **Backend** → http://localhost:8000
- **MySQL database** → port 3306

### 3. Run frontend only (Docker)

If the backend is already running elsewhere:

```bash
docker build -t wazza-frontend .
docker run -p 3000:80 wazza-frontend
```

> Make sure the backend URL in `.env` points to the correct host.

---

## Running locally (without Docker)

### Requirements
- Node.js 18+

### Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env if your backend is on a different URL

# Start development server
npm run dev
```

Dev server runs at http://localhost:5173

### Build for production

```bash
npm run build
```

Output goes to `dist/`.

---

## Environment Variables

Copy `.env.example` to `.env`:

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000` |
| `VITE_WS_URL` | WebSocket URL for live updates | `ws://localhost:8000` |

> **Never commit your `.env` file.** It is already in `.gitignore`.

---

## Tech Stack

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Nginx](https://nginx.org/) (production container)
