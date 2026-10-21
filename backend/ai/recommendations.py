"""HackMatch AI - Recommendation Engine.

Analyzes team composition and generates human-readable recommendations
including strengths, weaknesses, and suggested improvements.
"""

from .features import get_all_skills
from .team_formation import compute_skill_coverage, compute_role_coverage, compute_skill_diversity

ALL_ROLES = [
    "AI/ML", "Backend", "Frontend", "UI/UX",
    "Database", "Research", "Presentation", "Project Management",
]

ROLE_SKILL_MAP = {
    "AI/ML": ["TensorFlow", "PyTorch", "Scikit-learn", "Deep Learning", "LLMs", "Computer Vision", "Natural Language Processing", "Reinforcement Learning"],
    "Backend": ["Node.js", "Express", "FastAPI", "Django", "Flask", "REST APIs", "GraphQL", "PostgreSQL", "MongoDB", "Redis"],
    "Frontend": ["React", "Next.js", "JavaScript", "TypeScript", "Tailwind CSS"],
    "UI/UX": ["Figma", "Design Systems", "Prototyping", "Wireframing", "User Research"],
    "Database": ["PostgreSQL", "MongoDB", "Supabase", "Redis", "MySQL", "Firebase"],
    "Research": ["Data Preprocessing", "Scikit-learn", "Computer Vision", "Reinforcement Learning"],
    "Presentation": ["Communication", "Presentation", "Leadership"],
    "Project Management": ["Leadership", "Time Management", "Communication", "Problem Solving"],
}


def generate_recommendations(team_name: str, members: list[dict], hackathon: dict) -> dict:
    strengths: list[str] = []
    weaknesses: list[str] = []
    improvements: list[str] = []

    team_roles = {m.get("preferred_team_role") for m in members}
    missing_roles = [r for r in ALL_ROLES if r not in team_roles]

    for role in team_roles:
        skills = ROLE_SKILL_MAP.get(role, [])
        has_relevant = any(
            any(s in get_all_skills(m) for s in skills) for m in members
        )
        if has_relevant:
            strengths.append(f"Strong {role} capabilities with relevant technical skills.")

    if "UI/UX" in missing_roles:
        weaknesses.append("Lacks UI/UX expertise, which may affect the visual quality and user experience of the project.")
        improvements.append("Consider adding a UI/UX member to improve role coverage and design quality.")
    if "Frontend" in missing_roles:
        weaknesses.append("No dedicated Frontend developer, which may limit the ability to build a polished interface.")
        improvements.append("Consider adding a Frontend developer to strengthen the user interface.")
    if "Backend" in missing_roles:
        weaknesses.append("No dedicated Backend developer, which may affect API and server-side implementation.")
        improvements.append("Consider adding a Backend developer to handle server-side logic and APIs.")
    if "AI/ML" in missing_roles and hackathon.get("project_domain") == "Generative AI":
        weaknesses.append("No AI/ML specialist, which is critical for a Generative AI project domain.")
        improvements.append("Consider adding an AI/ML specialist to handle the core ML components.")

    coverage = compute_skill_coverage(members, hackathon.get("required_skills", []))
    if coverage == 100:
        strengths.append("Full coverage of all required project skills.")
    elif coverage >= 75:
        strengths.append(f"Good coverage of required skills ({coverage:.0f}%).")
    elif coverage >= 50:
        weaknesses.append(f"Partial coverage of required skills ({coverage:.0f}%) - some critical skills are missing.")
        improvements.append("Review the required skills list and consider swapping in a member with the missing skills.")
    else:
        weaknesses.append(f"Low skill coverage ({coverage:.0f}%) - many required skills are not represented in the team.")
        improvements.append("Prioritize adding members with the missing required skills to improve project feasibility.")

    exp_levels = [m.get("experience_level") for m in members]
    has_expert = "Expert" in exp_levels
    has_beginner = "Beginner" in exp_levels
    all_same = len(set(exp_levels)) == 1

    if has_expert and has_beginner:
        strengths.append("Well-balanced experience levels with both experts and beginners for mentorship.")
    elif all_same and exp_levels[0] == "Expert":
        strengths.append("Highly experienced team with all expert-level members.")
    elif all_same and exp_levels[0] == "Beginner":
        weaknesses.append("All members are beginners - the team may struggle with complex technical challenges.")
        improvements.append("Consider swapping in a more experienced member to provide technical leadership.")
    elif not has_expert and not has_beginner:
        strengths.append("Solid intermediate-to-advanced experience across the team.")

    hackathon_exps = [m.get("previous_hackathon_experience", "None") for m in members]
    has_experienced = any(e not in ("None", "", None) for e in hackathon_exps)
    all_newcomers = all(e in ("None", "", None) for e in hackathon_exps)

    if has_experienced and not all_newcomers:
        strengths.append("Team has prior hackathon experience, which helps with time management and project scoping.")
    if all_newcomers:
        weaknesses.append("No team members have prior hackathon experience.")
        improvements.append("Consider adding a member with hackathon experience to help with time management and project scoping.")

    diversity = compute_skill_diversity(members)
    if diversity >= 70:
        strengths.append("High skill diversity - team members bring complementary skill sets.")
    elif diversity < 40:
        weaknesses.append("Low skill diversity - team members have overlapping skill sets.")
        improvements.append("Consider diversifying the team by adding members with different technical backgrounds.")

    all_interests: list[str] = []
    for m in members:
        all_interests.extend(m.get("areas_of_interest", []))
    interest_counts: dict[str, int] = {}
    for i in all_interests:
        interest_counts[i] = interest_counts.get(i, 0) + 1
    shared = [(k, v) for k, v in interest_counts.items() if v >= 2]
    if len(shared) >= 2:
        names = [k for k, _ in shared[:3]]
        strengths.append(f"Shared interests in {', '.join(names)} - good for team alignment and motivation.")

    domain = hackathon.get("project_domain", "")
    if domain == "Healthcare" and "Research" not in team_roles:
        improvements.append("For a Healthcare project, consider adding a Research-oriented member for domain understanding.")
    if domain == "FinTech" and not any("PostgreSQL" in get_all_skills(m) for m in members):
        improvements.append("For a FinTech project, strong database skills are essential for handling financial data.")

    return {
        "strengths": list(dict.fromkeys(strengths)),
        "weaknesses": list(dict.fromkeys(weaknesses)),
        "improvements": list(dict.fromkeys(improvements)),
    }
