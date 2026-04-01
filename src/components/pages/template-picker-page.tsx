"use client";

import {useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {
  Bell,
  ChevronDown,
  Grid2x2,
  Info,
  List,
  PlusCircle,
  Search,
  Settings2,
} from "lucide-react";

import {
  templateAssets,
  templateCategories,
  templateSearchProfileImage,
  utilityCategories,
} from "@/lib/mocks/template-picker";
import {LocaleSwitch} from "@/components/ui/locale-switch";
import {createProjectId} from "@/lib/project-utils";
import {upsertProjectRecord} from "@/lib/project-store";

export function TemplatePickerPage() {
  const t = useTranslations("TemplatePicker");
  const locale = useLocale();
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedTemplateId, setSelectedTemplateId] = useState(templateAssets[0]?.id ?? "");
  const localizedTemplates = useMemo(
    () => templateAssets.map((template) => localizeTemplate(template, locale)),
    [locale],
  );
  const selectedTemplate = useMemo(
    () => localizedTemplates.find((template) => template.id === selectedTemplateId) ?? localizedTemplates[0],
    [localizedTemplates, selectedTemplateId],
  );
  const visibleTemplates = useMemo(
    () =>
      localizedTemplates.filter((template) => {
        const categoryMatch =
          activeCategory === "all" || resolveTemplateCategory(template.id) === activeCategory;
        const searchKeyword = searchValue.trim().toLowerCase();
        const searchMatch =
          !searchKeyword ||
          [template.name, template.industry, template.complexity, template.dataSource]
            .join(" ")
            .toLowerCase()
            .includes(searchKeyword);

        return categoryMatch && searchMatch;
      }),
    [activeCategory, localizedTemplates, searchValue],
  );

  const startBuilding = () => {
    if (!selectedTemplate) return;
    const name = projectName.trim() || selectedTemplate.name;
    const projectId = createProjectId(name, selectedTemplate.id);
    const nextSearch = new URLSearchParams({
      template: selectedTemplate.id,
      name,
    });

    upsertProjectRecord({
      id: projectId,
      name,
      templateId: selectedTemplate.id,
      image: selectedTemplate.image,
      description: locale === "zh-CN" ? "模板项目草稿" : "Template workspace draft",
      status: "DRAFT",
      updatedAt: new Date().toISOString(),
    });

    router.push(`/${locale}/editor/${projectId}?${nextSearch.toString()}`);
  };

  const handleTemplateSelect = (templateId: string, templateName: string) => {
    setSelectedTemplateId(templateId);
    if (!projectName.trim()) {
      setProjectName(templateName);
    }
  };

  return (
    <main className="min-h-screen bg-[#fafaf5] text-[#1a1c19]">
      <nav className="flex h-16 items-center justify-between border-b border-[#c2c8bf]/30 bg-[#fafaf5] px-6 font-headline text-sm tracking-wide">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tight text-[#23422a]">JaminView</span>
          <div className="hidden items-center gap-6 md:flex">
            <span className="font-medium text-[#424842]">{t("nav.projects")}</span>
            <span className="border-b-2 border-[#23422a] pb-1 font-bold text-[#23422a]">
              {t("nav.templates")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <LocaleSwitch />
          <div className="hidden h-9 items-center rounded-full bg-[#eeeee9] px-3 md:flex">
            <Search className="mr-2 h-4 w-4 text-[#727971]" />
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="w-48 border-none bg-transparent p-0 text-xs outline-none placeholder:text-[#727971]"
              placeholder={t("nav.searchPlaceholder")}
              type="text"
            />
          </div>
          <IconCircleButton>
            <Bell className="h-5 w-5" />
          </IconCircleButton>
          <div className="h-8 w-8 overflow-hidden rounded-full border border-[#c2c8bf]/30 bg-[#e3e3de]">
            <img
              src={templateSearchProfileImage}
              alt="User Profile"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </nav>

      <main className="flex min-h-[calc(100vh-4rem)] overflow-hidden">
        <aside className="hidden w-64 shrink-0 border-r border-[#c2c8bf]/30 bg-[#f4f4ef] px-4 py-6 lg:flex lg:flex-col">
          <div className="mb-8 px-2">
            <h3 className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#23422a]">
              {t("sidebar.title")}
            </h3>
            <p className="text-[11px] font-medium text-[#727971]">{t("sidebar.subtitle")}</p>
          </div>

          <nav className="space-y-1">
            {templateCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                  activeCategory === category.id
                    ? "bg-[#e3e3de] font-semibold text-[#23422a]"
                    : "text-[#424842] hover:bg-[#e8e8e3]"
                }`}
              >
                <category.icon className="h-4 w-4" strokeWidth={1.9} />
                <span className="text-sm">{categoryLabel(category.id, locale)}</span>
              </button>
            ))}
          </nav>

          <div className="mt-6 space-y-1 border-t border-[#c2c8bf]/30 pt-6">
            {utilityCategories.map((category) => (
              <div
                key={category.id}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[#424842]"
              >
                <category.icon className="h-4 w-4" strokeWidth={1.9} />
                <span className="text-sm">
                  {category.id === "custom" ? t("sidebar.custom") : t("sidebar.preferences")}
                </span>
              </div>
            ))}
          </div>
        </aside>

        <section className="flex-1 overflow-y-auto bg-[#fafaf5] p-10">
          <div className="mx-auto max-w-7xl">
            <header className="mb-10 border-b border-[#c2c8bf]/20 pb-8">
              <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl flex-1">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#23422a]">
                    <PlusCircle className="h-4 w-4" strokeWidth={2.2} />
                    <span>{t("header.eyebrow")}</span>
                  </div>
                  <h1 className="mb-6 font-headline text-4xl font-extrabold tracking-tight text-[#1a1c19]">
                    {t("header.title")}
                  </h1>

                  <div className="group relative">
                    <label className="absolute -top-2.5 left-4 bg-[#fafaf5] px-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#23422a]">
                      {t("header.fieldLabel")}
                    </label>
                    <input
                      value={projectName}
                      onChange={(event) => setProjectName(event.target.value)}
                      className="h-14 w-full rounded-xl border border-[#c2c8bf] bg-white px-5 text-lg font-medium text-[#1a1c19] shadow-sm outline-none transition-all placeholder:text-[#727971]/50 focus:border-[#23422a] focus:ring-4 focus:ring-[#23422a]/5"
                      placeholder={t("header.fieldPlaceholder")}
                      type="text"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => router.push(`/${locale}/projects`)}
                    className="h-14 px-6 font-bold text-[#424842] transition-colors hover:text-[#23422a]"
                  >
                    {t("header.discard")}
                  </button>
                  <button
                    onClick={startBuilding}
                    className="flex h-14 items-center gap-3 rounded-xl bg-[#23422a] px-10 font-headline text-sm font-extrabold text-white shadow-lg shadow-[#23422a]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>{t("header.start")}</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            </header>

            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-headline text-xl font-bold text-[#1a1c19]">
                {t("grid.title")}
                <span className="ml-2 text-sm font-normal text-[#727971]">({visibleTemplates.length})</span>
              </h2>

              <div className="flex items-center rounded-lg border border-[#c2c8bf]/30 bg-[#f4f4ef] p-1">
                <button className="rounded bg-white p-1.5 text-[#23422a] shadow-sm">
                  <Grid2x2 className="h-4 w-4" />
                </button>
                <button className="p-1.5 text-[#727971]">
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-3">
              {visibleTemplates.map((template) => (
                <article
                  key={template.id}
                  className={`group flex flex-col overflow-hidden rounded-[1rem] border bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
                    selectedTemplateId === template.id
                      ? "border-[#23422a] ring-2 ring-[#23422a]/10"
                      : "border-[#c2c8bf]/40"
                  }`}
                  onClick={() => handleTemplateSelect(template.id, template.name)}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#1a1c19]">
                    <img
                      src={template.image}
                      alt={template.name}
                      className="h-full w-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-105"
                    />
                    {template.badge ? (
                      <div className="absolute left-4 top-4">
                        <span
                          className={`rounded px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                            template.badgeTone === "secondary"
                              ? "bg-[#beecb9] text-[#284f2a]"
                              : "bg-[#23422a] text-white"
                          }`}
                        >
                          {template.badge}
                        </span>
                      </div>
                    ) : null}

                    <div className="absolute inset-0 flex items-center justify-center bg-[#23422a]/60 p-6 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleTemplateSelect(template.id, template.name);
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 font-bold text-[#23422a] shadow-xl transition-colors hover:bg-[#fafaf5]"
                      >
                        <span>
                          {selectedTemplateId === template.id
                            ? locale === "zh-CN"
                              ? "已选择模板"
                              : "Template Selected"
                            : t("grid.useTemplate")}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col border-t border-[#c2c8bf]/10 p-6">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <h3 className="font-headline text-lg font-bold leading-tight text-[#1a1c19]">
                        {template.name}
                      </h3>
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#727971]" />
                    </div>

                    <div className="mb-6 grid grid-cols-2 gap-x-4 gap-y-3">
                      <MetaField label={t("fields.industry")} value={template.industry} />
                      <MetaField label={t("fields.complexity")} value={template.complexity} />
                      <MetaField label={t("fields.charts")} value={template.charts} />
                      <MetaField label={t("fields.dataSource")} value={template.dataSource} />
                    </div>

                    <div className="mt-auto flex items-center gap-2 text-[#424842]">
                      <template.footerIcon className="h-4 w-4" strokeWidth={1.9} />
                      <span className="text-[11px] font-medium uppercase tracking-tight">
                        {template.footerLabel}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </main>
  );
}

function IconCircleButton({children}: {children: React.ReactNode}) {
  return (
    <button className="rounded-full p-2 text-[#424842] transition-colors hover:bg-[#eeeee9] hover:text-[#23422a]">
      {children}
    </button>
  );
}

function MetaField({label, value}: {label: string; value: string}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#727971]">
        {label}
      </span>
      <span className="text-xs font-semibold text-[#1a1c19]">{value}</span>
    </div>
  );
}

function resolveTemplateCategory(templateId: string) {
  if (templateId === "sales-analysis") return "sales";
  if (templateId === "urban-control") return "city";
  if (templateId === "executive-presentation") return "all";
  return "operations";
}

function categoryLabel(categoryId: string, locale: string) {
  const zhLabels: Record<string, string> = {
    all: "全部模板",
    operations: "运营大屏",
    sales: "销售分析",
    city: "智慧城市",
    iot: "工业物联",
  };

  return locale === "zh-CN" ? zhLabels[categoryId] ?? categoryId : templateCategories.find((item) => item.id === categoryId)?.label ?? categoryId;
}

function localizeTemplate(template: (typeof templateAssets)[number], locale: string) {
  if (locale !== "zh-CN") return template;

  const localizedMap: Record<string, Partial<(typeof templateAssets)[number]>> = {
    "operations-hub": {
      name: "综合运营驾驶舱",
      industry: "制造与运营",
      complexity: "企业级",
      charts: "24+ 组件",
      dataSource: "SQL / API",
      footerLabel: "适配 1920 × 1080",
      badge: "热门",
    },
    "sales-analysis": {
      name: "战略销售分析",
      industry: "零售与金融",
      complexity: "高级版",
      charts: "15+ 动态图表",
      dataSource: "CSV / JSON",
      footerLabel: "支持自适应布局",
      badge: "新增",
    },
    "urban-control": {
      name: "城市运行中枢",
      industry: "政务与城市治理",
      complexity: "沉浸式 3D",
      charts: "GIS 图层",
      dataSource: "实时 IoT",
      footerLabel: "支持 WebGL 地图",
    },
    "boutique-ops": {
      name: "精品运营大屏",
      industry: "零售运营",
      complexity: "标准版",
      charts: "库存与经营",
      dataSource: "ERP 集成",
      footerLabel: "支持多门店协同",
    },
    "executive-presentation": {
      name: "汇报展示总览",
      industry: "通用场景",
      complexity: "高表现版",
      charts: "KPI 概览",
      dataSource: "多源聚合",
      footerLabel: "适合汇报演示模式",
    },
  };

  return {
    ...template,
    ...localizedMap[template.id],
  };
}
