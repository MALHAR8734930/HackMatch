"""HackMatch AI - Success Prediction Module.

Uses an explainable weighted scoring model to predict team success.
Each component is normalized 0-100 and combined with defined weights.
"""

import re
from .features import get_all_skills
from .team_formation import (
    compute_skill_coverage, compute_role_coverage,
    compute_skill_diversity, compute_team_compatibility,
)

PREDICTION_WEIGHTS = {
    "project_skill_match": 30,
    "skill_diversity": 20,
    "experience": 15,
    "role_coverage": 15,
    "compatibility": 10,
    "hackathon_experience": 10,
}

EXP_SCORE = {"Beginner": 25, "Intermediate": 50, "Advanced": 75, "Expert": 100}


def _hackathon_exp_score(exp: str) -> float:
    if not exp or exp == "None":
        return 0.0
    match = re.search(r"(\d+)", exp)
    if match:
        n = int(match.group(1))
        return min((n / 5) * 100, 100)
    return 50.0


def predict_success(members: list[dict], hackathon: dict) -> dict:
    if not members:
        return {k: 0.0 for k in [
            "success_score", "project_skill_match", "skill_diversity",
            "experience", "role_coverage", "compatibility", "hackathon_experience",
        ]}

    project_skill_match = compute_skill_coverage(members, hackathon.get("required_skills", []))
    skill_diversity = compute_skill_diversity(members)
    avg_experience = sum(EXP_SCORE.get(m.get("experience_level", "Beginner"), 25) for m in members) / len(members)
    role_coverage = compute_role_coverage(members)
    compatibility = compute_team_compatibility(members) * 100
    avg_hackathon_exp = sum(_hackathon_exp_score(m.get("previous_hackathon_experience", "None")) for m in members) / len(members)

    success_score = (
        project_skill_match * PREDICTION_WEIGHTS["project_skill_match"]
        + skill_diversity * PREDICTION_WEIGHTS["skill_diversity"]
        + avg_experience * PREDICTION_WEIGHTS["experience"]
        + role_coverage * PREDICTION_WEIGHTS["role_coverage"]
        + compatibility * PREDICTION_WEIGHTS["compatibility"]
        + avg_hackathon_exp * PREDICTION_WEIGHTS["hackathon_experience"]
    ) / 100

    def r1(v): return round(v * 10) / 10

    return {
        "success_score": r1(success_score),
        "project_skill_match": r1(project_skill_match),
        "skill_diversity": r1(skill_diversity),
        "experience": r1(avg_experience),
        "role_coverage": r1(role_coverage),
        "compatibility": r1(compatibility),
        "hackathon_experience": r1(avg_hackathon_exp),
    }


def get_score_label(score: float) -> dict:
    if score >= 80:
        return {"label": "Excellent", "color": "text-emerald-400"}
    if score >= 65:
        return {"label": "Good", "color": "text-blue-400"}
    if score >= 50:
        return {"label": "Moderate", "color": "text-amber-400"}
    if score >= 35:
        return {"label": "Below Average", "color": "text-orange-400"}
    return {"label": "Needs Improvement", "color": "text-red-400"}
