import type {
  Application,
  MatchInsight,
  Profile,
  Project,
} from "../types";

function daysFromNowIso(days: number): string {
  const date = new Date("2026-11-25T12:00:00.000Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export const SEED_USERS: Profile[] = [
  {
    id: "user-rani",
    name: "Rani Kusuma",
    faculty: "School of Electrical Engineering & Informatics",
    githubUsername: "ranikusuma-demo",
    reliability: {
      score: 94,
      commitmentsCount: 4,
      completionRate: 100,
    },
    responseRate: 96,
    demoRoleLabel: "Creator (Rani)",
    powItems: [
      {
        id: "pow-rani-1",
        kind: "github",
        title: "campus-bus-tracker",
        url: "https://github.com/example/campus-bus-tracker",
        level: "verified",
        summary: "Next.js & TypeScript transit tracker built for campus mobility.",
        skills: ["React", "TypeScript", "Next.js"],
      },
    ],
  },
  {
    id: "user-dimas",
    name: "Dimas Pratama",
    faculty: "Faculty of Art & Design",
    githubUsername: "dimas-ui-demo",
    reliability: {
      score: 91,
      commitmentsCount: 3,
      completionRate: 100,
    },
    responseRate: 92,
    demoRoleLabel: "Applicant (Dimas)",
    powItems: [
      {
        id: "pow-dimas-1",
        kind: "figma",
        title: "StudySync Mobile Wireframes & Design System",
        url: "https://figma.com/file/example-studysync",
        level: "self_declared",
        summary: "Interactive Figma prototype with 24 screens and component tokens.",
        skills: ["UI/UX", "Figma", "Prototyping", "Design Systems"],
      },
      {
        id: "pow-dimas-2",
        kind: "github",
        title: "accessible-campus-map",
        url: "https://github.com/example/accessible-campus-map",
        level: "verified",
        summary: "Frontend accessibility audit & Tailwind UI kit for campus map.",
        skills: ["HTML/CSS", "Tailwind", "Accessibility", "UI/UX"],
      },
    ],
  },
  {
    id: "user-sari",
    name: "Sari Wulandari",
    faculty: "Faculty of Computer Science",
    githubUsername: "sariw-dev",
    reliability: {
      score: 96,
      commitmentsCount: 5,
      completionRate: 100,
    },
    responseRate: 98,
    demoRoleLabel: "Applicant A (Sari)",
    powItems: [
      {
        id: "pow-sari-1",
        kind: "github",
        title: "smart-kantin-web",
        url: "https://github.com/example/smart-kantin-web",
        level: "verified",
        summary: "Production Next.js + TypeScript ordering app with Tailwind CSS.",
        skills: ["React", "Next.js", "TypeScript", "Tailwind"],
      },
      {
        id: "pow-sari-2",
        kind: "figma",
        title: "Smart Kantin Component Library",
        url: "https://figma.com/file/example-kantin",
        level: "self_declared",
        summary: "Design tokens and responsive grid layouts for desktop and 360px.",
        skills: ["UI/UX", "Figma"],
      },
    ],
  },
  {
    id: "user-budi",
    name: "Budi Santoso",
    faculty: "Faculty of Industrial Technology",
    reliability: {
      score: null,
      commitmentsCount: 1,
      completionRate: null,
    },
    responseRate: 80,
    demoRoleLabel: "Applicant B (Budi)",
    powItems: [
      {
        id: "pow-budi-1",
        kind: "drive",
        title: "Course Project Slide Deck",
        url: "https://drive.google.com/file/d/example-deck",
        level: "self_declared",
        summary: "User research summary and low-fidelity wireframe sketches.",
        skills: ["User Research", "UI/UX"],
      },
    ],
  },
  {
    id: "user-nadia",
    name: "Nadia Putri",
    faculty: "School of Business & Management",
    reliability: {
      score: 88,
      commitmentsCount: 2,
      completionRate: 100,
    },
    responseRate: 85,
    demoRoleLabel: "Applicant C (Nadia)",
    powItems: [],
  },
];

export const SEED_PROJECTS: Project[] = [
  {
    id: "proj-stack-sync",
    creatorId: "user-rani",
    title: "Campus Waste & Carbon Micro-Tracker (STACK Hackathon)",
    description:
      "Building a lightweight web app for students to log daily sustainable habits during finals week. Looking for collaborators ready for a 3-week sprint ahead of demo day.",
    applyDeadline: daysFromNowIso(6),
    hoursPerWeek: 8,
    weeks: 3,
    status: "open",
    createdAt: daysFromNowIso(-4),
    roles: [
      {
        id: "role-stack-uiux",
        projectId: "proj-stack-sync",
        name: "UI/UX",
        skills: ["UI/UX", "Figma", "Prototyping"],
        slots: 1,
        filled: 0,
      },
      {
        id: "role-stack-fe",
        projectId: "proj-stack-sync",
        name: "Frontend",
        skills: ["React", "Next.js", "TypeScript", "Tailwind"],
        slots: 2,
        filled: 0,
      },
    ],
  },
  {
    id: "proj-lab-scheduler",
    creatorId: "user-rani",
    title: "Open Lab Equipment Booking Portal",
    description:
      "Replacing manual spreadsheet sign-ups for engineering lab equipment with a clean calendar & conflict checker.",
    applyDeadline: daysFromNowIso(10),
    hoursPerWeek: 6,
    weeks: 4,
    status: "open",
    createdAt: daysFromNowIso(-6),
    roles: [
      {
        id: "role-lab-fe",
        projectId: "proj-lab-scheduler",
        name: "Frontend",
        skills: ["React", "TypeScript", "Tailwind"],
        slots: 1,
        filled: 0,
      },
      {
        id: "role-lab-be",
        projectId: "proj-lab-scheduler",
        name: "Backend",
        skills: ["PostgreSQL", "Node.js", "REST API"],
        slots: 1,
        filled: 0,
      },
    ],
  },
  {
    id: "proj-study-buddy",
    creatorId: "user-dimas",
    title: "Peer Thesis Writing Accountability Group",
    description:
      "Weekly structured check-in tool for final-year students to share chapter milestones and get peer feedback.",
    applyDeadline: daysFromNowIso(12),
    hoursPerWeek: 5,
    weeks: 6,
    status: "open",
    createdAt: daysFromNowIso(-2),
    roles: [
      {
        id: "role-thesis-uiux",
        projectId: "proj-study-buddy",
        name: "UI/UX",
        skills: ["UI/UX", "User Research", "Figma"],
        slots: 1,
        filled: 0,
      },
    ],
  },
  {
    id: "proj-career-fair",
    creatorId: "user-sari",
    title: "Student Career Fair Booth Navigator",
    description:
      "Interactive floor map and company filter for the upcoming spring campus career fair.",
    applyDeadline: daysFromNowIso(4),
    hoursPerWeek: 10,
    weeks: 2,
    status: "filled",
    createdAt: daysFromNowIso(-10),
    roles: [
      {
        id: "role-fair-fe",
        projectId: "proj-career-fair",
        name: "Frontend",
        skills: ["Next.js", "Tailwind"],
        slots: 1,
        filled: 1,
      },
    ],
  },
  {
    id: "proj-archive-notes",
    creatorId: "user-rani",
    title: "Open Courseware Lecture Notes Index",
    description:
      "Searchable archive of student-contributed lecture summaries and past exam walkthroughs.",
    applyDeadline: daysFromNowIso(-2),
    hoursPerWeek: 4,
    weeks: 5,
    status: "closed",
    createdAt: daysFromNowIso(-14),
    roles: [
      {
        id: "role-archive-uiux",
        projectId: "proj-archive-notes",
        name: "UI/UX",
        skills: ["UI/UX", "Accessibility"],
        slots: 1,
        filled: 0,
      },
    ],
  },
];

export const SEED_APPLICATIONS: Application[] = [
  // Main project (proj-stack-sync) has 3 pending applicants for Rani's decision flow
  {
    id: "app-sari-1",
    roleId: "role-stack-fe",
    applicantId: "user-sari",
    pitch:
      "I built Smart Kantin using Next.js, TypeScript, and Tailwind. Available 8 hrs/week and excited to ship the frontend sprint.",
    powSnapshot: SEED_USERS[2].powItems,
    status: "pending",
    createdAt: daysFromNowIso(-1),
    decisionDueAt: daysFromNowIso(6),
    decidedAt: null,
  },
  {
    id: "app-budi-1",
    roleId: "role-stack-uiux",
    applicantId: "user-budi",
    pitch:
      "I led user interviews for our industrial design studio and want to help shape the habit-logging flow.",
    powSnapshot: SEED_USERS[3].powItems,
    status: "pending",
    createdAt: daysFromNowIso(-2),
    decisionDueAt: daysFromNowIso(5),
    decidedAt: null,
  },
  {
    id: "app-nadia-1",
    roleId: "role-stack-uiux",
    applicantId: "user-nadia",
    pitch:
      "Interested in joining as a UI/UX contributor. I can assist with user testing and copywriting during the 3-week sprint.",
    powSnapshot: SEED_USERS[4].powItems,
    status: "pending",
    createdAt: daysFromNowIso(-3),
    decisionDueAt: daysFromNowIso(4), // "Auto-closes in 4 days"
    decidedAt: null,
  },
  // Simulated auto-closed application on closed project so Simulated state is visible
  {
    id: "app-budi-expired",
    roleId: "role-archive-uiux",
    applicantId: "user-budi",
    pitch: "Happy to organize the lecture notes taxonomy and accessibility checks.",
    powSnapshot: SEED_USERS[3].powItems,
    status: "expired",
    createdAt: daysFromNowIso(-12),
    decisionDueAt: daysFromNowIso(-5),
    decidedAt: null,
  },
];

export const SEED_MATCH_INSIGHTS: Record<string, MatchInsight> = {
  "app-sari-1": {
    applicationId: "app-sari-1",
    band: "strong",
    evidenced: [
      {
        skill: "React",
        level: "verified",
        evidenceIds: ["pow-sari-1"],
      },
      {
        skill: "Next.js",
        level: "verified",
        evidenceIds: ["pow-sari-1"],
      },
      {
        skill: "TypeScript",
        level: "verified",
        evidenceIds: ["pow-sari-1"],
      },
      {
        skill: "Tailwind",
        level: "verified",
        evidenceIds: ["pow-sari-1"],
      },
    ],
    missing: [],
    explanation:
      "All 4 required Frontend skills are evidenced by a verified GitHub repository (smart-kantin-web).",
    source: "rules+llm",
    model: "precomputed-seed",
    status: "ok",
    generatedAt: daysFromNowIso(-1),
    precomputed: true,
  },
  "app-budi-1": {
    applicationId: "app-budi-1",
    band: "limited",
    evidenced: [
      {
        skill: "UI/UX",
        level: "self_declared",
        evidenceIds: ["pow-budi-1"],
      },
    ],
    missing: ["Figma", "Prototyping"],
    explanation:
      "1 of 3 required UI/UX skills (UI/UX) has self-declared evidence; Figma and Prototyping are not evidenced.",
    source: "rules+llm",
    model: "precomputed-seed",
    status: "ok",
    generatedAt: daysFromNowIso(-2),
    precomputed: true,
  },
  "app-nadia-1": {
    applicationId: "app-nadia-1",
    band: "limited",
    evidenced: [],
    missing: ["UI/UX", "Figma", "Prototyping"],
    explanation:
      "No Proof-of-Work items were attached to this application snapshot.",
    source: "rules",
    model: null,
    status: "ok",
    generatedAt: daysFromNowIso(-3),
    precomputed: true,
  },
};
