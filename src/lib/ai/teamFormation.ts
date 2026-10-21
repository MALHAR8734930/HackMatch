// HackMatch AI - Team Formation Algorithm
// Uses a greedy optimization approach to form balanced teams.
// Maximizes overall compatibility while maintaining balanced team sizes
// and ensuring role/skill diversity.

import type { Participant, Hackathon, TeamRole } from '../types';
import { extractAllFeatures, getAllSkills, jaccardSimilarity, cosineSimilarity, buildSkillVocabulary } from './features';

const ALL_ROLES: TeamRole[] = [
  'AI/ML', 'Backend', 'Frontend', 'UI/UX', 'Database', 'Research', 'Presentation', 'Project Management'
];

// Compute pairwise compatibility between two participants
export function computeCompatibility(p1: Participant, p2: Participant): number {
  // 1. Skill complementarity (Jaccard of combined skills)
  const skills1 = getAllSkills(p1);
  const skills2 = getAllSkills(p2);
  const skillOverlap = jaccardSimilarity(skills1, skills2);

  // 2. Shared interests
  const interestOverlap = jaccardSimilarity(p1.areas_of_interest, p2.areas_of_interest);

  // 3. Experience compatibility (closer levels = better)
  const expMap: Record<string, number> = { Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4 };
  const expDiff = Math.abs((expMap[p1.experience_level] ?? 1) - (expMap[p2.experience_level] ?? 1));
  const expCompat = 1 - (expDiff / 3); // 0 = very different, 1 = same level

  // 4. Role diversity (different roles = better for team balance)
  const roleDiversity = p1.preferred_team_role === p2.preferred_team_role ? 0.3 : 1.0;

  // Weighted combination
  const compatibility = 0.35 * skillOverlap + 0.25 * interestOverlap + 0.20 * expCompat + 0.20 * roleDiversity;
  return compatibility;
}

// Compute team-level compatibility (average pairwise)
export function computeTeamCompatibility(members: Participant[]): number {
  if (members.length < 2) return 0;
  let total = 0;
  let count = 0;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      total += computeCompatibility(members[i], members[j]);
      count++;
    }
  }
  return count > 0 ? total / count : 0;
}

// Compute skill coverage against required skills
export function computeSkillCoverage(members: Participant[], requiredSkills: string[]): number {
  if (requiredSkills.length === 0) return 100;
  const teamSkills = new Set<string>();
  members.forEach(m => getAllSkills(m).forEach(s => teamSkills.add(s.toLowerCase())));
  const covered = requiredSkills.filter(s => teamSkills.has(s.toLowerCase())).length;
  return (covered / requiredSkills.length) * 100;
}

// Compute role coverage (how many distinct roles are covered)
export function computeRoleCoverage(members: Participant[]): number {
  const roles = new Set(members.map(m => m.preferred_team_role));
  return (roles.size / ALL_ROLES.length) * 100;
}

// Compute skill diversity (how varied are the skills)
export function computeSkillDiversity(members: Participant[]): number {
  const allSkills = new Set<string>();
  members.forEach(m => getAllSkills(m).forEach(s => allSkills.add(s)));
  // Normalize: more unique skills relative to team size = more diverse
  const maxPossible = members.length * 15; // Assume ~15 skills per person max
  return Math.min((allSkills.size / maxPossible) * 100, 100);
}

// Main team formation algorithm
export function formTeams(
  participants: Participant[],
  hackathon: Hackathon
): Participant[][] {
  const teamSize = hackathon.team_size;
  const numTeams = hackathon.num_teams || Math.ceil(participants.length / teamSize);
  const requiredSkills = hackathon.required_skills;

  // Sort participants by experience (experts first for anchoring teams)
  const expOrder: Record<string, number> = { Expert: 4, Advanced: 3, Intermediate: 2, Beginner: 1 };
  const sorted = [...participants].sort((a, b) => (expOrder[b.experience_level] ?? 0) - (expOrder[a.experience_level] ?? 0));

  // Initialize teams
  const teams: Participant[][] = Array.from({ length: numTeams }, () => []);

  // Phase 1: Anchor each team with the most experienced participants
  for (let i = 0; i < numTeams && i < sorted.length; i++) {
    teams[i].push(sorted[i]);
  }

  // Phase 2: Greedy assignment of remaining participants
  // For each unassigned participant, find the team where they add the most value
  const assigned = new Set(teams.flat().map(p => p.id));
  const remaining = sorted.filter(p => !assigned.has(p.id));

  // Track which primary skills each team already has (to prevent clustering)
  const teamPrimarySkills = teams.map(team =>
    new Set(team.map(m => m.preferred_team_role))
  );

  while (remaining.length > 0) {
    let bestParticipant: Participant | null = null;
    let bestTeamIdx = -1;
    let bestScore = -Infinity;

    for (const participant of remaining) {
      for (let t = 0; t < teams.length; t++) {
        // Skip if team is full
        if (teams[t].length >= teamSize) continue;

        // Compute marginal benefit of adding this participant to team t
        const team = teams[t];

        // 1. Compatibility with existing members
        let compat = 0;
        team.forEach(m => { compat += computeCompatibility(participant, m); });
        compat = team.length > 0 ? compat / team.length : 0.5;

        // 2. Skill coverage gain
        const coverageBefore = computeSkillCoverage(team, requiredSkills);
        const coverageAfter = computeSkillCoverage([...team, participant], requiredSkills);
        const coverageGain = (coverageAfter - coverageBefore) / 100;

        // 3. Role diversity bonus (penalize same-role clustering)
        const sameRoleCount = team.filter(m => m.preferred_team_role === participant.preferred_team_role).length;
        const rolePenalty = sameRoleCount * 0.15;

        // 4. Experience balance (prefer adding to less experienced teams)
        const teamAvgExp = team.length > 0
          ? team.reduce((sum, m) => sum + (expOrder[m.experience_level] ?? 0), 0) / team.length
          : 0;
        const participantExp = expOrder[participant.experience_level] ?? 0;
        const expBalance = 1 - Math.abs(teamAvgExp - participantExp) / 4;

        // Weighted score
        const score = 0.35 * compat + 0.30 * coverageGain + 0.20 * expBalance - rolePenalty + 0.15 * (1 - teams[t].length / teamSize);

        if (score > bestScore) {
          bestScore = score;
          bestParticipant = participant;
          bestTeamIdx = t;
        }
      }
    }

    if (bestParticipant && bestTeamIdx >= 0) {
      teams[bestTeamIdx].push(bestParticipant);
      assigned.add(bestParticipant.id);
      remaining.splice(remaining.indexOf(bestParticipant), 1);
    } else {
      // No valid placement (all teams full or no remaining), break
      break;
    }
  }

  return teams;
}

// Generate a team name based on Greek letters
const GREEK_LETTERS = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
  'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi'
];

export function generateTeamName(index: number): string {
  if (index < GREEK_LETTERS.length) return `Team ${GREEK_LETTERS[index]}`;
  return `Team ${index + 1}`;
}
