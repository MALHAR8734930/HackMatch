// Type definitions for HackMatch AI

export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type TeamRole = 'AI/ML' | 'Backend' | 'Frontend' | 'UI/UX' | 'Database' | 'Research' | 'Presentation' | 'Project Management';
export type UserRole = 'admin' | 'participant';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Participant {
  id: string;
  profile_id: string | null;
  full_name: string;
  email: string;
  college: string;
  department: string;
  year: string;
  technical_skills: string[];
  programming_languages: string[];
  ai_ml_skills: string[];
  web_dev_skills: string[];
  database_skills: string[];
  ui_ux_skills: string[];
  soft_skills: string[];
  areas_of_interest: string[];
  experience_level: ExperienceLevel;
  previous_hackathon_experience: string;
  preferred_team_role: TeamRole;
  project_interests: string[];
  is_demo: boolean;
  created_at: string;
}

export interface Hackathon {
  id: string;
  name: string;
  num_participants: number;
  team_size: number;
  project_domain: string;
  required_skills: string[];
  optional_skills: string[];
  difficulty_level: ExperienceLevel;
  num_teams: number;
  created_by: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  hackathon_id: string;
  name: string;
  team_index: number;
  locked: boolean;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  participant_id: string;
  role: string | null;
  created_at: string;
}

export interface TeamScore {
  id: string;
  team_id: string;
  success_score: number;
  project_skill_match: number;
  skill_diversity: number;
  experience: number;
  role_coverage: number;
  compatibility: number;
  hackathon_experience: number;
  created_at: string;
}

export interface Recommendation {
  id: string;
  team_id: string;
  type: 'strength' | 'weakness' | 'improvement';
  content: string;
  created_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  created_at: string;
}

// Computed types for the AI engine
export interface TeamWithDetails extends Team {
  members: Participant[];
  score: TeamScore | null;
  recommendations: Recommendation[];
  skill_coverage: Record<string, number>;
  project_match: number;
  compatibility_score: number;
}

export interface ScoreBreakdown {
  success_score: number;
  project_skill_match: number;
  skill_diversity: number;
  experience: number;
  role_coverage: number;
  compatibility: number;
  hackathon_experience: number;
}

export interface RecommendationSet {
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
}
