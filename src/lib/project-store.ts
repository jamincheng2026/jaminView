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
const projectStoreEvent = "jaminview:projects:updated";
let cachedProjectRecords: StoredProject[] | null = null;
let cachedServerProjectRecords: StoredProject[] | null = null;

function cloneProjectRecords(projects: StoredProject[]) {
  if (typeof structuredClone === "function") {
    return structuredClone(projects);
  }

  return JSON.parse(JSON.stringify(projects)) as StoredProject[];
}

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

function getServerProjectRecords() {
  if (!cachedServerProjectRecords) {
    cachedServerProjectRecords = seedProjects();
  }

  return cachedServerProjectRecords;
}

function syncProjectStoreFromStorage() {
  if (typeof window === "undefined") {
    return getServerProjectRecords();
  }

  const raw = window.localStorage.getItem(projectStoreKey);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as StoredProject[];
      if (Array.isArray(parsed)) {
        cachedProjectRecords = parsed;
        return cachedProjectRecords;
      }
    } catch {
      window.localStorage.removeItem(projectStoreKey);
    }
  }

  cachedProjectRecords = cloneProjectRecords(seedProjects());
  window.localStorage.setItem(projectStoreKey, JSON.stringify(cachedProjectRecords));
  return cachedProjectRecords;
}

function ensureProjectStore() {
  if (typeof window === "undefined") {
    return getServerProjectRecords();
  }

  if (cachedProjectRecords) {
    return cachedProjectRecords;
  }

  return syncProjectStoreFromStorage();
}

export function readProjectRecords() {
  if (typeof window === "undefined") return getServerProjectRecords();
  return ensureProjectStore();
}

export function readProjectRecord(projectId: string) {
  return readProjectRecords().find((project) => project.id === projectId) ?? null;
}

export function writeProjectRecords(projects: StoredProject[]) {
  if (typeof window === "undefined") return;
  cachedProjectRecords = cloneProjectRecords(projects);
  window.localStorage.setItem(projectStoreKey, JSON.stringify(cachedProjectRecords));
  window.dispatchEvent(new Event(projectStoreEvent));
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

export function subscribeProjectRecords(onChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== projectStoreKey) return;
    syncProjectStoreFromStorage();
    onChange();
  };

  const handleProjectStoreUpdate = () => {
    onChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(projectStoreEvent, handleProjectStoreUpdate);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(projectStoreEvent, handleProjectStoreUpdate);
  };
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
