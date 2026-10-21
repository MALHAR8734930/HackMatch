"""HackMatch AI - FastAPI Application.

A complete Python web application that serves the AI-powered hackathon team
formation and success prediction system with server-side rendered pages.
"""

import csv
import io
import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Form, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from .ai import generate_all_teams, get_score_label, PREDICTION_WEIGHTS, get_all_skills, compute_skill_coverage
from .db import (
    get_participants, get_hackathon, get_skills, get_teams_with_details,
    insert_rows, delete_in, fetch_all, delete_rows,
)
from .ai.data_analysis import analyze_participants
from .ai.copilot import ask_copilot

BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"

load_dotenv(BASE_DIR.parent / ".env")

templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

SKILL_CATEGORIES = {
    "programming": ["Python", "Java", "C++", "JavaScript", "TypeScript", "Go", "Rust", "C#", "Ruby", "PHP"],
    "ai_ml": ["TensorFlow", "PyTorch", "Scikit-learn", "Keras", "Deep Learning", "NLP", "Computer Vision", "LLMs", "Reinforcement Learning", "Data Preprocessing"],
    "web_dev": ["React", "Next.js", "Node.js", "Express", "HTML/CSS", "Tailwind CSS", "Vue.js", "Angular", "Flask", "FastAPI"],
    "database": ["PostgreSQL", "MongoDB", "MySQL", "Redis", "Firebase", "Supabase", "GraphQL", "DynamoDB"],
    "ui_ux": ["Figma", "Design Systems", "Prototyping", "Wireframing", "User Research", "Adobe XD"],
    "soft": ["Leadership", "Communication", "Teamwork", "Problem Solving", "Time Management", "Presentation"],
    "technical": ["Docker", "AWS", "CI/CD", "Git", "Linux", "REST APIs", "Microservices", "System Design"],
}

EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"]
TEAM_ROLES = ["AI/ML", "Backend", "Frontend", "UI/UX", "Database", "Research", "Presentation", "Project Management"]
DOMAINS = ["Healthcare", "FinTech", "Cybersecurity", "EdTech", "Sustainability", "Agriculture", "Smart Cities", "Generative AI"]
ALL_SKILLS = {s for skills in SKILL_CATEGORIES.values() for s in skills}


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="HackMatch AI", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:5173")],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/health")
async def health_check():
    return {"status": "ok"}


def _base_context(request: Request) -> dict:
    return {"request": request, "current_path": request.url.path}


class AnalysisRequest(BaseModel):
    question: str


class CopilotRequest(BaseModel):
    question: str
    context: dict | None = None


def _csv_response(filename: str, headers: list[str], rows: list[list[object]]) -> StreamingResponse:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerows(rows)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@app.post("/api/ai/analyze")
async def analyze_participant_data(payload: AnalysisRequest):
    """Answer a natural-language question about the registered participants."""
    participants = await get_participants()
    try:
        answer = analyze_participants(participants, payload.question)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"answer": answer}


@app.post("/api/ai/copilot")
async def copilot_answer(payload: CopilotRequest):
    """Answer an organizer question with an OpenAI-compatible Copilot model."""
    try:
        answer = ask_copilot(payload.question, payload.context)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"answer": answer}


@app.get("/api/tableau/participants.csv")
async def tableau_participants_export():
    """Return a flat participant dataset that Tableau can ingest directly."""
    participants = await get_participants()
    headers = [
        "id", "full_name", "email", "college", "department", "year",
        "experience_level", "preferred_team_role", "technical_skills",
        "programming_languages", "ai_ml_skills", "web_dev_skills",
        "database_skills", "ui_ux_skills", "soft_skills", "areas_of_interest",
    ]
    rows = [[
        participant.get("id", ""), participant.get("full_name", ""),
        participant.get("email", ""), participant.get("college", ""),
        participant.get("department", ""), participant.get("year", ""),
        participant.get("experience_level", ""), participant.get("preferred_team_role", ""),
        *[", ".join(participant.get(key, [])) for key in headers[8:]],
    ] for participant in participants]
    return _csv_response("hackmatch-tableau-participants.csv", headers, rows)


@app.get("/api/tableau/teams.csv")
async def tableau_teams_export():
    """Return one row per team member with score fields for Tableau analysis."""
    hackathon = await get_hackathon()
    teams = await get_teams_with_details(hackathon["id"]) if hackathon else []
    headers = [
        "team_id", "team_name", "member_id", "member_name", "member_role",
        "experience_level", "success_score", "project_skill_match",
        "skill_diversity", "experience", "role_coverage", "compatibility",
        "hackathon_experience",
    ]
    rows = []
    for team in teams:
        score = team.get("score", {})
        for member in team.get("members", []):
            rows.append([
                team.get("id", ""), team.get("name", ""), member.get("id", ""),
                member.get("full_name", ""), member.get("preferred_team_role", ""),
                member.get("experience_level", ""), score.get("success_score", 0),
                score.get("project_skill_match", 0), score.get("skill_diversity", 0),
                score.get("experience", 0), score.get("role_coverage", 0),
                score.get("compatibility", 0), score.get("hackathon_experience", 0),
            ])
    return _csv_response("hackmatch-tableau-teams.csv", headers, rows)


@app.get("/api/tableau/summary")
async def tableau_summary():
    """Return a compact summary for Tableau dashboards and lightweight clients."""
    participants = await get_participants()
    hackathon = await get_hackathon()
    teams = await get_teams_with_details(hackathon["id"]) if hackathon else []
    scores = [float(team.get("score", {}).get("success_score", 0) or 0) for team in teams]
    return {
        "participant_count": len(participants),
        "team_count": len(teams),
        "average_success_score": round(sum(scores) / len(scores), 2) if scores else 0,
        "top_team": max(teams, key=lambda team: float(team.get("score", {}).get("success_score", 0) or 0), default={}).get("name"),
        "hackathon": hackathon.get("name") if hackathon else None,
    }


# ============ LANDING PAGE ============

@app.get("/", response_class=HTMLResponse)
async def landing_page(request: Request):
    ctx = _base_context(request)
    return templates.TemplateResponse(request, "landing.html", ctx)


# ============ AUTH ============

@app.get("/auth", response_class=HTMLResponse)
async def auth_page(request: Request):
    ctx = _base_context(request)
    return templates.TemplateResponse(request, "auth.html", ctx)


# ============ PARTICIPANT REGISTRATION ============

@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    ctx = _base_context(request)
    ctx["skill_categories"] = SKILL_CATEGORIES
    ctx["experience_levels"] = EXPERIENCE_LEVELS
    ctx["team_roles"] = TEAM_ROLES
    return templates.TemplateResponse(request, "register.html", ctx)


@app.post("/register")
async def register_submit(
    request: Request,
    full_name: str = Form(...),
    email: str = Form(...),
    college: str = Form(""),
    department: str = Form(""),
    year: str = Form(""),
    experience_level: str = Form("Beginner"),
    preferred_team_role: str = Form("Frontend"),
    previous_hackathon_experience: str = Form("None"),
    technical_skills: str = Form(""),
    programming_languages: str = Form(""),
    ai_ml_skills: str = Form(""),
    web_dev_skills: str = Form(""),
    database_skills: str = Form(""),
    ui_ux_skills: str = Form(""),
    soft_skills: str = Form(""),
    areas_of_interest: str = Form(""),
    project_interests: str = Form(""),
):
    def parse(s: str) -> list[str]:
        return [x.strip() for x in s.split(",") if x.strip()] if s else []

    participant = {
        "full_name": full_name,
        "email": email,
        "college": college,
        "department": department,
        "year": year,
        "experience_level": experience_level,
        "preferred_team_role": preferred_team_role,
        "previous_hackathon_experience": previous_hackathon_experience,
        "technical_skills": parse(technical_skills),
        "programming_languages": parse(programming_languages),
        "ai_ml_skills": parse(ai_ml_skills),
        "web_dev_skills": parse(web_dev_skills),
        "database_skills": parse(database_skills),
        "ui_ux_skills": parse(ui_ux_skills),
        "soft_skills": parse(soft_skills),
        "areas_of_interest": parse(areas_of_interest),
        "project_interests": parse(project_interests),
        "is_demo": False,
    }
    try:
        await insert_rows("participants", participant)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    return RedirectResponse(url="/participants", status_code=303)


# ============ HACKATHON SETUP ============

@app.get("/hackathon", response_class=HTMLResponse)
async def hackathon_page(request: Request):
    ctx = _base_context(request)
    ctx["domains"] = DOMAINS
    ctx["experience_levels"] = EXPERIENCE_LEVELS
    ctx["skill_categories"] = SKILL_CATEGORIES
    hackathon = await get_hackathon()
    ctx["hackathon"] = hackathon
    return templates.TemplateResponse(request, "hackathon.html", ctx)


@app.post("/hackathon")
async def hackathon_submit(
    request: Request,
    name: str = Form(...),
    num_participants: int = Form(30),
    team_size: int = Form(4),
    project_domain: str = Form("Healthcare"),
    difficulty_level: str = Form("Intermediate"),
    num_teams: int = Form(5),
    required_skills: str = Form(""),
    optional_skills: str = Form(""),
):
    def parse(s: str) -> list[str]:
        return [x.strip() for x in s.split(",") if x.strip()] if s else []

    hackathon = {
        "name": name,
        "num_participants": num_participants,
        "team_size": team_size,
        "project_domain": project_domain,
        "difficulty_level": difficulty_level,
        "num_teams": num_teams,
        "required_skills": parse(required_skills),
        "optional_skills": parse(optional_skills),
    }
    try:
        await insert_rows("hackathons", hackathon)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    return RedirectResponse(url="/teams", status_code=303)


# ============ TEAM FORMATION ============

@app.get("/teams", response_class=HTMLResponse)
async def teams_page(request: Request):
    ctx = _base_context(request)
    participants = await get_participants()
    hackathon = await get_hackathon()
    teams = await get_teams_with_details(hackathon["id"]) if hackathon else []
    ctx["participants"] = participants
    ctx["hackathon"] = hackathon
    ctx["teams"] = teams
    ctx["get_score_label"] = get_score_label
    return templates.TemplateResponse(request, "teams.html", ctx)


@app.post("/teams/generate")
async def generate_teams(request: Request):
    participants = await get_participants()
    hackathon = await get_hackathon()
    if not hackathon:
        return RedirectResponse(url="/hackathon", status_code=303)
    if not participants:
        return RedirectResponse(url="/register", status_code=303)

    generated = generate_all_teams(participants, hackathon)

    # Clear old teams
    old_teams = await fetch_all("teams")
    old_team_ids = [t["id"] for t in old_teams if t.get("hackathon_id") == hackathon["id"]]
    if old_team_ids:
        await delete_in("team_members", "team_id", old_team_ids)
        await delete_in("team_scores", "team_id", old_team_ids)
        await delete_in("recommendations", "team_id", old_team_ids)
        await delete_in("teams", "id", old_team_ids)

    for team in generated:
        team_row = await insert_rows("teams", {
            "hackathon_id": hackathon["id"],
            "name": team["name"],
            "team_index": team["index"],
            "locked": False,
        })
        team_id = team_row[0]["id"]

        await insert_rows("team_members", [
            {"team_id": team_id, "participant_id": m["id"], "role": m.get("preferred_team_role")}
            for m in team["members"]
        ])
        await insert_rows("team_scores", {
            "team_id": team_id,
            "success_score": team["score"]["success_score"],
            "project_skill_match": team["score"]["project_skill_match"],
            "skill_diversity": team["score"]["skill_diversity"],
            "experience": team["score"]["experience"],
            "role_coverage": team["score"]["role_coverage"],
            "compatibility": team["score"]["compatibility"],
            "hackathon_experience": team["score"]["hackathon_experience"],
        })
        recs = (
            [{"team_id": team_id, "type": "strength", "content": c} for c in team["recommendations"]["strengths"]]
            + [{"team_id": team_id, "type": "weakness", "content": c} for c in team["recommendations"]["weaknesses"]]
            + [{"team_id": team_id, "type": "improvement", "content": c} for c in team["recommendations"]["improvements"]]
        )
        if recs:
            await insert_rows("recommendations", recs)

    return RedirectResponse(url="/teams", status_code=303)


@app.post("/teams/{team_id}/lock")
async def lock_team(team_id: str):
    teams = await fetch_all("teams")
    team = next((t for t in teams if t["id"] == team_id), None)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    # Toggle lock via REST API would need PATCH - use insert workaround
    # For simplicity, we'll redirect back
    return RedirectResponse(url="/teams", status_code=303)


# ============ TEAM DETAILS ============

@app.get("/teams/{team_id}", response_class=HTMLResponse)
async def team_details(request: Request, team_id: str):
    ctx = _base_context(request)
    teams = await get_teams_with_details((await get_hackathon())["id"]) if await get_hackathon() else []
    team = next((t for t in teams if t["id"] == team_id), None)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    ctx["team"] = team
    ctx["get_score_label"] = get_score_label
    ctx["weights"] = PREDICTION_WEIGHTS
    return templates.TemplateResponse(request, "team_details.html", ctx)


# ============ DASHBOARD ============

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    ctx = _base_context(request)
    participants = await get_participants()
    hackathon = await get_hackathon()
    teams = await get_teams_with_details(hackathon["id"]) if hackathon else []

    # Compute stats
    total_participants = len(participants)
    total_teams = len(teams)
    scores = [t.get("score", {}).get("success_score", 0) for t in teams if t.get("score")]
    avg_score = sum(scores) / len(scores) if scores else 0
    max_team_score = max(scores) if scores else 0
    highest_team = max(teams, key=lambda t: t.get("score", {}).get("success_score", 0)) if teams else None

    # Skill distribution
    skill_counts: dict[str, int] = {}
    for p in participants:
        for s in get_all_skills(p):
            skill_counts[s] = skill_counts.get(s, 0) + 1
    top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    # Experience distribution
    exp_counts = {level: 0 for level in EXPERIENCE_LEVELS}
    for p in participants:
        level = p.get("experience_level", "Beginner")
        exp_counts[level] = exp_counts.get(level, 0) + 1
    max_exp_count = max(exp_counts.values()) if exp_counts else 1

    # Role distribution
    role_counts = {role: 0 for role in TEAM_ROLES}
    for p in participants:
        role = p.get("preferred_team_role", "Frontend")
        role_counts[role] = role_counts.get(role, 0) + 1
    max_role_count = max(role_counts.values()) if role_counts else 1

    # Skill max
    max_skill_count = top_skills[0][1] if top_skills else 1

    ctx.update({
        "total_participants": total_participants,
        "total_teams": total_teams,
        "avg_score": round(avg_score, 1),
        "max_team_score": max_team_score,
        "highest_team": highest_team,
        "top_skills": top_skills,
        "max_skill_count": max_skill_count,
        "exp_counts": exp_counts,
        "max_exp_count": max_exp_count,
        "role_counts": role_counts,
        "max_role_count": max_role_count,
        "teams": teams,
        "hackathon": hackathon,
    })
    return templates.TemplateResponse(request, "dashboard.html", ctx)


# ============ PARTICIPANTS LIST ============

@app.get("/participants", response_class=HTMLResponse)
async def participants_list(request: Request):
    ctx = _base_context(request)
    participants = await get_participants()
    ctx["participants"] = participants
    return templates.TemplateResponse(request, "participants.html", ctx)


# ============ METHODOLOGY ============

@app.get("/methodology", response_class=HTMLResponse)
async def methodology(request: Request):
    ctx = _base_context(request)
    ctx["weights"] = PREDICTION_WEIGHTS
    return templates.TemplateResponse(request, "methodology.html", ctx)


# ============ ABOUT ============

@app.get("/about", response_class=HTMLResponse)
async def about(request: Request):
    ctx = _base_context(request)
    return templates.TemplateResponse(request, "about.html", ctx)


# ============ EXPORT ============

@app.get("/export/participants")
async def export_participants():
    participants = await get_participants()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Email", "College", "Department", "Year", "Experience", "Role", "Skills", "Interests"])
    for p in participants:
        writer.writerow([
            p.get("full_name", ""), p.get("email", ""), p.get("college", ""),
            p.get("department", ""), p.get("year", ""), p.get("experience_level", ""),
            p.get("preferred_team_role", ""),
            ", ".join(get_all_skills(p)),
            ", ".join(p.get("areas_of_interest", [])),
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hackmatch-participants.csv"},
    )


@app.get("/export/teams")
async def export_teams():
    hackathon = await get_hackathon()
    teams = await get_teams_with_details(hackathon["id"]) if hackathon else []
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Team Name", "Member Name", "Email", "Role", "Experience", "Success Score", "Project Match", "Skill Diversity", "Role Coverage", "Compatibility"])
    for team in teams:
        score = team.get("score", {})
        for m in team.get("members", []):
            writer.writerow([
                team.get("name", ""), m.get("full_name", ""), m.get("email", ""),
                m.get("preferred_team_role", ""), m.get("experience_level", ""),
                score.get("success_score", 0), score.get("project_skill_match", 0),
                score.get("skill_diversity", 0), score.get("role_coverage", 0),
                score.get("compatibility", 0),
            ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hackmatch-teams.csv"},
    )


@app.get("/export/scores")
async def export_scores():
    hackathon = await get_hackathon()
    teams = await get_teams_with_details(hackathon["id"]) if hackathon else []
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Team Name", "Success Score", "Project-Skill Match", "Skill Diversity", "Experience", "Role Coverage", "Compatibility", "Hackathon Experience"])
    for team in teams:
        s = team.get("score", {})
        writer.writerow([
            team.get("name", ""), s.get("success_score", 0),
            s.get("project_skill_match", 0), s.get("skill_diversity", 0),
            s.get("experience", 0), s.get("role_coverage", 0),
            s.get("compatibility", 0), s.get("hackathon_experience", 0),
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hackmatch-scores.csv"},
    )
