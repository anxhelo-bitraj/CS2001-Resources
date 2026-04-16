# Restaurant GM Email Manager

An AI-powered email management application for restaurant general managers, integrating with Microsoft Outlook via the Graph API and Claude AI for intelligent drafting, tone learning, and daily briefings.

## Features

- **Microsoft Outlook Integration** — full read/write via Microsoft Graph API (OAuth2/PKCE)
- **AI Categorisation** — auto-categorises emails into CEO/Board, Admin/Ops, Guest, Supplier, Staff
- **Tone-Learned Drafting** — analyses your sent email history per contact, learns your writing style, generates drafts that sound like you
- **Email Summaries & Task Extraction** — one click to summarise or extract action items from any email
- **Morning Briefing** — daily AI-generated digest at 7:30 AM with urgent emails, tasks, and calendar
- **Guest Review Quality Scoring** — scores your draft replies to guests 0–100 with improvement suggestions
- **Template Library** — 15 pre-seeded restaurant-specific templates with variable substitution
- **Follow-up Reminders** — snooze and set reminders on any email
- **Response Time Analytics** — tracks SLA compliance per category
- **Sentiment Tracking** — 14-day rolling sentiment chart

## Quick Start

### 1. Azure App Registration
1. Go to [portal.azure.com](https://portal.azure.com) → App Registrations → New registration
2. Name: `RestaurantGMEmailManager`
3. Supported accounts: **Any organizational directory + personal Microsoft accounts**
4. Redirect URI (SPA): `http://localhost:5173/auth/callback`
5. Authentication → Allow public client flows = **Yes**
6. API Permissions (Delegated): `Mail.Read`, `Mail.ReadWrite`, `Mail.Send`, `Calendars.ReadWrite`, `User.Read`, `MailboxSettings.Read`
7. Copy the **Client ID**

### 2. Configure Environment

```bash
# In email-manager/ copy the example
cp .env.example backend/.env
```

Edit `backend/.env`:
```
VITE_AZURE_CLIENT_ID=your-client-id
ANTHROPIC_API_KEY=sk-ant-your-key
```

Also create `frontend/.env`:
```
VITE_AZURE_CLIENT_ID=your-client-id
```

### 3. Install Dependencies

```bash
# Backend
cd email-manager/backend
npm install

# Frontend
cd email-manager/frontend
npm install
```

### 4. Start Development Servers

```bash
# Terminal 1 — Backend (port 3001)
cd email-manager/backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd email-manager/frontend
npm run dev
```

Open `http://localhost:5173` and sign in with Microsoft.

## Architecture

```
Frontend (React + Vite + Tailwind)  →  Backend (Express + TypeScript)
       ↓ MSAL OAuth2                         ↓ better-sqlite3
  Microsoft Graph API              ←→   Anthropic Claude API
```

## Directory Structure

```
email-manager/
├── frontend/          React 18 + Vite + TypeScript + Tailwind
├── backend/           Express + TypeScript + SQLite
└── shared/types/      Shared TypeScript types
```
