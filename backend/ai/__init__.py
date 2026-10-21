"""HackMatch AI - Main AI Engine Orchestrator.

Coordinates the full prediction pipeline:
Participant Data -> Feature Extraction -> Skill Encoding -> Team Formation
-> Feature Calculation -> Success Prediction -> Recommendation
"""

from .features import extract_all_features, build_skill_vocabulary, get_all_skills, jaccard_similarity, cosine_similarity
from .team_formation import (
    form_teams, generate_team_name, compute_skill_coverage,
    compute_compatibility, compute_team_compatibility,
    compute_role_coverage, compute_skill_diversity,
)
from .prediction import predict_success, get_score_label, PREDICTION_WEIGHTS
from .recommendations import generate_recommendations


def generate_all_teams(participants: list[dict], hackathon: dict) -> list[dict]:
    # Step 1: Feature Extraction & Skill Encoding
    vocabulary = build_skill_vocabulary(participants)
    extract_all_features(participants)

    # Step 2: Team Formation (greedy optimization)
    team_arrays = form_teams(participants, hackathon)

    # Step 3-5: Score, recommend, compute coverage
    teams: list[dict] = []
    for index, members in enumerate(team_arrays):
        if not members:
            continue
        name = generate_team_name(index)
        score = predict_success(members, hackathon)
        recommendations = generate_recommendations(name, members, hackathon)
        skill_coverage = compute_skill_coverage(members, hackathon.get("required_skills", []))

        teams.append({
            "name": name,
            "index": index,
            "members": members,
            "score": score,
            "recommendations": recommendations,
            "skill_coverage": skill_coverage,
            "project_match": score["project_skill_match"],
        })

    return teams
