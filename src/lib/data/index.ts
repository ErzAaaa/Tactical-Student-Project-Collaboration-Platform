import type { DataClient } from "./client";
import { MockDataClient } from "./mockClient";
import { SupabaseDataClient } from "./supabaseClient";

const source =
  process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase" ? "supabase" : "mock";

export const dataClient: DataClient =
  source === "supabase" ? new SupabaseDataClient() : new MockDataClient();
