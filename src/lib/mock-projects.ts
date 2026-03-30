export type ProjectCard = {
  id: string;
  name: string;
  description: string;
  label: string;
  updatedAt: string;
  status: "LIVE" | "DRAFT" | "ARCHIVED";
};

export type StarterTemplate = {
  id: string;
  name: string;
  subtitle: string;
  tone: "neutral" | "map" | "grid";
};

export const projectCards: ProjectCard[] = [
  {
    id: "smart-city",
    name: "Smart City Ops v2",
    description: "Temperature + urban monitoring",
    label: "LIVE",
    updatedAt: "updated 2 hours ago",
    status: "LIVE",
  },
  {
    id: "sales-analytics",
    name: "Sales Analytics Dashboard",
    description: "Quarterly project",
    label: "START",
    updatedAt: "updated 3 days ago",
    status: "DRAFT",
  },
  {
    id: "iot-device",
    name: "IoT Device Network",
    description: "Template network topology",
    label: "LIVE",
    updatedAt: "updated 1 week ago",
    status: "LIVE",
  },
  {
    id: "forecast",
    name: "Financial Forecast Q1",
    description: "Custom project",
    label: "ARCHIVED",
    updatedAt: "updated 2 months ago",
    status: "ARCHIVED",
  },
];

export const starterTemplates: StarterTemplate[] = [
  {
    id: "blank",
    name: "Blank Canvas",
    subtitle: "Start from scratch with V1 canvas",
    tone: "neutral",
  },
  {
    id: "executive",
    name: "Executive Dashboard",
    subtitle: "High-density KPI workbench",
    tone: "grid",
  },
  {
    id: "logistics",
    name: "Logistics Tracker",
    subtitle: "Track flow, supply chain and assets",
    tone: "map",
  },
  {
    id: "research",
    name: "Scientific Research",
    subtitle: "Advanced lab operator view",
    tone: "grid",
  },
];
