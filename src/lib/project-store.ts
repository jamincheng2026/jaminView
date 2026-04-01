"use client";

import {projectCards, type ProjectCard} from "@/lib/mocks/projects";

export type StoredProject = {
  id: string;
  name: string;
  description: string;
  status: ProjectCard["status"];
  image: string;
  collaborators: number;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
};

const projectStoreKey = "jaminview:projects";

function seedProjects(): StoredProject[] {
  const now = Date.now();
  return projectCards.map((project, index) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    image: project.image,
    collaborators: project.collaborators,
    createdAt: new Date(now - (index + 7) * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - (index + 1) * 6 * 60 * 60 * 1000).toISOString(),
  }));
}

function ensureProjectStore() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(projectStoreKey);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as StoredProject[];
      if (Array.isArray(parsed)) return parsed;
    } catch {
      window.localStorage.removeItem(projectStoreKey);
    }
  }

  const seeded = seedProjects();
  window.localStorage.setItem(projectStoreKey, JSON.stringify(seeded));
  return seeded;
}

export function readProjectRecords() {
  if (typeof window === "undefined") return seedProjects();
  return ensureProjectStore();
}

export function readProjectRecord(projectId: string) {
  return readProjectRecords().find((project) => project.id === projectId) ?? null;
}

export function writeProjectRecords(projects: StoredProject[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(projectStoreKey, JSON.stringify(projects));
}

export function upsertProjectRecord(
  project: Partial<StoredProject> & Pick<StoredProject, "id" | "name">,
) {
  if (typeof window === "undefined") return;

  const current = ensureProjectStore();
  const existing = current.find((item) => item.id === project.id);
  const nextRecord: StoredProject = {
    id: project.id,
    name: project.name,
    description: project.description ?? existing?.description ?? "Template workspace draft",
    status: project.status ?? existing?.status ?? "DRAFT",
    image: project.image ?? existing?.image ?? "/screen-previews/template-picker.png",
    collaborators: project.collaborators ?? existing?.collaborators ?? 1,
    templateId: project.templateId ?? existing?.templateId,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: project.updatedAt ?? new Date().toISOString(),
  };

  const nextProjects = existing
    ? current.map((item) => (item.id === project.id ? nextRecord : item))
    : [nextRecord, ...current];

  writeProjectRecords(nextProjects);
}

export function projectStatusLabel(status: StoredProject["status"]) {
  if (status === "LIVE") return "LIVE";
  if (status === "ARCHIVED") return "ARCHIVED";
  return "DRAFT";
}

export function formatProjectUpdatedAt(updatedAt: string, locale: string) {
  const diff = Date.now() - new Date(updatedAt).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) {
    const minutes = Math.max(1, Math.round(diff / minute));
    return locale === "zh-CN" ? `${minutes} 分钟前更新` : `updated ${minutes} minutes ago`;
  }

  if (diff < day) {
    const hours = Math.max(1, Math.round(diff / hour));
    return locale === "zh-CN" ? `${hours} 小时前更新` : `updated ${hours} hours ago`;
  }

  const days = Math.max(1, Math.round(diff / day));
  return locale === "zh-CN" ? `${days} 天前更新` : `updated ${days} days ago`;
}
