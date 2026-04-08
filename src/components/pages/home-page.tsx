import Image from "next/image";
import {getTranslations} from "next-intl/server";

import {HeroStage} from "@/components/marketing/hero-stage";
import {Reveal} from "@/components/marketing/reveal";
import {Link} from "@/i18n/navigation";
import {LocaleSwitch} from "@/components/ui/locale-switch";
import {
  heroBackground,
  homeScenarioImage,
  homeScenarios,
  homeTemplateImages,
} from "@/lib/mocks/home";

export async function HomePage() {
  const t = await getTranslations("Home");
  const templateCopy = t.raw("templates.items") as Array<{title: string; subtitle: string}>;
  const workflowSteps = t.raw("workflow.steps") as Array<{
    index: string;
    title: string;
    body: string;
  }>;
  const scenarioCopy = t.raw("scenarios.items") as Array<{title: string; body: string}>;
  const stats = t.raw("value.stats") as Array<{value: string; label: string}>;
  const footerLinks = t.raw("footer.links") as string[];

  return (
    <main className="bg-[#fafaf5] font-body text-[#1a1c19]">
      <header className="hero-nav-enter absolute left-0 right-0 top-0 z-50 text-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6 text-white">
          <div className="flex items-center gap-12">
            <span className="font-headline text-xl font-bold tracking-tight text-white">
              JaminView
            </span>
            <div className="hidden items-center gap-8 md:flex">
              <span className="font-headline border-b-2 border-[#abd0af] pb-1 text-sm font-bold tracking-wide text-white">
                {t("nav.features")}
              </span>
              <span className="font-headline text-sm font-semibold tracking-wide text-white transition-colors hover:text-white">
                {t("nav.templates")}
              </span>
              <span className="font-headline text-sm font-semibold tracking-wide text-white transition-colors hover:text-white">
                {t("nav.pricing")}
              </span>
              <span className="font-headline text-sm font-semibold tracking-wide text-white transition-colors hover:text-white">
                {t("nav.about")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LocaleSwitch variant="dark" />
            <Link
              href="/projects"
              className="rounded-md px-5 py-2 text-sm font-medium text-white transition-colors hover:text-white"
            >
              {t("nav.signIn")}
            </Link>
            <Link
              href="/projects"
              className="rounded-md bg-[#23422a] px-6 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-[#3a5a40]"
            >
              {t("nav.cta")}
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={heroBackground}
            alt="Professional Dark Mode Data Dashboard Background"
            fill
            unoptimized
            sizes="100vw"
            className="hero-background-motion h-full w-full object-cover"
          />
          <div className="hero-overlay absolute inset-0" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-8 pb-14 pt-28 lg:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_620px] lg:gap-10">
            <div className="max-w-3xl text-center lg:text-left">
              <h1 className="hero-title-enter text-shadow-sm font-headline text-5xl font-extrabold leading-[1.08] tracking-tight text-white lg:text-7xl">
                <span className="bg-gradient-to-r from-[#fffdf4] via-[#dcefb8] via-45% to-[#5fa368] bg-clip-text text-transparent">
                  {t("hero.titleAccent")}
                </span>
                <br />
                <span className="text-white">{t("hero.titleMain")}</span>
              </h1>
              <p className="hero-subtitle-enter text-shadow-sm mb-6 mt-8 text-xl font-medium leading-relaxed text-[#f4f4ef] lg:text-2xl">
                {t("hero.subtitle")}
              </p>
              <p className="hero-copy-enter mx-auto mb-12 max-w-lg text-base leading-relaxed text-white/74 lg:mx-0">
                {t("hero.description")}
              </p>
              <div className="hero-actions-enter flex flex-wrap justify-center gap-6 lg:justify-start">
                <Link
                  href="/projects"
                  className="flex items-center gap-2 rounded-md bg-[#23422a] px-10 py-4 text-lg font-bold text-[#f4f4ef] shadow-2xl transition duration-300 hover:-translate-y-0.5 hover:bg-[#3a5a40] hover:shadow-[0_24px_60px_rgba(35,66,42,0.45)]"
                  style={{color: "#f4f4ef"}}
                >
                  {t("hero.primaryAction")}
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/projects"
                  className="rounded-md border border-white/16 bg-white/8 px-10 py-4 text-lg font-bold text-[#f4f4ef] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-white/14 hover:text-[#fafaf5] hover:shadow-[0_20px_45px_rgba(255,255,255,0.08)]"
                  style={{color: "#f4f4ef"}}
                >
                  {t("hero.secondaryAction")}
                </Link>
              </div>
            </div>
            <HeroStage primaryImage={homeTemplateImages[2].image} />
          </div>
        </div>
      </section>

      <Reveal as="section" className="border-y border-[#c2c8bf]/10 bg-[#f4f4ef] py-24">
        <div className="mx-auto max-w-7xl px-8">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h2 className="mb-6 text-4xl font-bold text-[#23422a]">{t("value.title")}</h2>
              <p className="text-lg leading-relaxed text-[#424842]">{t("value.description")}</p>
            </div>
            <div className="flex gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg bg-white p-6 shadow-sm">
                  <div className="mb-1 text-3xl font-bold text-[#23422a]">{stat.value}</div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-[#424842]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="bg-[#fafaf5] py-32" delay={60}>
        <div className="mx-auto max-w-7xl px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="group flex flex-col justify-between border border-[#c2c8bf]/5 bg-[#f4f4ef] p-10 transition duration-300 hover:-translate-y-1 hover:bg-[#eeeee9] hover:shadow-[0_20px_40px_rgba(35,66,42,0.08)] md:col-span-2">
              <div>
                <div className="mb-6 text-4xl text-[#23422a]">◎</div>
                <h3 className="mb-4 text-2xl font-bold text-[#23422a]">
                  {t("capabilities.template.title")}
                </h3>
                <p className="mb-8 leading-relaxed text-[#424842]">
                  {t("capabilities.template.body")}
                </p>
              </div>
              <div className="relative h-48 w-full overflow-hidden rounded shadow-md">
                <Image
                  src={homeTemplateImages[0].image}
                  alt={templateCopy[0]?.title ?? "Template preview"}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="grayscale object-cover transition-all duration-500 group-hover:grayscale-0"
                />
              </div>
            </div>

            <div className="group flex flex-col border border-[#c2c8bf]/5 bg-[#e3e3de] p-10 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(35,66,42,0.08)]">
              <div className="mb-6 text-4xl text-[#23422a]">◫</div>
              <h3 className="mb-4 text-xl font-bold text-[#23422a]">
                {t("capabilities.data.title")}
              </h3>
              <p className="mb-6 text-sm leading-relaxed text-[#424842]">
                {t("capabilities.data.body")}
              </p>
              <div className="mt-auto border-t border-[#c2c8bf]/20 pt-6">
                <div className="text-xs font-bold tracking-[0.18em] text-[#23422a]">
                  {t("capabilities.data.tag")}
                </div>
              </div>
            </div>

            <div className="group flex flex-col bg-[#23422a] p-10 text-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_rgba(35,66,42,0.2)]">
              <div className="mb-6 text-4xl text-white">✦</div>
              <h3 className="mb-4 text-xl font-bold">{t("capabilities.editor.title")}</h3>
              <p className="text-sm leading-relaxed text-white/80">
                {t("capabilities.editor.body")}
              </p>
              <div className="mt-auto">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-3/4 bg-[#abd0af]" />
                </div>
              </div>
            </div>

            <div className="group flex flex-col items-center gap-12 border border-[#c2c8bf]/5 bg-[#f4f4ef] p-10 transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(35,66,42,0.08)] md:col-span-4 md:flex-row">
              <div className="flex-1">
                <div className="mb-6 text-4xl text-[#23422a]">↗</div>
                <h3 className="mb-4 text-2xl font-bold text-[#23422a]">
                  {t("capabilities.publish.title")}
                </h3>
                <p className="leading-relaxed text-[#424842]">
                  {t("capabilities.publish.body")}
                </p>
              </div>
              <div className="grid w-full flex-1 grid-cols-3 gap-4">
                <div className="aspect-video rounded border border-[#c2c8bf]/10 bg-[#e3e3de]" />
                <div className="aspect-video rounded border border-[#23422a]/10 bg-[#3a5a40]/20" />
                <div className="aspect-video rounded border border-[#c2c8bf]/10 bg-[#e3e3de]" />
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="bg-[#f4f4ef] py-24" delay={90}>
        <div className="mx-auto max-w-7xl px-8">
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-4xl font-bold text-[#23422a]">{t("templates.title")}</h2>
            <div className="mx-auto h-1 w-20 bg-[#23422a]" />
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {homeTemplateImages.map((template, index) => (
              <div key={template.image} className="group cursor-pointer transition duration-300 hover:-translate-y-1">
                <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-lg bg-[#e3e3de]">
                  <Image
                    src={template.image}
                    alt={templateCopy[index]?.title ?? "Template preview"}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-[#23422a]/20 opacity-0 transition group-hover:opacity-100">
                    <button className="bg-[#fafaf5] px-6 py-2 text-sm font-bold text-[#23422a] shadow-xl">
                      {t("templates.action")}
                    </button>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-[#23422a]">{templateCopy[index]?.title}</h4>
                <p className="text-sm text-[#424842]">{templateCopy[index]?.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="overflow-hidden bg-[#fafaf5] py-32" delay={120}>
        <div className="mx-auto max-w-7xl px-8">
          <h2 className="mb-20 text-center text-3xl font-bold text-[#23422a]">
            {t("workflow.title")}
          </h2>
          <div className="relative flex flex-col justify-between gap-12 md:flex-row">
            <div className="absolute left-0 top-12 -z-10 hidden h-px w-full bg-[#c2c8bf]/30 md:block" />
            {workflowSteps.map((step, idx) => (
              <div key={step.title} className="flex flex-1 flex-col items-center text-center">
                <div
                  className={`mb-8 flex h-24 w-24 items-center justify-center rounded-full border shadow-sm ${
                    idx === workflowSteps.length - 1
                      ? "border-transparent bg-[#23422a] text-white shadow-lg"
                      : "border-[#c2c8bf]/20 bg-[#e3e3de] text-[#23422a]"
                  }`}
                >
                  <span className="text-2xl font-bold">{step.index}</span>
                </div>
                <h5 className="mb-3 text-lg font-bold text-[#23422a]">{step.title}</h5>
                <p className="px-4 text-sm text-[#424842]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="border-t border-[#c2c8bf]/10 bg-[#f4f4ef] py-24" delay={150}>
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-20 px-8 md:grid-cols-2">
          <div>
            <h2 className="mb-12 text-3xl font-bold text-[#23422a]">{t("scenarios.title")}</h2>
            <ul className="space-y-4">
              {homeScenarios.map((item, index) => {
                const Icon = item.icon;
                const copy = scenarioCopy[index];

                return (
                  <li
                    key={copy?.title ?? index}
                    className="flex items-center gap-4 rounded-lg p-4 transition-colors hover:bg-[#fafaf5]"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#edf0e8] text-[#23422a]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h6 className="font-bold text-[#23422a]">{copy?.title}</h6>
                      <p className="text-xs text-[#424842]">{copy?.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="relative">
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[#fafaf5] p-1 shadow-sm">
              <Image src={homeScenarioImage} alt="Usage scenarios" fill unoptimized sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-6 -right-6 max-w-xs rounded-xl bg-[#23422a] p-6 text-white shadow-xl">
              <p className="text-sm italic">&ldquo;{t("scenarios.quote")}&rdquo;</p>
              <p className="mt-4 text-xs font-bold">{t("scenarios.quoteAuthor")}</p>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal
        as="section"
        className="relative overflow-hidden bg-[#23422a] py-32 text-center text-white"
        delay={180}
      >
        <div className="dot-grid absolute inset-0 opacity-5" />
        <div className="relative z-10 mx-auto max-w-4xl px-8">
          <h2 className="mb-8 text-4xl font-bold leading-tight">
            {t("cta.titleTop")}
            <br />
            {t("cta.titleBottom")}
          </h2>
          <p className="mb-12 text-lg text-white/70">{t("cta.description")}</p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link
              href="/projects"
              className="rounded bg-[#fafaf5] px-10 py-4 text-lg font-bold text-[#23422a] shadow-xl transition duration-300 hover:-translate-y-0.5 hover:bg-[#e8e8e3] hover:shadow-[0_20px_44px_rgba(0,0,0,0.18)]"
              style={{color: "#23422a"}}
            >
              {t("cta.primaryAction")}
            </Link>
            <Link
              href="/projects"
              className="rounded border border-white/30 px-10 py-4 text-lg font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-white/5 hover:shadow-[0_20px_44px_rgba(0,0,0,0.14)]"
              style={{color: "#f4f4ef"}}
            >
              {t("cta.secondaryAction")}
            </Link>
          </div>
        </div>
      </Reveal>

      <footer className="w-full border-t border-[#e3e3de]/20 bg-[#f4f4ef]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-12 py-10 md:flex-row">
          <div className="flex flex-col items-center md:items-start">
            <span className="mb-2 text-xl font-bold text-[#23422a]">JaminView</span>
            <p className="text-center text-xs leading-relaxed text-[#424842] md:text-left">
              {t("footer.copyrightTop")}
              <br />
              {t("footer.copyrightBottom")}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {footerLinks.map((item) => (
              <span key={item} className="text-xs leading-relaxed text-[#424842] opacity-80">
                {item}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
