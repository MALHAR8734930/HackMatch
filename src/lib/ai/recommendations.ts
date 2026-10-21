// HackMatch AI - Recommendation Engine
// Analyzes team composition and generates human-readable recommendations
// including strengths, weaknesses, and suggested improvements.

import type { Participant, Hackathon, RecommendationSet, TeamRole } from '../types';
import { getAllSkills } from './features';
import { computeSkillCoverage, computeRoleCoverage, computeSkillDiversity } from './teamFormation';

const ALL_ROLES: TeamRole[] = [
  'AI/ML', 'Backend', 'Frontend', 'UI/UX', 'Database', 'Research', 'Presentation', 'Project Management'
];

// Role to skill category mapping for recommendations
const ROLE_SKILL_MAP: Record<string, string[]> = {
  'AI/ML': ['TensorFlow', 'PyTorch', 'Scikit-learn', 'Deep Learning', 'LLMs', 'Computer Vision', 'Natural Language Processing', 'Reinforcement Learning'],
  'Backend': ['Node.js', 'Express', 'FastAPI', 'Django', 'Flask', 'REST APIs', 'GraphQL', 'PostgreSQL', 'MongoDB', 'Redis'],
  'Frontend': ['React', 'Next.js', 'JavaScript', 'TypeScript', 'Tailwind CSS'],
  'UI/UX': ['Figma', 'Design Systems', 'Prototyping', 'Wireframing', 'User Research'],
  'Database': ['PostgreSQL', 'MongoDB', 'Supabase', 'Redis', 'MySQL', 'Firebase'],
  'Research': ['Data Preprocessing', 'Scikit-learn', 'Computer Vision', 'Reinforcement Learning'],
  'Presentation': ['Communication', 'Presentation', 'Leadership'],
  'Project Management': ['Leadership', 'Time Management', 'Communication', 'Problem Solving'],
};

export function generateRecommendations(
  teamName: string,
  members: Participant[],
  hackathon: Hackathon
): RecommendationSet {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const improvements: string[] = [];

  // Analyze role coverage
  const teamRoles = new Set(members.map(m => m.preferred_team_role));
  const missingRoles = ALL_ROLES.filter(r => !teamRoles.has(r));

  // Identify strong roles
  const roleSkills: string[] = [];
  teamRoles.forEach(role => {
    const skills = ROLE_SKILL_MAP[role] || [];
    const hasRelevantSkills = members.some(m =>
      getAllSkills(m).some(s => skills.includes(s))
    );
    if (hasRelevantSkills) {
      strengths.push(`Strong ${role} capabilities with relevant technical skills.`);
      roleSkills.push(...skills);
    }
  });

  // Identify missing critical roles
  if (missingRoles.includes('UI/UX')) {
    weaknesses.push('Lacks UI/UX expertise, which may affect the visual quality and user experience of the project.');
    improvements.push('Consider adding a UI/UX member to improve role coverage and design quality.');
  }
  if (missingRoles.includes('Frontend')) {
    weaknesses.push('No dedicated Frontend developer, which may limit the ability to build a polished interface.');
    improvements.push('Consider adding a Frontend developer to strengthen the user interface.');
  }
  if (missingRoles.includes('Backend')) {
    weaknesses.push('No dedicated Backend developer, which may affect API and server-side implementation.');
    improvements.push('Consider adding a Backend developer to handle server-side logic and APIs.');
  }
  if (missingRoles.includes('AI/ML') && hackathon.project_domain === 'Generative AI') {
    weaknesses.push('No AI/ML specialist, which is critical for a Generative AI project domain.');
    improvements.push('Consider adding an AI/ML specialist to handle the core ML components.');
  }

  // Analyze skill coverage against required skills
  const coverage = computeSkillCoverage(members, hackathon.required_skills);
  if (coverage === 100) {
    strengths.push('Full coverage of all required project skills.');
  } else if (coverage >= 75) {
    strengths.push(`Good coverage of required skills (${coverage.toFixed(0)}%).`);
  } else if (coverage >= 50) {
    weaknesses.push(`Partial coverage of required skills (${coverage.toFixed(0)}%) - some critical skills are missing.`);
    improvements.push('Review the required skills list and consider swapping in a member with the missing skills.');
  } else {
    weaknesses.push(`Low skill coverage (${coverage.toFixed(0)}%) - many required skills are not represented in the team.`);
    improvements.push('Prioritize adding members with the missing required skills to improve project feasibility.');
  }

  // Analyze experience balance
  const expLevels = members.map(m => m.experience_level);
  const hasExpert = expLevels.includes('Expert');
  const hasBeginner = expLevels.includes('Beginner');
  const allSameLevel = new Set(expLevels).size === 1;

  if (hasExpert && hasBeginner) {
    strengths.push('Well-balanced experience levels with both experts and beginners for mentorship.');
  } else if (allSameLevel && expLevels[0] === 'Expert') {
    strengths.push('Highly experienced team with all expert-level members.');
  } else if (allSameLevel && expLevels[0] === 'Beginner') {
    weaknesses.push('All members are beginners - the team may struggle with complex technical challenges.');
    improvements.push('Consider swapping in a more experienced member to provide technical leadership.');
  } else if (!hasExpert && !hasBeginner) {
    strengths.push('Solid intermediate-to-advanced experience across the team.');
  }

  // Analyze hackathon experience
  const hackathonExps = members.map(m => m.previous_hackathon_experience);
  const hasExperienced = hackathonExps.some(e => e !== 'None' && e !== '');
  const allNewcomers = hackathonExps.every(e => e === 'None' || e === '');

  if (hasExperienced && allNewcomers === false) {
    strengths.push('Team has prior hackathon experience, which helps with time management and project scoping.');
  }
  if (allNewcomers) {
    weaknesses.push('No team members have prior hackathon experience.');
    improvements.push('Consider adding a member with hackathon experience to help with time management and project scoping.');
  }

  // Analyze skill diversity
  const diversity = computeSkillDiversity(members);
  if (diversity >= 70) {
    strengths.push('High skill diversity - team members bring complementary skill sets.');
  } else if (diversity < 40) {
    weaknesses.push('Low skill diversity - team members have overlapping skill sets.');
    improvements.push('Consider diversifying the team by adding members with different technical backgrounds.');
  }

  // Analyze shared interests
  const allInterests = members.flatMap(m => m.areas_of_interest);
  const interestCounts: Record<string, number> = {};
  allInterests.forEach(i => { interestCounts[i] = (interestCounts[i] || 0) + 1; });
  const sharedInterests = Object.entries(interestCounts).filter(([, count]) => count >= 2);

  if (sharedInterests.length >= 2) {
    strengths.push(`Shared interests in ${sharedInterests.map(([i]) => i).slice(0, 3).join(', ')} - good for team alignment and motivation.`);
  }

  // Domain-specific recommendations
  const domain = hackathon.project_domain;
  if (domain === 'Healthcare' && !teamRoles.has('Research')) {
    improvements.push('For a Healthcare project, consider adding a Research-oriented member for domain understanding.');
  }
  if (domain === 'FinTech' && !members.some(m => getAllSkills(m).includes('PostgreSQL'))) {
    improvements.push('For a FinTech project, strong database skills are essential for handling financial data.');
  }

  // Deduplicate
  return {
    strengths: [...new Set(strengths)],
    weaknesses: [...new Set(weaknesses)],
    improvements: [...new Set(improvements)],
  };
}
