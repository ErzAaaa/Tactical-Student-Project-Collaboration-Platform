export type ProjectStatus = 'open' | 'in_progress' | 'closed';

export type ApplicationStatus =
  | 'pending'
  | 'shortlisted'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export type ReliabilityTier =
  | 'Top Contributor'
  | 'Reliable'
  | 'Explorer'
  | 'At Risk';

export interface Profile {
  id: string;
  full_name: string | null;
  role_title: string | null;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  github_username: string | null;
  github_url: string | null;
  github_verified: boolean;
  reliability_score: number;
  reliability_tier: ReliabilityTier;
  total_projects_joined: number;
  completed_projects: number;
  valid_withdrawals: number;
  late_withdrawals: number;
  ghosted_count: number;
  peer_review_sum: number;
  peer_review_count: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string;
  required_skills: string[];
  target_members: number;
  deadline: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  project_id: string;
  applicant_id: string;
  cover_letter: string;
  github_repo_link: string | null;
  status: ApplicationStatus;
  rejection_reason: string | null;
  withdraw_reason: string | null;
  applied_at: string;
  updated_at: string;
}
