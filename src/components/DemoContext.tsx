"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { dataClient } from "@/lib/data";
import type { Profile } from "@/lib/types";

interface DemoContextValue {
  currentUser: Profile | null;
  demoUsers: Profile[];
  loadingUser: boolean;
  switchUser: (userId: string) => Promise<void>;
  resetDemo: () => Promise<void>;
  dataVersion: number;
  bumpDataVersion: () => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [demoUsers, setDemoUsers] = useState<Profile[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);

  const loadUsers = useCallback(async () => {
    try {
      const [user, users] = await Promise.all([
        dataClient.getCurrentUser(),
        dataClient.listDemoUsers ? dataClient.listDemoUsers() : Promise.resolve([]),
      ]);
      setCurrentUser(user);
      setDemoUsers(users);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const switchUser = useCallback(async (userId: string) => {
    if (!dataClient.switchDemoUser) return;
    const next = await dataClient.switchDemoUser(userId);
    setCurrentUser(next);
    setDataVersion((v) => v + 1);
  }, []);

  const resetDemo = useCallback(async () => {
    if (dataClient.resetDemoData) {
      await dataClient.resetDemoData();
      await loadUsers();
      setDataVersion((v) => v + 1);
    }
  }, [loadUsers]);

  const bumpDataVersion = useCallback(() => {
    setDataVersion((v) => v + 1);
  }, []);

  return (
    <DemoContext.Provider
      value={{
        currentUser,
        demoUsers,
        loadingUser,
        switchUser,
        resetDemo,
        dataVersion,
        bumpDataVersion,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    throw new Error("useDemo must be used within DemoProvider");
  }
  return ctx;
}
