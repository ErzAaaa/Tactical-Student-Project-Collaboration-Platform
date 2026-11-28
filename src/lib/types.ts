export type PoWKind = "github" | "behance" | "figma" | "drive" | "other";

export type PoWLevel = "verified" | "self_declared" | "platform_earned";

export interface PoWItem {
  id: string;
  kind: PoWKind;
  title: string;
  url: string;
  level: PoWLevel;
  summary: string; // max 200 chars
  skills: string[];
}

export interface ReliabilitySummary {
  score: number | null;
  commitmentsCount: number;
  completionRate: number | null;
}

export interface Profile {
  id: string;
  name: string;
  faculty: string;
  githubUsername?: string;
  reliability: ReliabilitySummary;
  responseRate: number; // percentage 0-100
  powItems: PoWItem[];
  demoRoleLabel: string; // e.g., "Creator", "Applicant A", "Applicant B", "Applicant C"
}

export type ProjectStatus = "open" | "closed" | "filled";

export interface Role {
  id: string;
  projectId: string;
  name: string;
  skills: string[];
  slots: number;
  filled: number;
}

export interface Project {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  applyDeadline: string; // ISO UTC
  hoursPerWeek: number;
  weeks: number;
  status: ProjectStatus;
  roles: Role[];
  createdAt: string; // ISO UTC
}

export interface ProjectWithCreator extends Project {
  creator: Profile;
}

export type ApplicationStatus =
  | "pending"
  | "shortlisted"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "expired";

export type DeclineTemplate =
  | "The role has been filled"
  | "Skills are not a close match for this role"
  | "The schedule or commitment does not fit";

export const DECLINE_TEMPLATES: DeclineTemplate[] = [
  "The role has been filled",
  "Skills are not a close match for this role",
  "The schedule or commitment does not fit",
];

export interface Application {
  id: string;
  roleId: string;
  applicantId: string;
  pitch: string;
  powSnapshot: PoWItem[];
  status: ApplicationStatus;
  declineTemplate?: DeclineTemplate | null;
  declineNote?: string | null;
  createdAt: string; // ISO UTC
  decisionDueAt: string; // ISO UTC (createdAt + 7 days)
  decidedAt?: string | null; // ISO UTC
}

export interface ApplicationWithApplicant extends Application {
  applicant: Profile;
  role: Role;
}

export interface MyApplicationItem extends Application {
  project: ProjectWithCreator;
  role: Role;
}

export type MatchBand = "strong" | "partial" | "limited";

export interface EvidencedSkill {
  skill: string;
  level: PoWLevel;
  evidenceIds: string[];
}

export interface MatchInsight {
  applicationId: string;
  band: MatchBand;
  evidenced: EvidencedSkill[];
  missing: string[];
  explanation: string | null;
  source: "rules" | "rules+llm";
  model: string | null;
  status: "pending" | "ok" | "ai_unavailable";
  generatedAt: string; // ISO UTC
  precomputed?: boolean;
}

export interface ProjectFilters {
  query?: string;
  skillOrRole?: string;
  status?: ProjectStatus | "all";
}

export interface CreateProjectRoleInput {
  name: string;
  skills: string[];
  slots: number;
}

export interface CreateProjectInput {
  title: string;
  description: string;
  applyDeadline: string; // ISO UTC
  hoursPerWeek: number;
  weeks: number;
  roles: CreateProjectRoleInput[];
}

export interface UpdateApplicationInput {
  id: string;
  action: "shortlist" | "accept" | "decline";
  template?: DeclineTemplate;
  note?: string;
}
