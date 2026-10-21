"""HackMatch AI - Feature Extraction & Skill Encoding Module.

Transforms participant data into normalized numerical features (0-1 range)
for use by the team formation and prediction algorithms.
"""

import re
from typing import Any

EXPERIENCE_MAP = {
    "Beginner": 0.25,
    "Intermediate": 0.50,
    "Advanced": 0.75,
    "Expert": 1.0,
}


def parse_hackathon_experience(exp: str) -> float:
    if not exp or exp == "None":
        return 0.0
    match = re.search(r"(\d+)", exp)
    if match:
        n = int(match.group(1))
        return min(n / 5.0, 1.0)
    return 0.5


def get_all_skills(p: dict) -> list[str]:
    skills: list[str] = []
    for key in [
        "technical_skills", "programming_languages", "ai_ml_skills",
        "web_dev_skills", "database_skills", "ui_ux_skills", "soft_skills",
    ]:
        val = p.get(key, [])
        if isinstance(val, list):
            skills.extend(val)
    return skills


def encode_skills(participant: dict, skill_set: list[str]) -> list[int]:
    all_skills = {s.lower() for s in get_all_skills(participant)}
    return [1 if s.lower() in all_skills else 0 for s in skill_set]


def build_skill_vocabulary(participants: list[dict]) -> list[str]:
    skills: set[str] = set()
    for p in participants:
        for s in get_all_skills(p):
            skills.add(s)
    return sorted(skills)


def extract_features(participant: dict, vocabulary: list[str]) -> dict:
    all_skills = get_all_skills(participant)
    skill_vector = encode_skills(participant, vocabulary)
    return {
        "participant_id": participant["id"],
        "experience_score": EXPERIENCE_MAP.get(participant.get("experience_level", "Beginner"), 0.25),
        "hackathon_exp_score": parse_hackathon_experience(participant.get("previous_hackathon_experience", "None")),
        "skill_count": len(all_skills),
        "skill_diversity": 0.0,
        "role_preference": participant.get("preferred_team_role", "Frontend"),
        "skill_vector": skill_vector,
        "technical_depth": 0.0,
    }


def extract_all_features(participants: list[dict]) -> dict[str, dict]:
    vocabulary = build_skill_vocabulary(participants)
    max_skill_count = max((len(get_all_skills(p)) for p in participants), default=1)
    features: dict[str, dict] = {}
    for p in participants:
        f = extract_features(p, vocabulary)
        f["skill_diversity"] = f["skill_count"] / max_skill_count if max_skill_count > 0 else 0
        advanced = len(p.get("ai_ml_skills", [])) + sum(
            1 for s in p.get("technical_skills", [])
            if any(k in s for k in ("Docker", "AWS", "CI/CD", "GraphQL"))
        )
        total = len(get_all_skills(p))
        f["technical_depth"] = advanced / total if total > 0 else 0
        features[p["id"]] = f
    return features


def cosine_similarity(a: list[float], b: list[float]) -> float:
    import numpy as np
    va, vb = np.array(a), np.array(b)
    denom = float(np.sqrt(va @ va) * np.sqrt(vb @ vb))
    return float(va @ vb) / denom if denom != 0 else 0.0


def jaccard_similarity(a: list[str], b: list[str]) -> float:
    sa = {s.lower() for s in a}
    sb = {s.lower() for s in b}
    intersection = sa & sb
    union = sa | sb
    return len(intersection) / len(union) if union else 0.0
