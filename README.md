# Hagbaad 💸

A full-stack **money transfer API** built with a **Python / FastAPI** backend and a **React / TypeScript** frontend styled with plain **CSS custom properties**.

> **Hagbaad** (Somali: ሓጋዓ) — meaning "transfer" or "to send forward".

---

## ✨ Features

- **Send transfers** between accounts in USD, EUR, GBP, CAD, or JPY
- **Live fee preview** (1.5% service fee) before confirming
- **Multi-currency** support with real-time exchange rate conversion
- **Transaction history** filterable by account
- **Account dashboard** showing live balances
- **Exchange rates panel** with switchable base currency
- **Auto-dismissing success toast** on completed transfers
- **Offline detection** — UI shows API status in the header
- Fully typed with **TypeScript** on the frontend
- Clean **CSS design system** using custom properties (no Tailwind, no UI kit)

---

## 🗂 Project Structure

```
hagbaad/
├── backend/
│   ├── main.py            # FastAPI application
│   └── requirements.txt   # Python dependencies
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── src/
│       ├── main.tsx       # React entry point
│       ├── App.tsx        # All UI components
│       ├── api.ts         # Typed API client
│       ├── types.ts       # Shared TypeScript interfaces
│       └── index.css      # Global stylesheet (CSS custom properties)
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |

---

### 1 — Backend (FastAPI)

```bash
cd backend

# Create and activate a virtual environment (recommended)
python -m venv .venv
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Start the development server
uvicorn main:app --reload --port 8000
```

The API will be live at **http://localhost:8000**.  
Interactive docs (Swagger UI) are at **http://localhost:8000/docs**.

---

### 2 — Frontend (React + TypeScript + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be live at **http://localhost:5173**.

---

## 📡 API Reference

All endpoints return JSON. The base URL is `http://localhost:8000`.

### General

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | API info |
| `GET` | `/health` | Health check |

### Accounts

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/accounts` | List all accounts |
| `GET` | `/accounts/{id}` | Get a single account |

### Transfers

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/transfer` | Execute a transfer |
| `GET` | `/transactions` | List all transactions |
| `GET` | `/transactions?account_id=ACC001` | Filter by account |

### Rates

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/rates` | Exchange rates (USD base) |

---

### POST `/transfer` — Request Body

```json
{
  "from_account": "ACC001",
  "to_account":   "ACC002",
  "amount":       500.00,
  "currency":     "USD",
  "note":         "Invoice #42"
}
```

### POST `/transfer` — Response

```json
{
  "transaction_id":       "HGB-3F9A12B7C1",
  "status":               "completed",
  "from_account":         "ACC001",
  "to_account":           "ACC002",
  "amount":               500.00,
  "currency":             "USD",
  "converted_amount_usd": 500.00,
  "fee":                  7.50,
  "timestamp":            "2026-06-23T14:30:00Z",
  "note":                 "Invoice #42"
}
```

---

## 💱 Supported Currencies

| Code | Name | Symbol |
|------|------|--------|
| USD  | US Dollar | $ |
| EUR  | Euro | € |
| GBP  | British Pound | £ |
| CAD  | Canadian Dollar | CA$ |
| JPY  | Japanese Yen | ¥ |

---

## 🎨 CSS Design System

All styles live in `frontend/src/index.css` and use **CSS custom properties** for the design token layer — no preprocessors, no utility frameworks.

```css
:root {
  --accent:   #2563eb;   /* Primary blue */
  --green:    #16a34a;   /* Success */
  --red:      #dc2626;   /* Error / destructive */
  --ink:      #0d0f14;   /* Primary text */
  --surface:  #f7f8fc;   /* Page background */
  --font-ui:  'Inter', system-ui, sans-serif;
  --font-d:   'Syne', sans-serif;   /* Display / logo */
}
```

---

## 🏗 Architecture Notes

- **Backend state** is in-memory (a Python dict). Restarting the server resets all balances and transactions. To persist data, swap the dicts for a SQLite/PostgreSQL database using SQLAlchemy or Tortoise ORM.
- **CORS** is open (`allow_origins=["*"]`) for local development. Lock this down before any production deployment.
- **Exchange rates** are hardcoded constants. For a production app, replace with a live provider such as [Open Exchange Rates](https://openexchangerates.org/) or [Fixer.io](https://fixer.io/).
- The **1.5% service fee** is calculated server-side and cannot be bypassed by the client.

---

## 🛠 Production Checklist

- [ ] Replace in-memory store with a real database
- [ ] Restrict CORS to your frontend domain
- [ ] Add authentication (JWT / OAuth2)
- [ ] Wire up a live exchange rate API
- [ ] Add rate limiting (e.g. `slowapi`)
- [ ] Run behind a reverse proxy (Nginx / Caddy)
- [ ] Set `VITE_API_URL` env var for the frontend build

---

## 📄 License

MIT — free to use, modify, and distribute.
