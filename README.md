# StudyQuest AI 🏡🌱

> *"The app that understands HOW you study, not just what you answer."*

StudyQuest AI is an interactive, gamified study platform designed to solve student struggle cycles by analyzing **how** they study instead of just focusing on correctness. The platform captures hidden learning patterns (avoidance, passive learning, knowledge gaps, and motivation drops) using real-time session telemetry and wraps coaching interventions in a cozy RPG village simulation reminiscent of *Stardew Valley*, *Animal Crossing*, and *Notion*.

---

## 🗺️ Project Architecture & Tech Stack

StudyQuest AI is structured as a monorepo containing:
* **Frontend (`/frontend`)**: Next.js (App Router), TypeScript, Tailwind CSS, Zustand, Recharts, and Framer Motion.
* **Backend (`/backend`)**: Express, TypeScript, Prisma ORM, and Tesseract.js.
* **Database**: PostgreSQL storing sessions telemetry, village placements, notes, and user stats.

### Core Features Map
1. **AI Behavioral Analyzer**: Detects Avoidance, Passive Learning, Knowledge Gaps, and Motivation Drops using tab-switching track counters and idle loops.
2. **Magical Village Grid Placer**: An interactive 6x6 placement grid where students build their study forests using coins earned from sessions.
3. **Daily Reflection Journal**: Diary log summarizing active hours and struggles, with wiggling emoji indicators.
4. **Notebook OCR Reader**: Drag-and-drop notebook scanner utilizing Tesseract.js to automatically transcribe handwritten notes into active folders.
5. **SM-2 Spaced Repetition Decks**: Cards scheduler using the SuperMemo SM-2 algorithm to plan active recall tests.

---

## 🛠️ Step-by-Step Installation & Run Guide

### Option 1: Docker Compose (Recommended)

Ensure you have [Docker](https://www.docker.com/) and Docker Compose installed.

1. Clone or navigate to the workspace directory.
2. Run the compose containers:
   ```bash
   docker-compose up --build
   ```
3. Once built, access the services:
   * **Frontend Application**: `http://localhost:3000`
   * **Backend REST API**: `http://localhost:5000`

---

### Option 2: Manual Local Running

Ensure you have **Node.js v18+** and a running **PostgreSQL** database.

#### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
   *Edit the `DATABASE_URL` inside `.env` to match your local database credentials.*
4. Initialize the database schema and apply seed data (essential for loading village assets and achievements):
   ```bash
   npx prisma db push
   # or npx prisma migrate dev
   npx prisma db seed
   ```
5. Run the server in development mode:
   ```bash
   npm run dev
   ```

#### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` in your web browser.

---

## 💡 AI Fallback Heuristics Model

If the `OPENAI_API_KEY` is not provided inside the backend configuration, the app uses a mathematically-anchored heuristic engine to analyze study behaviors:
* **Avoidance score** scales with note/video interaction count when problem-solving attempts are zero.
* **Passive Learning score** flags repeated reading and watching loops relative to active recalls.
* **Knowledge Gaps** measure correctness ratios across quiz attempts.
* **Motivation Drops** penalize tab-switching and idle thresholds.

Once calculated, a random companion (e.g. *Dewy the Forest Spirit* or *Bramble the Hedgehog*) is selected to speak cozy, personalized advice.

---

## 🚀 Live Cloud Deployment Guide

Since StudyQuest AI is a full-stack monorepo (Next.js + Express + PostgreSQL), it can be deployed for free using a combination of **Vercel** (frontend), **Render** (backend), and **Neon** (database). 

Here is the step-by-step procedure:

### 1. Database Setup (Neon PostgreSQL)
1. Sign up for a free account at [Neon.tech](https://neon.tech/).
2. Create a new project and select the latest **PostgreSQL** version.
3. Copy the **Connection String** (URI) from the dashboard. It will look like this:
   `postgresql://[user]:[password]@[hostname]/neondb?sslmode=require`

### 2. Run Database Migrations & Seed Data
You must initialize the tables and seed the initial assets (village items, companion data, etc.) in your live database before launching the backend:
1. In your local development machine, open `backend/.env`.
2. Temporarily set the `DATABASE_URL` to your live **Neon connection string**.
3. Run the following commands inside the `backend` folder to push the schema and load seed data:
   ```bash
   cd backend
   npx prisma db push
   npx prisma db seed
   ```
4. Restore your local `DATABASE_URL` in `backend/.env` if you want to continue local development.

### 3. Backend Deployment (Render)
1. Sign up/Log in to [Render.com](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository (`SHREYOTHECODINGEXPERTO/StudyQuest-AI`).
4. Configure the service settings:
   * **Name**: `studyquest-backend`
   * **Runtime**: `Node`
   * **Root Directory**: `backend`
   * **Build Command**: `npm install && npx prisma generate && npm run build`
   * **Start Command**: `npm start`
5. In the **Environment Variables** section, add:
   * `DATABASE_URL` = *[Your Neon Connection String]*
   * `JWT_SECRET` = *[A secure, random secret string]*
   * `PORT` = `5000` (Render will override this, but Express will bind to whatever port is assigned)
   * `OPENAI_API_KEY` = *[Optional: Your OpenAI key]*
6. Click **Deploy Web Service** and copy the resulting service URL (e.g., `https://studyquest-backend.onrender.com`).

### 4. Frontend Deployment (Vercel)
1. Sign up/Log in to [Vercel.com](https://vercel.com/).
2. Click **Add New** > **Project** and import your GitHub repository.
3. Configure the project settings:
   * **Framework Preset**: `Next.js`
   * **Root Directory**: `frontend`
4. Under **Environment Variables**, add:
   * `NEXT_PUBLIC_API_URL` = `https://[your-render-backend-url]/api` (e.g., `https://studyquest-backend.onrender.com/api`)
5. Click **Deploy**. Vercel will automatically build the Next.js app and host it on a public domain.

