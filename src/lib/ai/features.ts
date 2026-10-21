// HackMatch AI - Feature Extraction & Skill Encoding Module
// Transforms participant data into normalized numerical features (0-1 range)
// for use by the team formation and prediction algorithms.

import type { Participant, ExperienceLevel } from '../types';

// Experience level mapping (0-1 normalized)
const EXPERIENCE_MAP: Record<ExperienceLevel, number> = {
  Beginner: 0.25,
  Intermediate: 0.50,
  Advanced: 0.75,
  Expert: 1.0,
};

// Previous hackathon experience mapping (0-1 normalized)
function parseHackathonExperience(exp: string): number {
  if (!exp || exp === 'None') return 0;
  const match = exp.match(/(\d+)/);
  if (match) {
    const n = parseInt(match[1], 10);
    return Math.min(n / 5, 1.0); // 5+ hackathons = 1.0
  }
  return 0.5; // Has some experience but unknown count
}

// All skill categories combined for a participant
export function getAllSkills(p: Participant): string[] {
  return [
    ...p.technical_skills,
    ...p.programming_languages,
    ...p.ai_ml_skills,
    ...p.web_dev_skills,
    ...p.database_skills,
    ...p.ui_ux_skills,
    ...p.soft_skills,
  ];
}

// Build a skill vector (binary encoding) for a participant against a skill set
export function encodeSkills(participant: Participant, skillSet: string[]): number[] {
  const allSkills = new Set(getAllSkills(participant).map(s => s.toLowerCase()));
  return skillSet.map(s => (allSkills.has(s.toLowerCase()) ? 1 : 0));
}

// Build a complete skill set across all participants (vocabulary)
export function buildSkillVocabulary(participants: Participant[]): string[] {
  const skills = new Set<string>();
  participants.forEach(p => {
    getAllSkills(p).forEach(s => skills.add(s));
  });
  return Array.from(skills).sort();
}

// Extract normalized numerical features for a single participant
export interface ParticipantFeatures {
  participantId: string;
  experienceScore: number;       // 0-1
  hackathonExpScore: number;     // 0-1
  skillCount: number;            // raw count
  skillDiversity: number;        // 0-1 (normalized by max)
  rolePreference: string;
  skillVector: number[];         // binary encoding against vocabulary
  interestVector: number[];      // binary encoding of areas of interest
  technicalDepth: number;        // 0-1 ratio of advanced skills
}

export function extractFeatures(participant: Participant, vocabulary: string[]): ParticipantFeatures {
  const allSkills = getAllSkills(participant);
  const skillVector = encodeSkills(participant, vocabulary);

  // Interest vocabulary is built dynamically per team, so we store raw interests
  // and encode later. For now, store as binary against a fixed set.
  const interestVector: number[] = [];

  return {
    participantId: participant.id,
    experienceScore: EXPERIENCE_MAP[participant.experience_level] ?? 0.25,
    hackathonExpScore: parseHackathonExperience(participant.previous_hackathon_experience),
    skillCount: allSkills.length,
    skillDiversity: 0, // Computed relative to max in batch
    rolePreference: participant.preferred_team_role,
    skillVector,
    interestVector,
    technicalDepth: 0, // Computed in batch
  };
}

// Extract features for all participants and normalize
export function extractAllFeatures(participants: Participant[]): Map<string, ParticipantFeatures> {
  const vocabulary = buildSkillVocabulary(participants);
  const features = new Map<string, ParticipantFeatures>();

  const maxSkillCount = Math.max(...participants.map(p => getAllSkills(p).length), 1);

  participants.forEach(p => {
    const f = extractFeatures(p, vocabulary);
    f.skillDiversity = f.skillCount / maxSkillCount;

    // Technical depth: ratio of advanced/ML skills to total
    const advancedSkills = [...p.ai_ml_skills, ...p.technical_skills.filter((s: string) =>
      s.includes('Docker') || s.includes('AWS') || s.includes('CI/CD') || s.includes('GraphQL')
    )].length;
    f.technicalDepth = allSkillsCount(p) > 0 ? advancedSkills / allSkillsCount(p) : 0;

    features.set(p.id, f);
  });

  return features;
}

function allSkillsCount(p: Participant): number {
  return getAllSkills(p).length;
}

// Compute cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// Compute Jaccard similarity between two sets
export function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a.map(s => s.toLowerCase()));
  const setB = new Set(b.map(s => s.toLowerCase()));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}
