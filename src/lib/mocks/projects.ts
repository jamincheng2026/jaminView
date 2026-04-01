export type ProjectCard = {
  id: string;
  name: string;
  description: string;
  label: string;
  updatedAt: string;
  status: "LIVE" | "DRAFT" | "ARCHIVED";
  image: string;
  collaborators: number;
};

export const projectCards: ProjectCard[] = [
  {
    id: "smart-city",
    name: "Smart City Ops v2",
    description: "Temperature + urban monitoring",
    label: "LIVE",
    updatedAt: "updated 2 hours ago",
    status: "LIVE",
    image: "/screen-previews/editor.png",
    collaborators: 3,
  },
  {
    id: "sales-analytics",
    name: "Sales Analytics Dashboard",
    description: "Quarterly project",
    label: "DRAFT",
    updatedAt: "updated 3 days ago",
    status: "DRAFT",
    image: "/screen-previews/template-picker.png",
    collaborators: 2,
  },
  {
    id: "iot-device",
    name: "IoT Device Network",
    description: "Template network topology",
    label: "LIVE",
    updatedAt: "updated 1 week ago",
    status: "LIVE",
    image: "/screen-previews/projects.png",
    collaborators: 4,
  },
  {
    id: "forecast",
    name: "Financial Forecast Q1",
    description: "Custom project",
    label: "ARCHIVED",
    updatedAt: "updated 2 months ago",
    status: "ARCHIVED",
    image: "/screen-previews/login.png",
    collaborators: 1,
  },
];
