export type Status = "development" | "stable" | "paused" | "archived";
export type TestStatus = "running" | "completed" | "failed";

export const projects: {
  id: string;
  name: string;
  category: string;
  status: Status;
  version: string;
  description: string;
  tech: string[];
  goal: string;
  updatedAt: string;
}[] = [];

export const solutions: {
  id: string;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  updatedAt: string;
}[] = [];

export const labTests: {
  id: string;
  name: string;
  environment: string;
  status: TestStatus;
  result: string;
  category: string;
  updatedAt: string;
}[] = [];

export const scripts: {
  id: string;
  name: string;
  language: string;
  description: string;
  code: string;
}[] = [];

export const docs: {
  id: string;
  title: string;
  category: string;
  summary: string;
}[] = [];

export const tools: {
  id: string;
  name: string;
  category: string;
  url: string;
  description: string;
  favorite: boolean;
}[] = [];

export const ideas: {
  id: string;
  title: string;
  priority: string;
  status: string;
  description: string;
}[] = [];

export const recentActivity: {
  time: string;
  type: string;
  title: string;
  detail: string;
}[] = [];
