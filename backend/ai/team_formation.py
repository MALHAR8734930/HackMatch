"""HackMatch AI - Team Formation Algorithm.

Uses a greedy optimization approach to form balanced teams.
Maximizes overall compatibility while maintaining balanced team sizes
and ensuring role/skill diversity.
"""

from .features import get_all_skills, jaccard_similarity

ALL_ROLES = [
    "AI/ML", "Backend", "Frontend", "UI/UX",
    "Database", "Research", "Presentation", "Project Management",
]

EXP_ORDER = {"Expert": 4, "Advanced": 3, "Intermediate": 2, "Beginner": 1}

GREEK_LETTERS = [
    "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta",
    "Iota", "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron", "Pi",
]


def generate_team_name(index: int) -> str:
    if index < len(GREEK_LETTERS):
        return f"Team {GREEK_LETTERS[index]}"
    return f"Team {index + 1}"


def compute_compatibility(p1: dict, p2: dict) -> float:
    skills1 = get_all_skills(p1)
    skills2 = get_all_skills(p2)
    skill_overlap = jaccard_similarity(skills1, skills2)
    interest_overlap = jaccard_similarity(
        p1.get("areas_of_interest", []), p2.get("areas_of_interest", [])
    )
    e1 = EXP_ORDER.get(p1.get("experience_level", "Beginner"), 1)
    e2 = EXP_ORDER.get(p2.get("experience_level", "Beginner"), 1)
    exp_compat = 1.0 - abs(e1 - e2) / 3.0
    role_diversity = 0.3 if p1.get("preferred_team_role") == p2.get("preferred_team_role") else 1.0
    return 0.35 * skill_overlap + 0.25 * interest_overlap + 0.20 * exp_compat + 0.20 * role_diversity


def compute_team_compatibility(members: list[dict]) -> float:
    if len(members) < 2:
        return 0.0
    total = 0.0
    count = 0
    for i in range(len(members)):
        for j in range(i + 1, len(members)):
            total += compute_compatibility(members[i], members[j])
            count += 1
    return total / count if count > 0 else 0.0


def compute_skill_coverage(members: list[dict], required_skills: list[str]) -> float:
    if not required_skills:
        return 100.0
    team_skills: set[str] = set()
    for m in members:
        for s in get_all_skills(m):
            team_skills.add(s.lower())
    covered = sum(1 for s in required_skills if s.lower() in team_skills)
    return (covered / len(required_skills)) * 100


def compute_role_coverage(members: list[dict]) -> float:
    roles = {m.get("preferred_team_role") for m in members}
    return (len(roles) / len(ALL_ROLES)) * 100


def compute_skill_diversity(members: list[dict]) -> float:
    all_skills: set[str] = set()
    for m in members:
        for s in get_all_skills(m):
            all_skills.add(s)
    max_possible = len(members) * 15
    return min((len(all_skills) / max_possible) * 100, 100) if max_possible > 0 else 0


def form_teams(participants: list[dict], hackathon: dict) -> list[list[dict]]:
    team_size = hackathon.get("team_size", 4)
    num_teams = hackathon.get("num_teams") or max(1, len(participants) // team_size)
    required_skills = hackathon.get("required_skills", [])

    sorted_parts = sorted(
        participants,
        key=lambda p: EXP_ORDER.get(p.get("experience_level", "Beginner"), 0),
        reverse=True,
    )

    teams: list[list[dict]] = [[] for _ in range(num_teams)]

    # Phase 1: Anchor each team with the most experienced participants
    for i in range(min(num_teams, len(sorted_parts))):
        teams[i].append(sorted_parts[i])

    assigned = {p["id"] for team in teams for p in team}
    remaining = [p for p in sorted_parts if p["id"] not in assigned]

    while remaining:
        best_participant = None
        best_team_idx = -1
        best_score = float("-inf")

        for participant in remaining:
            for t in range(len(teams)):
                if len(teams[t]) >= team_size:
                    continue
                team = teams[t]
                compat = (
                    sum(compute_compatibility(participant, m) for m in team) / len(team)
                    if team else 0.5
                )
                coverage_before = compute_skill_coverage(team, required_skills)
                coverage_after = compute_skill_coverage(team + [participant], required_skills)
                coverage_gain = (coverage_after - coverage_before) / 100
                same_role_count = sum(1 for m in team if m.get("preferred_team_role") == participant.get("preferred_team_role"))
                role_penalty = same_role_count * 0.15
                team_avg_exp = (
                    sum(EXP_ORDER.get(m.get("experience_level", "Beginner"), 0) for m in team) / len(team)
                    if team else 0
                )
                participant_exp = EXP_ORDER.get(participant.get("experience_level", "Beginner"), 0)
                exp_balance = 1 - abs(team_avg_exp - participant_exp) / 4
                score = 0.35 * compat + 0.30 * coverage_gain + 0.20 * exp_balance - role_penalty + 0.15 * (1 - len(teams[t]) / team_size)
                if score > best_score:
                    best_score = score
                    best_participant = participant
                    best_team_idx = t

        if best_participant and best_team_idx >= 0:
            teams[best_team_idx].append(best_participant)
            assigned.add(best_participant["id"])
            remaining.remove(best_participant)
        else:
            break

    return teams
