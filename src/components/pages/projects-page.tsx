"use client";

import {useEffect, useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {
  Archive,
  Bell,
  ChevronDown,
  Grid2x2,
  HelpCircle,
  History,
  LayoutDashboard,
  List,
  MoreVertical,
  Search,
  Settings,
  Trash2,
  Users,
} from "lucide-react";

import {StarterTemplateCards} from "@/components/projects/starter-template-cards";
import {Link} from "@/i18n/navigation";
import {LocaleSwitch} from "@/components/ui/locale-switch";
import {
  formatProjectUpdatedAt,
  projectStatusLabel,
  readProjectRecords,
  type StoredProject,
} from "@/lib/project-store";

const profileImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDFxx7547d9uf0b2bexsGHopimCvTA0GV4tD-Rw_4Tn7u_IjiyAN362bh7VmQNWWcjaQW9y8YCHFwgN439wmgInSnjmcIR4lSVkROZ8AUzVzusq5xNKsCJrjkgkffuBeWgSDgSVYR8s41ClbdAhXZg3DmtB0auQH4mGcq1Umew3lHkXPyh__R7M5n6SJdLi2gKCRurcWN5GfnK7eNkFLadljtZdsiQwV8icOjcgc9OCEUpTfonjva2Wq1QQ02X2TJbvO7noE1H1nJYl";

export function ProjectsPage() {
  const t = useTranslations("Projects");
  const locale = useLocale();
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [sortBy, setSortBy] = useState<"updated" | "name" | "created">("updated");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const footerLinks = t.raw("footer.links") as string[];

  useEffect(() => {
    setProjects(readProjectRecords());
    const syncProjects = () => setProjects(readProjectRecords());
    window.addEventListener("storage", syncProjects);
    return () => window.removeEventListener("storage", syncProjects);
  }, []);

  const visibleProjects = useMemo(
    () => {
      const filtered = projects.filter((project) =>
        [project.name, project.description].join(" ").toLowerCase().includes(searchValue.trim().toLowerCase()),
      );

      return [...filtered].sort((left, right) => {
        if (sortBy === "name") {
          return left.name.localeCompare(right.name, locale === "zh-CN" ? "zh-CN" : "en");
        }

        if (sortBy === "created") {
          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        }

        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      });
    },
    [locale, projects, searchValue, sortBy],
  );

  return (
    <main className="min-h-screen bg-[#fafaf5] text-[#1a1c19]">
      <nav className="flex w-full items-center justify-between bg-[#fafaf5] px-6 py-3 font-headline text-sm font-medium text-[#23422a]">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tight text-[#23422a]">JaminView</span>
          <div className="hidden items-center gap-6 md:flex">
            <span className="border-b-2 border-[#23422a] pb-1 text-[#23422a]">{t("nav.projects")}</span>
            <span className="text-[#424842] transition-colors hover:text-[#23422a]">{t("nav.assets")}</span>
            <span className="text-[#424842] transition-colors hover:text-[#23422a]">{t("nav.analytics")}</span>
            <span className="text-[#424842] transition-colors hover:text-[#23422a]">{t("nav.settings")}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <LocaleSwitch />
          <TopIconButton>
            <Bell className="h-5 w-5" strokeWidth={1.8} />
          </TopIconButton>
          <TopIconButton>
            <Settings className="h-5 w-5" strokeWidth={1.8} />
          </TopIconButton>
          <div className="ml-2 h-8 w-8 overflow-hidden rounded-full bg-[#e3e3de]">
            <img src={profileImage} alt="User Profile" className="h-full w-full object-cover" />
          </div>
        </div>
      </nav>
      <div className="h-px w-full bg-[#f4f4ef]" />

      <div className="flex min-h-[calc(100vh-57px)]">
        <aside className="hidden w-64 flex-col border-r border-[#e3e3de] bg-[#f4f4ef] py-6 lg:flex">
          <div className="mb-8 flex items-center gap-3 px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#23422a] text-white">
              <Grid2x2 className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <div>
              <h2 className="font-headline text-sm font-black uppercase tracking-tight text-[#23422a]">
                {t("sidebar.title")}
              </h2>
              <p className="text-[10px] leading-none text-[#424842]">{t("sidebar.subtitle")}</p>
            </div>
          </div>

          <div className="space-y-1 px-2">
            <SideItem icon={LayoutDashboard} active>
              {t("sidebar.dashboard")}
            </SideItem>
            <SideItem icon={Users}>{t("sidebar.teamLibrary")}</SideItem>
            <SideItem icon={History}>{t("sidebar.recent")}</SideItem>
            <SideItem icon={Archive}>{t("sidebar.archived")}</SideItem>
            <SideItem icon={Trash2}>{t("sidebar.trash")}</SideItem>
          </div>

          <div className="mt-8 px-4">
            <Link
              href="/projects/new"
              className="flex w-full items-center justify-center gap-2 rounded bg-[#23422a] py-2.5 font-headline text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#3a5a40]"
            >
              <span className="text-base leading-none">+</span>
              {t("sidebar.newAsset")}
            </Link>
          </div>

          <div className="mt-auto px-2">
            <SideItem icon={HelpCircle}>{t("sidebar.helpCenter")}</SideItem>
          </div>
        </aside>

        <section className="flex-1 overflow-y-auto bg-[#fafaf5] px-8 py-10">
          <div className="mx-auto max-w-7xl space-y-8">
            <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="space-y-1">
                <h1 className="font-headline text-4xl font-extrabold tracking-tight text-[#23422a]">
                  {t("header.title")}
                </h1>
                <p className="text-sm text-[#424842]">{t("header.description")}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#727971]" />
                  <input
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    className="w-64 rounded border-none bg-[#eeeee9] py-2.5 pl-10 pr-4 text-sm text-[#1a1c19] outline-none ring-0 transition-all focus:ring-2 focus:ring-[#23422a]/15"
                    placeholder={t("header.searchPlaceholder")}
                    type="text"
                  />
                </div>
                <Link
                  href="/projects/new"
                  className="flex items-center gap-2 rounded bg-[#23422a] px-6 py-2.5 font-headline text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-95"
                >
                  <span className="text-base leading-none">⊕</span>
                  {t("header.newProject")}
                </Link>
              </div>
            </header>

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e3e3de] py-4">
              <div className="flex items-center gap-4">
                <FilterPill label={t("toolbar.status")} value={t("toolbar.allProjects")} />
                <FilterPill label={t("toolbar.type")} value={t("toolbar.allTypes")} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-headline text-xs font-bold uppercase tracking-wider text-[#424842]">
                  {t("toolbar.sortBy")}
                </span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as "updated" | "name" | "created")}
                  className="cursor-pointer border-none bg-transparent text-xs text-[#1a1c19] outline-none"
                >
                  <option value="updated">{t("toolbar.lastUpdated")}</option>
                  <option value="name">{t("toolbar.nameAZ")}</option>
                  <option value="created">{t("toolbar.creationDate")}</option>
                </select>
                <div className="flex items-center rounded bg-[#e8e8e3] p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`rounded p-1.5 ${viewMode === "grid" ? "bg-white text-[#23422a] shadow-sm" : "text-[#424842]"}`}
                  >
                    <Grid2x2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 ${viewMode === "list" ? "rounded bg-white text-[#23422a] shadow-sm" : "text-[#424842]"}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className={viewMode === "grid" ? "grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
              {visibleProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/editor/${project.id}`}
                  className={`group overflow-hidden rounded-lg border border-transparent bg-[#f4f4ef] transition-all duration-300 hover:border-[#c2c8bf]/30 ${
                    project.status === "ARCHIVED" ? "opacity-80" : ""
                  } ${viewMode === "grid" ? "flex flex-col" : "flex items-stretch gap-4"}`}
                >
                  <div
                    className={`relative overflow-hidden ${
                      project.status === "ARCHIVED" ? "grayscale group-hover:grayscale-0" : ""
                    } ${viewMode === "grid" ? "h-48" : "h-auto w-72 shrink-0"}`}
                  >
                    <img
                      src={project.image}
                      alt={project.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 flex items-center gap-2">
                      <span className={statusClass(project.status)}>{projectStatusLabel(project.status)}</span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h3 className="font-headline text-lg font-bold leading-tight text-[#23422a]">
                          {project.name}
                        </h3>
                        <p className="mt-1 text-xs text-[#424842]">{project.description}</p>
                      </div>
                      <span className="rounded p-1 text-[#424842]">
                        <MoreVertical className="h-5 w-5 text-[#424842]" />
                      </span>
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t border-[#e8e8e3]/80 pt-4 text-[11px] text-[#727971]">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">◷</span>
                        <span>{formatProjectUpdatedAt(project.updatedAt, locale)}</span>
                      </div>
                      <div className="flex -space-x-2">
                        <div className="h-6 w-6 rounded-full border-2 border-[#fafaf5] bg-[#e3e3de]" />
                        {project.collaborators > 1 ? (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#fafaf5] bg-[#c1eebc] text-[8px] font-bold text-[#23422a]">
                            +{project.collaborators}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-20 space-y-6">
              <div className="flex items-center justify-between border-b border-[#e3e3de] pb-4">
                <h2 className="font-headline text-xl font-bold tracking-tight text-[#23422a]">
                  {t("templates.title")}
                </h2>
                <button className="font-headline text-xs font-bold uppercase tracking-widest text-[#23422a] hover:underline">
                  {t("templates.action")}
                </button>
              </div>
              <StarterTemplateCards />
            </div>
          </div>

          <footer className="mx-auto mt-24 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-[#e3e3de] pt-8 font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-[#727971] md:flex-row">
            <div className="flex items-center gap-6">
              {footerLinks.map((link) => (
                <span key={link} className="transition-colors hover:text-[#23422a]">
                  {link}
                </span>
              ))}
            </div>
            <span>{t("footer.copyright")}</span>
          </footer>
        </section>
      </div>
    </main>
  );
}

function statusClass(status: "LIVE" | "DRAFT" | "ARCHIVED") {
  if (status === "LIVE") {
    return "rounded bg-[#23422a] px-2 py-1 font-headline text-[10px] font-bold tracking-widest text-white";
  }

  if (status === "ARCHIVED") {
    return "rounded bg-[#727971] px-2 py-1 font-headline text-[10px] font-bold tracking-widest text-white";
  }

  return "rounded bg-[#e3e3de] px-2 py-1 font-headline text-[10px] font-bold tracking-widest text-[#424842]";
}

function SideItem({
  active,
  children,
  icon: Icon,
}: {
  active?: boolean;
  children: React.ReactNode;
  icon: React.ComponentType<{className?: string; strokeWidth?: number}>;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 transition-all duration-300 ${
        active
          ? "rounded-r-lg bg-[#e3e3de] font-semibold text-[#23422a]"
          : "text-[#424842] hover:bg-[#e8e8e3]"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.9} />
      <span>{children}</span>
    </div>
  );
}

function TopIconButton({children}: {children: React.ReactNode}) {
  return (
    <button className="rounded-full p-2 transition-colors duration-200 hover:bg-[#e8e8e3] active:scale-[0.98]">
      {children}
    </button>
  );
}

function FilterPill({label, value}: {label: string; value: string}) {
  return (
    <div className="flex cursor-pointer items-center gap-2 rounded bg-[#f4f4ef] px-3 py-1.5 transition-colors hover:bg-[#e8e8e3]">
      <span className="font-headline text-xs font-bold uppercase tracking-wider text-[#424842]">
        {label}
      </span>
      <span className="text-xs text-[#1a1c19]">{value}</span>
      <ChevronDown className="h-3.5 w-3.5 text-[#727971]" />
    </div>
  );
}
