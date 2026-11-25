import type { DataClient } from "./client";

/**
 * Placeholder Supabase DataClient (PRD Section 6).
 * To be wired to Jenar's Supabase tables & RLS policies when NEXT_PUBLIC_DATA_SOURCE=supabase.
 */
export class SupabaseDataClient implements DataClient {
  readonly mode = "supabase" as const;

  private notReady(): never {
    throw new Error(
      "Supabase DataClient is not configured yet. Set NEXT_PUBLIC_DATA_SOURCE=mock in .env.local."
    );
  }

  async getCurrentUser() {
    return this.notReady();
  }
  async listProjects() {
    return this.notReady();
  }
  async getProject() {
    return this.notReady();
  }
  async createProject() {
    return this.notReady();
  }
  async createApplication() {
    return this.notReady();
  }
  async listApplications() {
    return this.notReady();
  }
  async updateApplication() {
    return this.notReady();
  }
  async listMyApplications() {
    return this.notReady();
  }
  async getMatchInsight() {
    return this.notReady();
  }
}
