# HackMatch AI

An AI-powered hackathon team formation and success prediction system that creates balanced teams based on skills, interests, experience, and project requirements.

## Project Architecture

HackMatch AI is a full-stack web application with the following architecture:

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  ┌───────────┐ ┌───────────┐ ┌───────────────────┐  │
│  │  Landing   │ │   Auth    │ │  Dashboard (Admin)│  │
│  │   Page     │ │   Pages   │ │  + Charts (Recharts)│ │
│  └───────────┘ └───────────┘ └───────────────────┘  │
│  ┌─────────────────────────────────────────────────┐ │
│  │              AI/ML Module (src/lib/ai/)          │ │
│  │  Features → Team Formation → Prediction → Recs   │ │
│  └─────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              Supabase (PostgreSQL + Auth)             │
│  ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐  │
│  │profiles│ │participants│ │hackathons│ │teams/scores │  │
│  └────────┘ └──────────┘ └────────┘ └──────────────┘  │
│  ┌─────────────────────────────────────────────────┐ │
│  │     Row Level Security (RLS) on all tables      │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### AI/ML Pipeline

The prediction pipeline follows these steps:

1. **Participant Data** — Raw input from registration forms
2. **Feature Extraction** — Transforms data into normalized numerical features (0-1)
3. **Skill Encoding** — Binary encoding against a vocabulary built from all participants
4. **Team Formation** — Greedy optimization algorithm maximizes compatibility, diversity, and coverage
5. **Feature Calculation** — Team-level features computed (skill coverage, diversity, role coverage)
6. **Success Prediction** — Explainable weighted model combines 6 sub-scores into a 0-100 prediction
7. **Recommendation** — Rule-based engine generates strengths, weaknesses, and improvements

### Prediction Weights

| Component              | Weight |
|------------------------|--------|
| Project-Skill Match    | 30%    |
| Skill Diversity        | 20%    |
| Experience             | 15%    |
| Role Coverage          | 15%    |
| Team Compatibility     | 10%    |
| Hackathon Experience   | 10%    |

### Key Modules

- `src/lib/ai/features.ts` — Feature extraction and skill encoding
- `src/lib/ai/teamFormation.ts` — Greedy optimization team formation algorithm
- `src/lib/ai/prediction.ts` — Explainable weighted success prediction model
- `src/lib/ai/recommendations.ts` — Rule-based recommendation engine
- `src/lib/ai/index.ts` — Main orchestrator coordinating the full pipeline

## Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

The following environment variables are pre-configured in `.env`:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These are automatically provisioned and do not need to be set manually.

## Database Setup

The database schema is created via Supabase migrations. The following tables are created:

- `profiles` — Extends Supabase auth.users with role (admin/participant)
- `participants` — Detailed participant profiles with skill arrays
- `skills` — Master catalog of skills organized by category
- `hackathons` — Hackathon event configurations
- `teams` — Generated teams for a hackathon
- `team_members` — Membership linking participants to teams
- `team_scores` — Scoring breakdown per team (success prediction)
- `recommendations` — AI-generated strengths/weaknesses/improvements

Row Level Security (RLS) is enabled on all tables. The app uses `TO anon, authenticated` policies since it supports both demo mode (no login) and authenticated access.

### Demo Data

The database is seeded with:
- 30 fictional participants with diverse skills, interests, experience levels, and roles
- A skills catalog with 40+ skills across 7 categories

## Running the Frontend

```bash
npm run dev
```

The app runs on Vite's dev server. No separate backend server is needed — the AI/ML logic runs client-side in the browser, and data persists to Supabase.

## PandasAI Participant Analysis

The optional FastAPI backend exposes `POST /api/ai/analyze` for natural-language questions about registered participants. Set `OPENAI_API_KEY` before using this endpoint, then run:

```bash
# From the project root, with the Python environment activated
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

Example request body:

```json
{"question": "Which skills are most common among participants?"}
```

## Copilot AI

The dashboard's AI Studio also exposes a Copilot-style assistant through
`POST /api/ai/copilot`. It accepts the question plus a small dashboard context
and uses an OpenAI-compatible chat model. Set either `OPENAI_API_KEY` (and
optionally `OPENAI_BASE_URL` and `OPENAI_MODEL`) or `GITHUB_TOKEN` to use GitHub
Models:

```bash
set OPENAI_API_KEY=your_key
set OPENAI_MODEL=gpt-4o-mini
```

The endpoint returns a JSON object with an `answer` field. If no provider key is
configured, the dashboard shows a clear configuration error instead of failing
silently.

## Tableau Analytics

The dashboard provides Tableau-ready CSV exports:

- `GET http://localhost:8000/api/tableau/participants.csv`
- `GET http://localhost:8000/api/tableau/teams.csv`
- `GET http://localhost:8000/api/tableau/summary`

Open either URL in Tableau as a text/CSV data source. The participant export is
one row per participant; the team export is one row per team member and
includes the prediction score fields. Set `VITE_BACKEND_URL` when the backend
runs somewhere other than `http://localhost:8000`.

The summary endpoint is a compact JSON feed for Tableau or other lightweight
dashboard clients. The dashboard's AI Studio links to all three exports.

## AI/ML Methodology

### Feature Engineering

Raw participant data is transformed into normalized numerical features:
- **Experience Score**: Beginner=0.25, Intermediate=0.50, Advanced=0.75, Expert=1.0
- **Hackathon Experience Score**: Normalized 0-1 (5+ hackathons = 1.0)
- **Skill Diversity**: Total unique skills / max skills across all participants
- **Technical Depth**: Ratio of advanced skills to total skills

### Skill Encoding

Skills are encoded using binary encoding against a vocabulary built from all participants. Similarity between participants uses Jaccard similarity for set-based features and cosine similarity for vector-based features.

### Team Formation Algorithm

A greedy optimization approach:
1. **Phase 1 - Anchoring**: Most experienced participants distributed across teams
2. **Phase 2 - Greedy Assignment**: Each remaining participant assigned to the team where they add the most marginal value

Compatibility between participants combines:
- Skill Complementarity (35%)
- Shared Interests (25%)
- Experience Compatibility (20%)
- Role Diversity (20%)

The algorithm penalizes teams with too many participants sharing the same primary skill.

### Success Prediction

An explainable weighted scoring model combines 6 normalized sub-scores (0-100) into a final 0-100 prediction. Each sub-score is computed independently and the weights sum to 100%.

**Note**: This is a prediction score, not a guaranteed probability of winning.

### Recommendation Engine

A rule-based engine analyzes each team and generates:
- **Strengths**: Areas where the team excels
- **Weaknesses**: Gaps in skills, roles, or experience
- **Improvements**: Actionable suggestions for team composition

### Future ML Integration

The architecture is designed so a trained regression model can replace the scoring function without changing the rest of the pipeline. The feature extraction and team formation modules remain unchanged — only the prediction function would be swapped.

## Deployment

The application can be deployed to any static hosting provider:

```bash
npm run build
# Deploy the dist/ directory
```

### Vercel + Render

Deployment manifests are included in `vercel.json` and `render.yaml`. Import
the `project` directory into Vercel for the React frontend and into Render as a
Blueprint for the FastAPI service. After the two services are created, set the
frontend's `VITE_BACKEND_URL` to the Render API URL and set the backend's
`FRONTEND_URL` to the Vercel URL. Add the Supabase and AI provider variables in
the provider dashboards; do not commit secrets to the repository.

Supabase handles the database, authentication, and storage in the cloud.

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui + Lucide icons
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (email/password)
- **Charts**: Recharts
- **AI/ML**: Custom client-side modules (feature engineering, optimization, prediction)

## Pages

1. **Landing Page** — Futuristic AI-themed landing with feature overview
2. **Authentication** — Sign in/sign up with role selection (organizer/participant)
3. **Participant Registration** — Form with skill chips/tags, experience levels, role selection
4. **Hackathon Setup** — Admin form for hackathon configuration
5. **AI Team Formation** — Generate balanced teams with prediction scores and recommendations
6. **Dashboard** — Admin overview with interactive charts (skills, scores, experience, roles)
7. **Team Details** — Per-team page with members, scores, recommendations, and visualizations
8. **AI Methodology** — Technical explanation of the AI/ML pipeline with architecture diagram
9. **About Project** — Problem statement, objectives, methodology, future scope, limitations

## Export

The admin can export the following as CSV:
- Participant list (with all skills and details)
- Generated teams (with members and roles)
- Team scores (with full prediction breakdown)
- Prediction results (from team details page)
