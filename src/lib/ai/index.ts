// HackMatch AI - Main AI Engine Orchestrator
// Coordinates the full prediction pipeline:
// Participant Data -> Feature Extraction -> Skill Encoding -> Team Formation
// -> Feature Calculation -> Success Prediction -> Recommendation

import type { Participant, Hackathon, ScoreBreakdown, RecommendationSet } from '../types';
import { extractAllFeatures, buildSkillVocabulary } from './features';
import { formTeams, generateTeamName, computeSkillCoverage } from './teamFormation';
import { predictSuccess } from './prediction';
import { generateRecommendations } from './recommendations';

export interface GeneratedTeam {
  name: string;
  index: number;
  members: Participant[];
  score: ScoreBreakdown;
  recommendations: RecommendationSet;
  skillCoverage: number;
  projectMatch: number;
}

// Full pipeline: form teams, predict scores, generate recommendations
export function generateAllTeams(
  participants: Participant[],
  hackathon: Hackathon
): GeneratedTeam[] {
  // Step 1: Feature Extraction & Skill Encoding
  const vocabulary = buildSkillVocabulary(participants);
  extractAllFeatures(participants); // Features extracted for potential ML model swap-in

  // Step 2: Team Formation (greedy optimization)
  const teamArrays = formTeams(participants, hackathon);

  // Step 3: For each team, compute score and recommendations
  const teams: GeneratedTeam[] = teamArrays.map((members, index) => {
    if (members.length === 0) return null;

    // Step 4: Success Prediction
    const score = predictSuccess(members, hackathon);

    // Step 5: Recommendation Generation
    const recommendations = generateRecommendations(
      generateTeamName(index),
      members,
      hackathon
    );

    // Compute skill coverage for display
    const skillCoverage = computeSkillCoverage(members, hackathon.required_skills);

    return {
      name: generateTeamName(index),
      index,
      members,
      score,
      recommendations,
      skillCoverage,
      projectMatch: score.project_skill_match,
    };
  }).filter((t): t is GeneratedTeam => t !== null);

  return teams;
}

// Swap a member between two teams
export function swapMembers(
  teams: GeneratedTeam[],
  fromTeamIdx: number,
  toTeamIdx: number,
  participantId: string
): GeneratedTeam[] {
  const newTeams = teams.map(t => ({ ...t, members: [...t.members] }));

  const fromTeam = newTeams[fromTeamIdx];
  const toTeam = newTeams[toTeamIdx];

  const memberIdx = fromTeam.members.findIndex(m => m.id === participantId);
  if (memberIdx === -1) return teams;

  const [swapped] = fromTeam.members.splice(memberIdx, 1);
  toTeam.members.push(swapped);

  return newTeams;
}

export { predictSuccess, generateRecommendations, formTeams, generateTeamName, computeSkillCoverage };
export { PREDICTION_WEIGHTS } from './prediction';
export { extractAllFeatures, buildSkillVocabulary, getAllSkills, cosineSimilarity, jaccardSimilarity } from './features';
export { computeCompatibility, computeTeamCompatibility, computeRoleCoverage, computeSkillDiversity } from './teamFormation';
