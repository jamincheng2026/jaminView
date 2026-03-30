import { Bell, Grid2x2, LayoutGrid, Search, Settings, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProjectThumbnail } from "@/components/projects/project-thumbnails";
import { StarterTemplateCards } from "@/components/projects/starter-template-cards";
import { projectCards } from "@/lib/mock-projects";

const thumbnailTone: Record<string, "teal" | "dark" | "network" | "silver"> = {
  "smart-city": "teal",
  "sales-analytics": "dark",
  "iot-device": "network",
  forecast: "silver",
};

export default function ProjectsPage() {
  return (
    <main className="page-shell min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1440px] gap-6 px-5 py-5">
        <aside className="surface-card hidden w-[248px] rounded-[28px] p-4 lg:flex lg:flex-col">
          <div className="border-b border-line px-2 pb-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              JaminView
            </div>
            <div className="mt-3 rounded-2xl bg-brand px-3 py-4 text-white">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">
                Intellectual Atelier
              </div>
              <div className="mt-2 text-lg font-medium">Project Workspace</div>
            </div>
          </div>

          <nav className="mt-4 space-y-1 text-sm">
            <SidebarItem active>Dashboard</SidebarItem>
            <SidebarItem>Team Library</SidebarItem>
            <SidebarItem>Drafts</SidebarItem>
            <SidebarItem>Archived</SidebarItem>
          </nav>

          <Button className="mt-5 w-full justify-start gap-2 rounded-2xl">
            <span className="text-lg leading-none">+</span>
            New Asset
          </Button>

          <div className="mt-auto space-y-1 text-sm">
            <SidebarItem>Help Center</SidebarItem>
          </div>
        </aside>

        <section className="surface-card flex-1 rounded-[32px] px-7 py-6">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
            <div className="flex items-center gap-6">
              <div className="text-xl font-semibold text-foreground">JaminView</div>
              <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
                <span className="text-foreground">Projects</span>
                <span>Assets</span>
                <span>Analytics</span>
                <span>Settings</span>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative min-w-[260px] max-md:hidden">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search projects..." />
              </div>
              <IconButton>
                <Bell className="h-4 w-4" />
              </IconButton>
              <IconButton>
                <Settings className="h-4 w-4" />
              </IconButton>
              <IconButton className="bg-brand text-white">
                <UserRound className="h-4 w-4" />
              </IconButton>
            </div>
          </header>

          <div className="pt-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-[34px] font-semibold tracking-[-0.03em] text-foreground">
                  My Projects
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Manage and orchestrate your visualization workspace.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-2xl border border-line bg-white/50 p-1.5 md:flex">
                  <Button variant="ghost" className="h-8 rounded-xl px-3">
                    Status: All Projects
                  </Button>
                  <Button variant="ghost" className="h-8 rounded-xl px-3">
                    Type: All Sync
                  </Button>
                </div>
                <Button className="gap-2 rounded-2xl px-4">
                  <span className="text-base leading-none">+</span>
                  New Project
                </Button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Status · all projects
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Sort by</span>
                <span className="text-foreground">Last updated</span>
                <div className="flex items-center gap-1 rounded-xl border border-line bg-white/60 p-1">
                  <IconButton className="h-8 w-8 rounded-lg">
                    <LayoutGrid className="h-4 w-4" />
                  </IconButton>
                  <IconButton className="h-8 w-8 rounded-lg">
                    <Grid2x2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-3">
              {projectCards.map((project) => (
                <Card key={project.id} className="overflow-hidden rounded-[22px] p-3">
                  <ProjectThumbnail tone={thumbnailTone[project.id]} />
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-medium text-foreground">
                        {project.name}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {project.description}
                      </div>
                    </div>
                    <Badge
                      className={
                        project.status === "ARCHIVED"
                          ? "border-[#d8d1c4] bg-[#efebe4] text-muted-foreground"
                          : ""
                      }
                    >
                      {project.label}
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-muted-foreground">
                    <span>{project.updatedAt}</span>
                    <span
                      className={`inline-flex h-2.5 w-2.5 rounded-full ${
                        project.status === "LIVE"
                          ? "bg-[#78c687]"
                          : project.status === "DRAFT"
                            ? "bg-[#c8b979]"
                            : "bg-[#d3d0c8]"
                      }`}
                    />
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-10 flex items-center justify-between">
              <div className="text-lg font-medium text-foreground">Start from Template</div>
              <button className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                View all templates
              </button>
            </div>

            <div className="mt-4">
              <StarterTemplateCards />
            </div>

            <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Documentation</span>
                <span>API Reference</span>
                <span>Privacy</span>
              </div>
              <div>© 2026 JaminView Industrial AI. All rights reserved.</div>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function SidebarItem({
  active,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex h-10 items-center rounded-xl px-3 ${
        active
          ? "bg-brand-soft text-brand"
          : "text-muted-foreground hover:bg-white/50"
      }`}
    >
      {children}
    </div>
  );
}

function IconButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white/65 text-foreground ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
