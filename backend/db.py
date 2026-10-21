"""Supabase REST API client for database access.

Uses the Supabase REST API (PostgREST) via httpx instead of the
supabase-py package, which is not available in this environment.
"""

import os
import httpx

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL", "")
SUPABASE_ANON_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or os.environ.get("SUPABASE_ANON_KEY")
    or os.environ.get("VITE_SUPABASE_ANON_KEY", "")
)

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    # Fall back to .env file
    from pathlib import Path
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.strip().split("=", 1)
                if k in {"SUPABASE_URL", "VITE_SUPABASE_URL"}:
                    SUPABASE_URL = v
                elif k in {"SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"}:
                    SUPABASE_ANON_KEY = v

_headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
}


def _url(table: str) -> str:
    return f"{SUPABASE_URL}/rest/v1/{table}"


async def fetch_all(table: str, order: str | None = None, limit: int | None = None) -> list[dict]:
    params: dict[str, str] = {}
    if order:
        params["order"] = order
    if limit:
        params["limit"] = str(limit)
    async with httpx.AsyncClient() as client:
        resp = await client.get(_url(table), headers=_headers, params=params)
        resp.raise_for_status()
        return resp.json()


async def fetch_one(table: str, order: str | None = None) -> dict | None:
    params: dict[str, str] = {"limit": "1"}
    if order:
        params["order"] = order
    async with httpx.AsyncClient() as client:
        resp = await client.get(_url(table), headers=_headers, params=params)
        resp.raise_for_status()
        data = resp.json()
        return data[0] if data else None


async def insert_rows(table: str, rows: list[dict] | dict) -> list[dict]:
    headers = {**_headers, "Prefer": "return=representation"}
    async with httpx.AsyncClient() as client:
        resp = await client.post(_url(table), headers=headers, json=rows)
        resp.raise_for_status()
        return resp.json()


async def delete_rows(table: str, filter_col: str, filter_val: str) -> None:
    async with httpx.AsyncClient() as client:
        resp = await client.delete(
            _url(table), headers=_headers, params={filter_col: f"eq.{filter_val}"}
        )
        resp.raise_for_status()


async def delete_in(table: str, col: str, values: list[str]) -> None:
    if not values:
        return
    async with httpx.AsyncClient() as client:
        resp = await client.delete(
            _url(table), headers=_headers, params={f"{col}": f"in.({','.join(values)})"}
        )
        resp.raise_for_status()


async def get_participants() -> list[dict]:
    return await fetch_all("participants", order="created_at.desc")


async def get_hackathon() -> dict | None:
    return await fetch_one("hackathons", order="created_at.desc")


async def get_skills() -> list[dict]:
    return await fetch_all("skills", order="category.asc")


async def get_teams_with_details(hackathon_id: str) -> list[dict]:
    teams = await fetch_all("teams", order="team_index.asc")
    teams = [t for t in teams if t.get("hackathon_id") == hackathon_id]
    if not teams:
        return []

    team_ids = [t["id"] for t in teams]
    members_all = await fetch_all("team_members")
    members_all = [m for m in members_all if m.get("team_id") in team_ids]

    scores_all = await fetch_all("team_scores")
    scores_map = {s["team_id"]: s for s in scores_all if s.get("team_id") in team_ids}

    recs_all = await fetch_all("recommendations")
    recs_map: dict[str, list[dict]] = {}
    for r in recs_all:
        if r.get("team_id") in team_ids:
            recs_map.setdefault(r["team_id"], []).append(r)

    participants = await get_participants()
    parts_map = {p["id"]: p for p in participants}

    result = []
    for t in teams:
        team_members = [parts_map[m["participant_id"]] for m in members_all if m["team_id"] == t["id"] and m["participant_id"] in parts_map]
        score = scores_map.get(t["id"], {})
        recs = recs_map.get(t["id"], [])
        result.append({
            **t,
            "members": team_members,
            "score": score,
            "recommendations": recs,
        })
    return result
