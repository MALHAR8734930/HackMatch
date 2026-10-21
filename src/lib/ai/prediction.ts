// HackMatch AI - Success Prediction Module
// Uses an explainable weighted scoring model to predict team success.
// Each component is normalized 0-100 and combined with defined weights.
// This is designed so a trained ML model can later replace the scoring function
// while keeping the same feature interface.

import type { Participant, Hackathon, ScoreBreakdown } from '../types';
import { getAllSkills } from './features';
import {
  computeSkillCoverage,
  computeRoleCoverage,
  computeSkillDiversity,
  computeTeamCompatibility,
} from './teamFormation';

// Prediction weights (must sum to 100)
export const PREDICTION_WEIGHTS = {
  projectSkillMatch: 30,
  skillDiversity: 20,
  experience: 15,
  roleCoverage: 15,
  compatibility: 10,
  hackathonExperience: 10,
} as const;

// Experience level to numeric score
const EXP_SCORE: Record<string, number> = {
  Beginner: 25,
  Intermediate: 50,
  Advanced: 75,
  Expert: 100,
};

// Parse hackathon experience string to numeric score
function hackathonExpScore(exp: string): number {
  if (!exp || exp === 'None') return 0;
  const match = exp.match(/(\d+)/);
  if (match) {
    const n = parseInt(match[1], 10);
    return Math.min((n / 5) * 100, 100);
  }
  return 50;
}

// Predict success score for a team
export function predictSuccess(
  members: Participant[],
  hackathon: Hackathon
): ScoreBreakdown {
  if (members.length === 0) {
    return {
      success_score: 0,
      project_skill_match: 0,
      skill_diversity: 0,
      experience: 0,
      role_coverage: 0,
      compatibility: 0,
      hackathon_experience: 0,
    };
  }

  // 1. Project-Skill Match (30%)
  const projectSkillMatch = computeSkillCoverage(members, hackathon.required_skills);

  // 2. Skill Diversity (20%)
  const skillDiversity = computeSkillDiversity(members);

  // 3. Experience (15%) - average of team members' experience levels
  const avgExperience = members.reduce((sum, m) => sum + (EXP_SCORE[m.experience_level] ?? 25), 0) / members.length;

  // 4. Role Coverage (15%)
  const roleCoverage = computeRoleCoverage(members);

  // 5. Team Compatibility (10%)
  const compatibilityRaw = computeTeamCompatibility(members);
  const compatibility = compatibilityRaw * 100;

  // 6. Hackathon Experience (10%) - average of team members' hackathon experience
  const avgHackathonExp = members.reduce((sum, m) => sum + hackathonExpScore(m.previous_hackathon_experience), 0) / members.length;

  // Weighted combination
  const successScore =
    (projectSkillMatch * PREDICTION_WEIGHTS.projectSkillMatch +
     skillDiversity * PREDICTION_WEIGHTS.skillDiversity +
     avgExperience * PREDICTION_WEIGHTS.experience +
     roleCoverage * PREDICTION_WEIGHTS.roleCoverage +
     compatibility * PREDICTION_WEIGHTS.compatibility +
     avgHackathonExp * PREDICTION_WEIGHTS.hackathonExperience) / 100;

  return {
    success_score: Math.round(successScore * 10) / 10,
    project_skill_match: Math.round(projectSkillMatch * 10) / 10,
    skill_diversity: Math.round(skillDiversity * 10) / 10,
    experience: Math.round(avgExperience * 10) / 10,
    role_coverage: Math.round(roleCoverage * 10) / 10,
    compatibility: Math.round(compatibility * 10) / 10,
    hackathon_experience: Math.round(avgHackathonExp * 10) / 10,
  };
}

// Get score label based on score value
export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: 'text-emerald-400' };
  if (score >= 65) return { label: 'Good', color: 'text-blue-400' };
  if (score >= 50) return { label: 'Moderate', color: 'text-amber-400' };
  if (score >= 35) return { label: 'Below Average', color: 'text-orange-400' };
  return { label: 'Needs Improvement', color: 'text-red-400' };
}
