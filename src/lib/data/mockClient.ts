import { computeRulesMatchInsight } from "../match/engine";
import type {
  Application,
  ApplicationWithApplicant,
  CreateProjectInput,
  MatchInsight,
  MyApplicationItem,
  Profile,
  Project,
  ProjectFilters,
  ProjectWithCreator,
  Role,
  UpdateApplicationInput,
} from "../types";
import type { DataClient } from "./client";
import {
  SEED_APPLICATIONS,
  SEED_MATCH_INSIGHTS,
  SEED_PROJECTS,
  SEED_USERS,
} from "./seed";

const STORAGE_KEY = "tactical_collab_demo_v1";

interface MockStore {
  currentUserId: string;
  users: Profile[];
  projects: Project[];
  applications: Application[];
  matchInsights: Record<string, MatchInsight>;
}

function cloneSeedStore(): MockStore {
  return {
    currentUserId: SEED_USERS[0].id, // Default: Creator (Rani)
    users: structuredClone(SEED_USERS),
    projects: structuredClone(SEED_PROJECTS),
    applications: structuredClone(SEED_APPLICATIONS),
    matchInsights: structuredClone(SEED_MATCH_INSIGHTS),
  };
}

function readStore(): MockStore {
  if (typeof window === "undefined") {
    return cloneSeedStore();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = cloneSeedStore();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as MockStore;
  } catch {
    return cloneSeedStore();
  }
}

function writeStore(store: MockStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function enrichProject(project: Project, users: Profile[]): ProjectWithCreator {
  const creator =
    users.find((u) => u.id === project.creatorId) ?? users[0];
  return { ...project, creator };
}

export class MockDataClient implements DataClient {
  readonly mode = "mock" as const;

  async getCurrentUser(): Promise<Profile> {
    const store = readStore();
    return (
      store.users.find((u) => u.id === store.currentUserId) ?? store.users[0]
    );
  }

  async listDemoUsers(): Promise<Profile[]> {
    const store = readStore();
    return store.users;
  }

  async switchDemoUser(userId: string): Promise<Profile> {
    const store = readStore();
    const user = store.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error("Demo user not found");
    }
    store.currentUserId = user.id;
    writeStore(store);
    return user;
  }

  async listProjects(filters?: ProjectFilters): Promise<ProjectWithCreator[]> {
    const store = readStore();
    const query = filters?.query?.trim().toLowerCase() ?? "";
    const skillOrRole = filters?.skillOrRole?.trim().toLowerCase() ?? "";
    const status = filters?.status ?? "open";

    return store.projects
      .filter((project) => {
        if (status !== "all" && project.status !== status) {
          return false;
        }
        if (query && !project.title.toLowerCase().includes(query)) {
          return false;
        }
        if (skillOrRole) {
          const matchesRoleOrSkill = project.roles.some(
            (role) =>
              role.name.toLowerCase().includes(skillOrRole) ||
              role.skills.some((s) => s.toLowerCase().includes(skillOrRole))
          );
          if (!matchesRoleOrSkill) return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map((p) => enrichProject(p, store.users));
  }

  async getProject(id: string): Promise<ProjectWithCreator | null> {
    const store = readStore();
    const project = store.projects.find((p) => p.id === id);
    if (!project) return null;
    return enrichProject(project, store.users);
  }

  async createProject(input: CreateProjectInput): Promise<ProjectWithCreator> {
    const store = readStore();
    const currentUser =
      store.users.find((u) => u.id === store.currentUserId) ?? store.users[0];

    const projectId = `proj-${Date.now()}`;
    const now = new Date().toISOString();

    const roles: Role[] = input.roles.map((r, index) => ({
      id: `role-${Date.now()}-${index}`,
      projectId,
      name: r.name.trim(),
      skills: r.skills.map((s) => s.trim()).filter(Boolean),
      slots: r.slots,
      filled: 0,
    }));

    const newProject: Project = {
      id: projectId,
      creatorId: currentUser.id,
      title: input.title.trim(),
      description: input.description.trim(),
      applyDeadline: input.applyDeadline,
      hoursPerWeek: input.hoursPerWeek,
      weeks: input.weeks,
      status: "open",
      roles,
      createdAt: now,
    };

    store.projects.unshift(newProject);
    writeStore(store);
    return enrichProject(newProject, store.users);
  }

  async createApplication(input: {
    roleId: string;
    pitch: string;
  }): Promise<Application> {
    const store = readStore();
    const currentUser =
      store.users.find((u) => u.id === store.currentUserId) ?? store.users[0];

    let targetProject: Project | undefined;
    let targetRole: Role | undefined;

    for (const p of store.projects) {
      const r = p.roles.find((role) => role.id === input.roleId);
      if (r) {
        targetProject = p;
        targetRole = r;
        break;
      }
    }

    if (!targetProject || !targetRole) {
      throw new Error("Role not found");
    }
    if (targetProject.creatorId === currentUser.id) {
      throw new Error("Creators cannot apply to their own project");
    }
    if (targetProject.status !== "open" || targetRole.filled >= targetRole.slots) {
      throw new Error("This role is no longer accepting applications");
    }

    const duplicate = store.applications.find(
      (a) => a.roleId === input.roleId && a.applicantId === currentUser.id
    );
    if (duplicate) {
      throw new Error("You have already applied to this role");
    }

    const createdAt = new Date();
    const decisionDueAt = new Date(createdAt);
    decisionDueAt.setUTCDate(decisionDueAt.getUTCDate() + 7);

    const application: Application = {
      id: `app-${Date.now()}`,
      roleId: input.roleId,
      applicantId: currentUser.id,
      pitch: input.pitch.trim(),
      powSnapshot: structuredClone(currentUser.powItems),
      status: "pending",
      createdAt: createdAt.toISOString(),
      decisionDueAt: decisionDueAt.toISOString(),
      decidedAt: null,
    };

    store.applications.push(application);

    // Compute & cache MatchInsight (try server /api/match first, fall back to deterministic rules)
    let insight: MatchInsight | null = null;
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: application.id,
          roleSkills: targetRole.skills,
          powItems: application.powSnapshot.map((item) => ({
            id: item.id,
            level: item.level,
            title: item.title,
            summary: item.summary,
            skills: item.skills,
          })),
          pitch: application.pitch,
        }),
      });
      if (res.ok) {
        insight = (await res.json()) as MatchInsight;
      }
    } catch {
      // Fallback to local rules engine below
    }

    if (!insight) {
      insight = computeRulesMatchInsight({
        applicationId: application.id,
        roleSkills: targetRole.skills,
        powItems: application.powSnapshot,
      });
    }

    store.matchInsights[application.id] = insight;
    writeStore(store);
    return application;
  }

  async listApplications(
    projectId: string
  ): Promise<ApplicationWithApplicant[]> {
    const store = readStore();
    const currentUser =
      store.users.find((u) => u.id === store.currentUserId) ?? store.users[0];
    const project = store.projects.find((p) => p.id === projectId);

    if (!project) {
      throw new Error("Project not found");
    }
    if (project.creatorId !== currentUser.id) {
      throw new Error("FORBIDDEN");
    }

    const roleMap = new Map(project.roles.map((r) => [r.id, r]));
    return store.applications
      .filter((app) => roleMap.has(app.roleId))
      .map((app) => {
        const applicant =
          store.users.find((u) => u.id === app.applicantId) ?? store.users[0];
        const role = roleMap.get(app.roleId)!;
        return { ...app, applicant, role };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async updateApplication(
    input: UpdateApplicationInput
  ): Promise<Application> {
    const store = readStore();
    const currentUser =
      store.users.find((u) => u.id === store.currentUserId) ?? store.users[0];
    const appIndex = store.applications.findIndex((a) => a.id === input.id);
    if (appIndex === -1) {
      throw new Error("Application not found");
    }

    const app = store.applications[appIndex];
    const project = store.projects.find((p) =>
      p.roles.some((r) => r.id === app.roleId)
    );
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.creatorId !== currentUser.id) {
      throw new Error("FORBIDDEN");
    }

    if (
      app.status === "accepted" ||
      app.status === "declined" ||
      app.status === "expired"
    ) {
      throw new Error("Finalized application status cannot be changed");
    }

    const now = new Date().toISOString();

    if (input.action === "shortlist") {
      if (app.status !== "pending") {
        throw new Error("Only pending applications can be shortlisted");
      }
      app.status = "shortlisted";
    } else if (input.action === "accept") {
      const role = project.roles.find((r) => r.id === app.roleId);
      if (!role || role.filled >= role.slots) {
        throw new Error("Role has no remaining slots");
      }
      app.status = "accepted";
      app.decidedAt = now;
      role.filled += 1;
      if (project.roles.every((r) => r.filled >= r.slots)) {
        project.status = "filled";
      }
    } else if (input.action === "decline") {
      if (!input.template) {
        throw new Error("A courteous decline reason template is required");
      }
      app.status = "declined";
      app.declineTemplate = input.template;
      app.declineNote = input.note?.trim() || null;
      app.decidedAt = now;
    }

    store.applications[appIndex] = app;
    writeStore(store);
    return app;
  }

  async withdrawApplication(input: {
    id: string;
    reason?: string;
  }): Promise<Application> {
    const store = readStore();
    const currentUser =
      store.users.find((u) => u.id === store.currentUserId) ?? store.users[0];
    const appIndex = store.applications.findIndex(
      (a) => a.id === input.id && a.applicantId === currentUser.id
    );
    if (appIndex === -1) {
      throw new Error("Application not found");
    }
    const app = store.applications[appIndex];
    app.status = "withdrawn";
    app.declineNote = input.reason?.trim() || null;
    app.decidedAt = new Date().toISOString();
    store.applications[appIndex] = app;
    writeStore(store);
    return app;
  }

  async listMyApplications(): Promise<MyApplicationItem[]> {
    const store = readStore();
    const currentUser =
      store.users.find((u) => u.id === store.currentUserId) ?? store.users[0];

    const results: MyApplicationItem[] = [];
    for (const app of store.applications) {
      if (app.applicantId !== currentUser.id) continue;
      for (const project of store.projects) {
        const role = project.roles.find((r) => r.id === app.roleId);
        if (role) {
          results.push({
            ...app,
            project: enrichProject(project, store.users),
            role,
          });
          break;
        }
      }
    }

    return results.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getMatchInsight(applicationId: string): Promise<MatchInsight | null> {
    const store = readStore();
    const cached = store.matchInsights[applicationId];
    if (cached) return cached;

    const app = store.applications.find((a) => a.id === applicationId);
    if (!app) return null;

    const role = store.projects
      .flatMap((p) => p.roles)
      .find((r) => r.id === app.roleId);
    if (!role) return null;

    const computed = computeRulesMatchInsight({
      applicationId: app.id,
      roleSkills: role.skills,
      powItems: app.powSnapshot,
    });
    store.matchInsights[applicationId] = computed;
    writeStore(store);
    return computed;
  }

  async resetDemoData(): Promise<void> {
    const fresh = cloneSeedStore();
    writeStore(fresh);
  }
}
