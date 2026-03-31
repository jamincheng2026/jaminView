import {
  BarChart3,
  Building2,
  Cpu,
  Factory,
  Grid2x2,
  Monitor,
  Orbit,
  Presentation,
  Settings2,
  Sparkles,
  Store,
  type LucideIcon,
} from "lucide-react";

export type TemplateCategory = {
  id: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

export type TemplateAsset = {
  id: string;
  name: string;
  industry: string;
  complexity: string;
  charts: string;
  dataSource: string;
  footerLabel: string;
  footerIcon: LucideIcon;
  image: string;
  badge?: string;
  badgeTone?: "primary" | "secondary";
};

export const templateSearchProfileImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDUtzg1ugGiWYlNd6VYPC9rqJl8rMbTtiEzU1qgrMAcHYLOu01dfN3Mh4jVwUs8H_0-ShYTiOtTP6FR0wdTlQNcHE8HyoEF-Ipm0X1TTcqF3IBU9qCY4rPsTt6hC7jCOh8QYbCSKvUvagnrwS-Q_SwwFoRhVyQCeamXeH6BFCaiIekNs_pvhLDKsz-HkR6hqmZVBDGSKNBRP2TJouZ7U4JtRwgrpj8fLv5rDv7PpzPa_MUBrrsZ3vOcDU1FjK35an8rMcM5eaH_-VM7";

export const templateCategories: TemplateCategory[] = [
  { id: "all", label: "All Templates", icon: Grid2x2, active: true },
  { id: "operations", label: "Operations", icon: Factory },
  { id: "sales", label: "Sales & ROI", icon: BarChart3 },
  { id: "city", label: "Smart City", icon: Building2 },
  { id: "iot", label: "Industrial IoT", icon: Cpu },
];

export const utilityCategories: TemplateCategory[] = [
  { id: "custom", label: "My Custom", icon: Sparkles },
  { id: "preferences", label: "Preferences", icon: Settings2 },
];

export const templateAssets: TemplateAsset[] = [
  {
    id: "operations-hub",
    name: "Comprehensive Operation",
    industry: "Manufacturing",
    complexity: "Enterprise",
    charts: "24+ Widgets",
    dataSource: "SQL / API",
    footerLabel: "Optimized for 1920 x 1080",
    footerIcon: Monitor,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBAIfWJ4kqSJqpZzsgMHBCSFHgz8VUQ-5NeMjiojieEqEpZbxd6EaGjLk2g6CspPtftqWnJEYfuxZmBcDzWdcXOrSJavEQjpEW3dh-tY2NOOdeAYBWB50IcZxIpSLnfnTCv5xPFzZdn8_91GkTOZRJzUtBuSrPv69xUpEK0-OaObhzlO8Y3_C_-2GfWjn91zSCDqaFvEERWgU0QciZDwzBsj3btl_eLlE3yFJOUCUBpocvPC-8hp2p9J_2cul1VvkKO6lihyO0o-uIb",
    badge: "Popular",
    badgeTone: "primary",
  },
  {
    id: "sales-analysis",
    name: "Strategic Sales Analysis",
    industry: "Finance & Retail",
    complexity: "Advanced",
    charts: "15+ Dynamic",
    dataSource: "CSV / JSON",
    footerLabel: "Fully Responsive",
    footerIcon: Grid2x2,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDa5UPdEiTw4v9nEr1PZBqUh31NRRUr6IwhWeGMqia3xumGnYKYTNZ8vgNMjySG9lfgjzS5wfzZOQ4TXoV-2kIv4RWlJpNA09N5EZexQG9ZpFXSFn7H1j7vHkKpO9L7nja4ylV2eE02AZAY15ZmOHaCf2pZFEJVYQhUpzXO4qyEUmZQFSqF9scC8xxoa1Lp3XVfclOk1Y89JJuvpw9ew8CmDy514qqyG4Ke9_LONKaKeCc27DI0qA2UctQCKWcavoOtR7-6QmWvjk58",
    badge: "New",
    badgeTone: "secondary",
  },
  {
    id: "urban-control",
    name: "Urban Control Hub",
    industry: "Public Sector",
    complexity: "Immersive 3D",
    charts: "GIS Layers",
    dataSource: "Real-time IoT",
    footerLabel: "Web GL Enabled",
    footerIcon: Orbit,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCnS_-4PMrzeZ9NJaCqVlWBZ4NejsXV5GIyYbJbq1bf52o9jyCCPQab1MXDYqlc3mU9UpBhKFQ7FM3li_L0mNZbS_Ne6l0eodPc2KganD6iK-vmddaBlFA1BscJWVGaTMoZhazAhhwOww0wsJFknDYxZ_sLzplGg646Ru1vqOGg0V4ejJeYUSstG0LLKm3PXohObkHgShNgcqsFnZB3yutZ2tq2VLHEfupeK4J3sYIwmScniB4OdFNhjDT5YR7yUuZEcSqZg_NmChxi",
  },
  {
    id: "boutique-ops",
    name: "Boutique Operations",
    industry: "Luxury Retail",
    complexity: "Standard",
    charts: "Inventory Focus",
    dataSource: "ERP Integration",
    footerLabel: "Multi-location Support",
    footerIcon: Store,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBM-AoWEV36xwMeLYml0KmMosId-l6-DO1HiIaGJTMaWN8euEdu3AHhpAfrKrO6768BTafdsoc1-A70K-EYGuw_qiRT5_O6_coiseOm_GyWb9nbtA7MfdlxgY0CJCv_FuI6UqHT7fzt5YnC8lmqetAJn1ANv7U0asKPEkxQjKunOwDuKJLo8jQ1NJdj9X_66pVvqJb3irWhzerPL0DJwfVpV9axCAt3V6crKKhJTMia7_vY9Zp3kHhwQcQU6pRWSHpn1blPdMrdfazu",
  },
  {
    id: "executive-presentation",
    name: "Executive Presentation",
    industry: "General",
    complexity: "High Impact",
    charts: "KPI Summary",
    dataSource: "Multi-source",
    footerLabel: "Presentation Mode Only",
    footerIcon: Presentation,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCu3zCr36T44i3BuJQBJ5AHKVuNrD8x3eeqOiXLb_JgGM5VrCg91ALoPpWyxddGOcN7LOiigtdKZkssFUW2E6LPICMdcijOnlKWfmrl-g7M5C94llwzaCUOPVGRyLzvHbRru-ijgIgbMdnzz817NSLwhGlX4BUvMmt4YXvgEkD2bQVZEnbTeG6A5a7kX66jk6TlpiOIV1g7geTZ0oqlwlAVuf775iW_ea5gofn6vOXG6lrd2k7h66JMnyIKw567p1t0A7E85F4R-YId",
  },
];
