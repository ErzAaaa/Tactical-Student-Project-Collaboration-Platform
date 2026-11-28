import { computeRulesMatchInsight } from "../match/engine";
import type {
  Application,
  ApplicationStatus,
  ApplicationWithApplicant,
  CreateProjectInput,
  MatchInsight,
  MyApplicationItem,
  PoWItem,
  Profile,
  ProjectFilters,
  ProjectStatus,
  ProjectWithCreator,
  Role,
  UpdateApplicationInput,
} from "../types";
import type {
  Application as DbApplication,
  ApplicationStatus as DbApplicationStatus,
  Profile as DbProfile,
  Project as DbProject,
  ProjectStatus as DbProjectStatus,
} from "@/types/database";
import type { DataClient } from "./client";

type DbProjectListItem = DbProject & {
  creator?: Partial<DbProfile> | null;
  accepted_count?: number;
};

type DbApplicationWithApplicant = DbApplication & {
  applicant?: DbProfile | null;
};

type DbProjectDetail = DbProjectListItem & {
  applications?: DbApplicationWithApplicant[];
};

type DbMyApplication = DbApplication & {
  project?: {
    id: string;
    title: string;
    category: string;
    status: DbProjectStatus;
    deadline: string;
  } | null;
};

async function apiFetch<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const json = (await res.json().catch(() => ({}))) as {
    data?: T;
    error?: string;
  };

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    if (res.status === 403) {
      throw new Error("FORBIDDEN");
    }
    throw new Error(json.error || `Request failed (${res.status})`);
  }

  return json.data as T;
}

function mapProjectStatus(status: DbProjectStatus): ProjectStatus {
  if (status === "in_progress") return "filled";
  return status;
}

function mapApplicationStatus(status: DbApplicationStatus): ApplicationStatus {
  if (status === "rejected") return "declined";
  return status;
}

function mapProfile(db: Partial<DbProfile>): Profile {
  const commitments = db.total_projects_joined ?? 0;
  const completed = db.completed_projects ?? 0;
  const powItems: PoWItem[] = [];

  if (db.github_url) {
    powItems.push({
      id: `github-${db.id ?? "user"}`,
      kind: "github",
      title: db.github_username ? `@${db.github_username} GitHub` : "GitHub Profile",
      url: db.github_url,
      level: db.github_verified ? "verified" : "self_declared",
      summary: db.bio || "GitHub profile linked via account.",
      skills: db.skills ?? [],
    });
  }

  return {
    id: db.id ?? "unknown",
    name: db.full_name || db.github_username || "Student User",
    faculty: db.role_title || "Student Collaborator",
    githubUsername: db.github_username ?? undefined,
    reliability: {
      score: typeof db.reliability_score === "number" ? db.reliability_score : null,
      commitmentsCount: commitments,
      completionRate:
        commitments > 0 ? Math.round((completed / commitments) * 100) : null,
    },
    responseRate: 100,
    powItems,
    demoRoleLabel: db.full_name || "Account",
  };
}

function synthesizeRole(db: DbProjectListItem): Role {
  return {
    id: db.id,
    projectId: db.id,
    name: db.category || "Contributor",
    skills: Array.isArray(db.required_skills) ? db.required_skills : [],
    slots: db.target_members ?? 1,
    filled: db.accepted_count ?? 0,
  };
}

function mapProject(db: DbProjectListItem): ProjectWithCreator {
  const creator = mapProfile(db.creator ?? { id: db.creator_id });
  return {
    id: db.id,
    creatorId: db.creator_id,
    title: db.title,
    description: db.description,
    applyDeadline: db.deadline,
    hoursPerWeek: 8,
    weeks: 3,
    status: mapProjectStatus(db.status),
    roles: [synthesizeRole(db)],
    createdAt: db.created_at,
    creator,
  };
}

function mapApplication(
  db: DbApplication,
  applicant?: Partial<DbProfile> | null
): Application {
  const appliedAt = new Date(db.applied_at);
  const due = new Date(appliedAt);
  due.setUTCDate(due.getUTCDate() + 7);

  const powSnapshot: PoWItem[] = [];
  if (db.github_repo_link) {
    powSnapshot.push({
      id: `repo-${db.id}`,
      kind: "github",
      title: db.github_repo_link.replace(/^https?:\/\/(www\.)?github\.com\//, ""),
      url: db.github_repo_link,
      level: applicant?.github_verified ? "verified" : "self_declared",
      summary: "Submitted repository link for this application.",
      skills: applicant?.skills ?? [],
    });
  }

  return {
    id: db.id,
    roleId: db.project_id,
    applicantId: db.applicant_id,
    pitch: db.cover_letter,
    powSnapshot,
    status: mapApplicationStatus(db.status),
    declineTemplate: (db.rejection_reason as Application["declineTemplate"]) ?? null,
    declineNote: null,
    createdAt: db.applied_at,
    decisionDueAt: due.toISOString(),
    decidedAt: db.status === "pending" || db.status === "shortlisted" ? null : db.updated_at,
  };
}

/**
 * Live API DataClient wired to Next.js /api/* routes & Supabase backend.
 */
export class SupabaseDataClient implements DataClient {
  readonly mode = "supabase" as const;
  private insightCache = new Map<string, MatchInsight>();
  private appContextCache = new Map<
    string,
    { roleSkills: string[]; powItems: PoWItem[]; pitch: string }
  >();

  async getCurrentUser(): Promise<Profile | null> {
    try {
      const dbProfile = await apiFetch<DbProfile>("/api/me");
      return mapProfile(dbProfile);
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        return null;
      }
      throw err;
    }
  }

  async listProjects(filters?: ProjectFilters): Promise<ProjectWithCreator[]> {
    const params = new URLSearchParams();
    if (filters?.query?.trim()) {
      params.set("search", filters.query.trim());
    }
    const qs = params.toString();
    const raw = await apiFetch<DbProjectListItem[]>(
      `/api/projects${qs ? `?${qs}` : ""}`
    );

    const skillOrRole = filters?.skillOrRole?.trim().toLowerCase() ?? "";
    const statusFilter = filters?.status ?? "open";

    return raw
      .map(mapProject)
      .filter((p) => {
        if (statusFilter !== "all" && p.status !== statusFilter) return false;
        if (skillOrRole) {
          const match = p.roles.some(
            (r) =>
              r.name.toLowerCase().includes(skillOrRole) ||
              r.skills.some((s) => s.toLowerCase().includes(skillOrRole))
          );
          if (!match) return false;
        }
        return true;
      });
  }

  async getProject(id: string): Promise<ProjectWithCreator | null> {
    try {
      const raw = await apiFetch<DbProjectDetail>(`/api/projects/${id}`);
      return mapProject(raw);
    } catch (err) {
      if (err instanceof Error && err.message.includes("tidak ditemukan")) {
        return null;
      }
      throw err;
    }
  }

  async createProject(input: CreateProjectInput): Promise<ProjectWithCreator> {
    const category = input.roles[0]?.name.trim() || "General";
    const requiredSkills = Array.from(
      new Set(input.roles.flatMap((r) => r.skills).filter(Boolean))
    );
    const targetMembers = Math.max(
      1,
      input.roles.reduce((sum, r) => sum + (r.slots || 1), 0)
    );

    const created = await apiFetch<DbProject>("/api/projects", {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        category,
        required_skills: requiredSkills,
        target_members: targetMembers,
        deadline: input.applyDeadline,
        status: "open",
      }),
    });

    const user = await this.getCurrentUser();
    return {
      ...mapProject(created),
      creator: user ?? mapProfile({ id: created.creator_id }),
    };
  }

  async createApplication(input: {
    roleId: string;
    pitch: string;
    githubRepoLink?: string | null;
  }): Promise<Application> {
    const created = await apiFetch<DbApplication>("/api/applications", {
      method: "POST",
      body: JSON.stringify({
        project_id: input.roleId,
        cover_letter: input.pitch,
        github_repo_link: input.githubRepoLink?.trim() || null,
      }),
    });

    return mapApplication(created);
  }

  async listApplications(
    projectId: string
  ): Promise<ApplicationWithApplicant[]> {
    const [me, detail] = await Promise.all([
      this.getCurrentUser(),
      apiFetch<DbProjectDetail>(`/api/projects/${projectId}`),
    ]);

    if (!me || detail.creator_id !== me.id) {
      throw new Error("FORBIDDEN");
    }

    const role = synthesizeRole(detail);
    return (detail.applications ?? []).map((dbApp) => {
      const applicant = mapProfile(
        dbApp.applicant ?? { id: dbApp.applicant_id }
      );
      const mapped = mapApplication(dbApp, dbApp.applicant);
      this.appContextCache.set(mapped.id, {
        roleSkills: role.skills,
        powItems: mapped.powSnapshot,
        pitch: mapped.pitch,
      });
      return {
        ...mapped,
        applicant,
        role,
      };
    });
  }

  async updateApplication(
    input: UpdateApplicationInput
  ): Promise<Application> {
    const statusMap: Record<UpdateApplicationInput["action"], DbApplicationStatus> = {
      shortlist: "shortlisted",
      accept: "accepted",
      decline: "rejected",
    };

    const rejectionReason =
      input.action === "decline" && input.template
        ? input.note?.trim()
          ? `${input.template} — ${input.note.trim()}`
          : input.template
        : undefined;

    const updated = await apiFetch<DbApplication>(
      `/api/applications/${input.id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status: statusMap[input.action],
          rejection_reason: rejectionReason,
        }),
      }
    );

    return mapApplication(updated);
  }

  async withdrawApplication(input: {
    id: string;
    reason?: string;
  }): Promise<Application> {
    const updated = await apiFetch<DbApplication>(
      `/api/applications/${input.id}/withdraw`,
      {
        method: "PATCH",
        body: JSON.stringify({
          withdraw_reason: input.reason?.trim() || null,
        }),
      }
    );
    return mapApplication(updated);
  }

  async listMyApplications(): Promise<MyApplicationItem[]> {
    try {
      const rows = await apiFetch<DbMyApplication[]>("/api/applications");
      return rows.map((row) => {
        const proj = row.project;
        const mappedProject: ProjectWithCreator = proj
          ? {
              id: proj.id,
              creatorId: "",
              title: proj.title,
              description: "",
              applyDeadline: proj.deadline,
              hoursPerWeek: 8,
              weeks: 3,
              status: mapProjectStatus(proj.status),
              roles: [
                {
                  id: proj.id,
                  projectId: proj.id,
                  name: proj.category,
                  skills: [],
                  slots: 1,
                  filled: 0,
                },
              ],
              createdAt: row.applied_at,
              creator: mapProfile({ full_name: "Project Creator" }),
            }
          : {
              id: row.project_id,
              creatorId: "",
              title: "Project",
              description: "",
              applyDeadline: row.applied_at,
              hoursPerWeek: 8,
              weeks: 3,
              status: "open",
              roles: [],
              createdAt: row.applied_at,
              creator: mapProfile({ full_name: "Project Creator" }),
            };

        return {
          ...mapApplication(row),
          project: mappedProject,
          role: mappedProject.roles[0] ?? {
            id: row.project_id,
            projectId: row.project_id,
            name: "Contributor",
            skills: [],
            slots: 1,
            filled: 0,
          },
        };
      });
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        return [];
      }
      throw err;
    }
  }

  async getMatchInsight(applicationId: string): Promise<MatchInsight | null> {
    const cached = this.insightCache.get(applicationId);
    if (cached) return cached;

    const ctx = this.appContextCache.get(applicationId);
    if (!ctx) return null;

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          roleSkills: ctx.roleSkills,
          powItems: ctx.powItems,
          pitch: ctx.pitch,
        }),
      });
      if (res.ok) {
        const insight = (await res.json()) as MatchInsight;
        this.insightCache.set(applicationId, insight);
        return insight;
      }
    } catch {
      // Fall back to deterministic rules
    }

    const fallback = computeRulesMatchInsight({
      applicationId,
      roleSkills: ctx.roleSkills,
      powItems: ctx.powItems,
    });
    this.insightCache.set(applicationId, fallback);
    return fallback;
  }
}
