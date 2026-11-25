import type {
  Application,
  ApplicationWithApplicant,
  CreateProjectInput,
  MatchInsight,
  MyApplicationItem,
  Profile,
  ProjectFilters,
  ProjectWithCreator,
  UpdateApplicationInput,
} from "../types";

export interface DataClient {
  readonly mode: "mock" | "supabase";
  getCurrentUser(): Promise<Profile>;
  listDemoUsers?(): Promise<Profile[]>;
  switchDemoUser?(userId: string): Promise<Profile>;
  listProjects(filters?: ProjectFilters): Promise<ProjectWithCreator[]>;
  getProject(id: string): Promise<ProjectWithCreator | null>;
  createProject(input: CreateProjectInput): Promise<ProjectWithCreator>;
  createApplication(input: {
    roleId: string;
    pitch: string;
  }): Promise<Application>;
  listApplications(projectId: string): Promise<ApplicationWithApplicant[]>;
  updateApplication(input: UpdateApplicationInput): Promise<Application>;
  listMyApplications(): Promise<MyApplicationItem[]>;
  getMatchInsight(applicationId: string): Promise<MatchInsight | null>;
  resetDemoData?(): Promise<void>;
}
