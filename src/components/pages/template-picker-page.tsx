import {getTranslations} from "next-intl/server";
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

export async function TemplatePickerPage() {
  const t = await getTranslations("TemplatePicker");

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
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                  category.active
                    ? "bg-[#e3e3de] font-semibold text-[#23422a]"
                    : "text-[#424842] hover:bg-[#e8e8e3]"
                }`}
              >
                <category.icon className="h-4 w-4" strokeWidth={1.9} />
                <span className="text-sm">{category.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-6 space-y-1 border-t border-[#c2c8bf]/30 pt-6">
            {utilityCategories.map((category) => (
              <button
                key={category.id}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[#424842] transition-all hover:bg-[#e8e8e3]"
              >
                <category.icon className="h-4 w-4" strokeWidth={1.9} />
                <span className="text-sm">
                  {category.id === "custom" ? t("sidebar.custom") : t("sidebar.preferences")}
                </span>
              </button>
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
                      className="h-14 w-full rounded-xl border border-[#c2c8bf] bg-white px-5 text-lg font-medium text-[#1a1c19] shadow-sm outline-none transition-all placeholder:text-[#727971]/50 focus:border-[#23422a] focus:ring-4 focus:ring-[#23422a]/5"
                      placeholder={t("header.fieldPlaceholder")}
                      type="text"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button className="h-14 px-6 font-bold text-[#424842] transition-colors hover:text-[#23422a]">
                    {t("header.discard")}
                  </button>
                  <button className="flex h-14 items-center gap-3 rounded-xl bg-[#23422a] px-10 font-headline text-sm font-extrabold text-white shadow-lg shadow-[#23422a]/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <span>{t("header.start")}</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            </header>

            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-headline text-xl font-bold text-[#1a1c19]">
                {t("grid.title")}
                <span className="ml-2 text-sm font-normal text-[#727971]">({t("grid.count")})</span>
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
              {templateAssets.map((template) => (
                <article
                  key={template.id}
                  className="group flex flex-col overflow-hidden rounded-[1rem] border border-[#c2c8bf]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
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
                      <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 font-bold text-[#23422a] shadow-xl transition-colors hover:bg-[#fafaf5]">
                        <span>{t("grid.useTemplate")}</span>
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
