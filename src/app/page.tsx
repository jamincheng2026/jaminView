import Link from "next/link";
import { BarChart3, Factory, Presentation, Store } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const heroBackground =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA6ud4lwwhTdJhLhJeTltW5xvBqXJhrD5L5V4UUr0A8v6TWWAfsib6J7f6EigFcW7sDpL4Zw44SubiHSzEL3rL28zF9wcaNMWC2N6Pp4XjtagwQZPq4G6H09qfC7Tuute8sAfgpa8gwJEI4SJGJCg5al2vOr4N-xRp_Y2Ttv52UjoLDLIiYy6pwgqHTODMOkbN2Koeaq0bb0JKXGfbOvp7r_zIiOUBARKj5gesLfxEXmfaz6kv7cyklfT2HwNaYih_uMDiRmc07j2Mi";

const templateImages = [
  {
    title: "综合运营驾驶舱",
    subtitle: "适用于集团全业务数据监控",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAxp0mpSEi8Mjx_Av4AZfhOTQ_WIPaSmsHRZFJWTZgEkUF3PiS3fCmqb8nES9qOZ3cS1SKdUyRWUc2gPj7lFdYWFw13Vn8Qn-BOtBL0jZziwujh6I0ELWQqyX6iJOCMJO_Cf4HnSnlFw7WMgsAHntbj4g-ozVrJqGVsamEHbid3MjCk1SM87XtHxfvyW7FC3jlyHgz4tO5ool9DFeDm8S0EgM0sXfNcZtGiJVdJgxdHiAjbsaZu-2yFmeAfU0QItLrjviVJsAKP9_1H",
  },
  {
    title: "销售分析大屏",
    subtitle: "精准追踪销售转化与区域表现",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCqKstB9ECda8F7XF2xbtSjY01ELjms1QUcHhplAvyzsPxRi0T8WBo_l3UjfpKKMTM02yrvsdfhpJEcoD8iaVJ3zZZiFogeOt7L77lnK6gFyJjBIyn_IKMQnNGT_hInYh6q4fQSiX7N0_MSSJuiKXP4dRsxonzC7IRZqaWeZLh4_HQ4IrJ1ImK74dUKE4GDw3jzHa70NWgJYFR-G5E7PwI9f0R_0zmCeIaudx_Yymzpba1W1IZuTVMOTAqP4sdM-_7GV04Q3n4BzOZ-",
  },
  {
    title: "城市业务监控",
    subtitle: "L5 级 3D 地图深度结合业务数据",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDtN1wyYU2XcWQlr9wXFFwJnP-m5lU9l1dHcXH1fEE5WFzCRTvSBisdGGGthy34tUf_Qb1zqZfT1JYEKiZhzkWlcM0IVoo4hq24-qmq8ksSVdiNO-oSppxdiRxq0mlNAS4sfPEMYg6fsyye1zkodIBtL8Ir8NVGd621lrFS5mzhdMlt9AeHUKzTvBMk0rA5D3oPuW2bnh0O-7FPsbBYqYMewWxKF-ph5wWUdSCV0V9wdDjcT1xt70U4rPPOgtI8mKmAgSkfVPQOrGWM",
  },
];

const scenarios = [
  {
    title: "日报周报看板",
    body: "快速聚合多维数据，替代低效的 PPT 汇报。",
    icon: BarChart3,
  },
  {
    title: "销售实况大屏",
    body: "实时滚动全国订单数据，激励一线团队表现。",
    icon: Store,
  },
  {
    title: "企业展厅演示",
    body: "高逼格 3D 渲染，展现企业数字化转型实力。",
    icon: Presentation,
  },
  {
    title: "生产线效能监控",
    body: "对接物联感知层，实时预警工业生产异常。",
    icon: Factory,
  },
];

const scenarioImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB1lAbGGIp7MyiIQxD0vFyGEKI6n4mIv9HWxhlX50SBAMIp_gmu0Mrc8B83uZZRoYTKGNqHLqLzdJLR9pSafoy-fyQFCY0bJfCfJxJV-1CO9Jd9g59yklMugxloGQ4oEb9IhtUIDQi7KrZgw5GS_pdqpgIpa0FRQ56Z0flqzga1d1wPj-ds48IpO_emzsyQLmDBfU83SR_L_QqHavD3GfNZnvVoco-FEKKcVmA3fO-Nv7OpVHk_TdveqmO-Zhou5C1b6PKtxxhAdbkQ";

export default function HomePage() {
  return (
    <main className="bg-[#fafaf5] text-[#1a1c19] font-body">
      <header className="hero-nav-enter absolute left-0 right-0 top-0 z-50 text-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6 text-white">
          <div className="flex items-center gap-12">
            <span className="font-headline text-xl font-bold tracking-tight text-white">
              JaminView
            </span>
            <div className="hidden items-center gap-8 md:flex">
              <span className="font-headline border-b-2 border-[#abd0af] pb-1 text-sm font-bold tracking-wide text-white">
                产品功能
              </span>
              <span className="font-headline text-sm font-semibold tracking-wide text-white transition-colors hover:text-white">
                模板库
              </span>
              <span className="font-headline text-sm font-semibold tracking-wide text-white transition-colors hover:text-white">
                价格
              </span>
              <span className="font-headline text-sm font-semibold tracking-wide text-white transition-colors hover:text-white">
                关于我们
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/projects"
              className="rounded-md px-5 py-2 text-sm font-medium text-white transition-colors hover:text-white"
            >
              登录
            </Link>
            <Link
              href="/projects"
              className="rounded-md bg-[#23422a] px-6 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-[#3a5a40]"
            >
              立即体验
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroBackground}
            alt="Professional Dark Mode Data Dashboard Background"
            className="hero-background-motion h-full w-full object-cover"
          />
          <div className="hero-overlay absolute inset-0" />
        </div>
        <div className="relative z-10 mx-auto -mt-20 flex max-w-7xl flex-col items-center px-8 text-center">
          <div className="max-w-3xl">
            <h1 className="hero-title-enter font-headline text-shadow-sm text-5xl font-extrabold leading-[1.08] tracking-tight text-white lg:text-7xl">
              <span className="bg-gradient-to-r from-[#fffdf4] via-[#dcefb8] via-45% to-[#5fa368] bg-clip-text text-transparent">
                更快交付
              </span>
              <br />
              <span className="text-white">数据大屏</span>
            </h1>
            <p className="hero-subtitle-enter text-shadow-sm mb-6 mt-8 text-xl font-medium leading-relaxed text-[#f4f4ef] lg:text-2xl">
              从模板出发，导入你的数据，完成编辑与发布。
            </p>
            <p className="hero-copy-enter mx-auto mb-12 max-w-lg text-base leading-relaxed text-white/74">
              JaminView 面向业务团队、产品经理和交付工程师，将繁杂的代码开发转化为直观的配置过程。
            </p>
            <div className="hero-actions-enter flex flex-wrap justify-center gap-6">
              <Link
                href="/projects"
                className="flex items-center gap-2 rounded-md bg-[#23422a] px-10 py-4 text-lg font-bold text-[#f4f4ef] shadow-2xl transition duration-300 hover:-translate-y-0.5 hover:bg-[#3a5a40] hover:shadow-[0_24px_60px_rgba(35,66,42,0.45)]"
                style={{ color: "#f4f4ef" }}
              >
                进入演示环境
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/projects"
                className="rounded-md border border-white/16 bg-white/8 px-10 py-4 text-lg font-bold text-[#f4f4ef] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-white/14 hover:text-[#fafaf5] hover:shadow-[0_20px_45px_rgba(255,255,255,0.08)]"
                style={{ color: "#f4f4ef" }}
              >
                浏览模板库
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Reveal as="section" className="border-y border-[#c2c8bf]/10 bg-[#f4f4ef] py-24">
        <div className="mx-auto max-w-7xl px-8">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h2 className="mb-6 text-4xl font-bold text-[#23422a]">
                把搭建时间花在内容上，而不是重复造页面
              </h2>
              <p className="text-lg leading-relaxed text-[#424842]">
                我们深知交付压力的来源。JaminView 通过高度封装的行业模板与灵活的数据映射机制，让非技术人员也能在数小时内交付出具备专业水准的数字化座舱。
              </p>
            </div>
            <div className="flex gap-4">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="mb-1 text-3xl font-bold text-[#23422a]">75%</div>
                <div className="text-xs font-semibold uppercase tracking-widest text-[#424842]">
                  交付周期缩短
                </div>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="mb-1 text-3xl font-bold text-[#23422a]">0</div>
                <div className="text-xs font-semibold uppercase tracking-widest text-[#424842]">
                  代码编写需求
                </div>
              </div>
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
                <h3 className="mb-4 text-2xl font-bold text-[#23422a]">模板起步</h3>
                <p className="mb-8 leading-relaxed text-[#424842]">
                  内置上百套覆盖智慧城市、工业互联、金融分析的预设模板。点击即刻开始，无需从零开始构思布局。
                </p>
              </div>
              <img
                src={templateImages[0].image}
                alt={templateImages[0].title}
                className="h-48 w-full rounded object-cover shadow-md grayscale transition-all duration-500 group-hover:grayscale-0"
              />
            </div>

            <div className="group flex flex-col border border-[#c2c8bf]/5 bg-[#e3e3de] p-10 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(35,66,42,0.08)]">
              <div className="mb-6 text-4xl text-[#23422a]">◫</div>
              <h3 className="mb-4 text-xl font-bold text-[#23422a]">数据导入</h3>
              <p className="mb-6 text-sm leading-relaxed text-[#424842]">
                支持 Excel, CSV, API 及主流数据库的无缝接入，字段映射所见即所得。
              </p>
              <div className="mt-auto border-t border-[#c2c8bf]/20 pt-6">
                <div className="text-xs font-bold tracking-[0.18em] text-[#23422a]">
                  实时接入就绪
                </div>
              </div>
            </div>

            <div className="group flex flex-col bg-[#23422a] p-10 text-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_rgba(35,66,42,0.2)]">
              <div className="mb-6 text-4xl text-white">✦</div>
              <h3 className="mb-4 text-xl font-bold">可视化编辑</h3>
              <p className="text-sm leading-relaxed text-white/80">
                自由拖拽组件，深度定制图表样式。支持高级 3D 地图层级下钻与动效配置。
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
                <h3 className="mb-4 text-2xl font-bold text-[#23422a]">发布展示</h3>
                <p className="leading-relaxed text-[#424842]">
                  一键生成链接或嵌入代码。支持多终端适配、私有化部署以及高安全性的权限管理体系，确保数据仅在可控范围内流动。
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
            <h2 className="mb-4 text-4xl font-bold text-[#23422a]">从常见场景开始搭建</h2>
            <div className="mx-auto h-1 w-20 bg-[#23422a]" />
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {templateImages.map((template) => (
              <div key={template.title} className="group cursor-pointer transition duration-300 hover:-translate-y-1">
                <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-lg bg-[#e3e3de]">
                  <img
                    src={template.image}
                    alt={template.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-[#23422a]/20 opacity-0 transition group-hover:opacity-100">
                    <button className="bg-[#fafaf5] px-6 py-2 text-sm font-bold text-[#23422a] shadow-xl">
                      使用此模板
                    </button>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-[#23422a]">{template.title}</h4>
                <p className="text-sm text-[#424842]">{template.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="overflow-hidden bg-[#fafaf5] py-32" delay={120}>
        <div className="mx-auto max-w-7xl px-8">
          <h2 className="mb-20 text-center text-3xl font-bold text-[#23422a]">
            透明且高效的工作流
          </h2>
          <div className="relative flex flex-col justify-between gap-12 md:flex-row">
            <div className="absolute left-0 top-12 -z-10 hidden h-px w-full bg-[#c2c8bf]/30 md:block" />
            {[
              ["1", "选择模板", "浏览行业库，锁定最接近你业务逻辑的展示布局。"],
              ["2", "导入数据", "拖入 Excel 或连接 API，实时预览数据驱动下的组件形态。"],
              ["3", "调整组件", "个性化修改色调、品牌标识及特殊的交互联动逻辑。"],
              ["4", "发布展示", "一键推送至大屏设备或管理平台，完成任务交付。"],
            ].map(([index, title, body], idx) => (
              <div key={title} className="flex flex-1 flex-col items-center text-center">
                <div
                  className={`mb-8 flex h-24 w-24 items-center justify-center rounded-full border shadow-sm ${
                    idx === 3
                      ? "border-transparent bg-[#23422a] text-white shadow-lg"
                      : "border-[#c2c8bf]/20 bg-[#e3e3de] text-[#23422a]"
                  }`}
                >
                  <span className="text-2xl font-bold">{index}</span>
                </div>
                <h5 className="mb-3 text-lg font-bold text-[#23422a]">{title}</h5>
                <p className="px-4 text-sm text-[#424842]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="border-t border-[#c2c8bf]/10 bg-[#f4f4ef] py-24" delay={150}>
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-20 px-8 md:grid-cols-2">
          <div>
            <h2 className="mb-12 text-3xl font-bold text-[#23422a]">满足多样化的业务触达</h2>
            <ul className="space-y-4">
              {scenarios.map((item) => {
                const Icon = item.icon;

                return (
                <li
                  key={item.title}
                  className="flex items-center gap-4 rounded-lg p-4 transition-colors hover:bg-[#fafaf5]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#edf0e8] text-[#23422a]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h6 className="font-bold text-[#23422a]">{item.title}</h6>
                    <p className="text-xs text-[#424842]">{item.body}</p>
                  </div>
                </li>
                );
              })}
            </ul>
          </div>
          <div className="relative">
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[#fafaf5] p-1 shadow-sm">
              <img src={scenarioImage} alt="Usage scenarios" className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -right-6 max-w-xs rounded-xl bg-[#23422a] p-6 text-white shadow-xl">
              <p className="text-sm italic">
                "JaminView 将我们的交付时间从两周压缩到了两天，极大地提升了客户满意度。"
              </p>
              <p className="mt-4 text-xs font-bold">— 某头部咨询机构交付主管</p>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="relative overflow-hidden bg-[#23422a] py-32 text-center text-white" delay={180}>
        <div className="dot-grid absolute inset-0 opacity-5" />
        <div className="relative z-10 mx-auto max-w-4xl px-8">
          <h2 className="mb-8 text-4xl font-bold leading-tight">
            先做出一张能展示的页面，
            <br />
            再继续打磨细节
          </h2>
          <p className="mb-12 text-lg text-white/70">
            立即加入 JaminView，开启你的高效可视化之旅。免费注册并使用基础版模板。
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link
              href="/projects"
              className="rounded bg-[#fafaf5] px-10 py-4 text-lg font-bold text-[#23422a] shadow-xl transition duration-300 hover:-translate-y-0.5 hover:bg-[#e8e8e3] hover:shadow-[0_20px_44px_rgba(0,0,0,0.18)]"
              style={{ color: "#23422a" }}
            >
              进入演示环境
            </Link>
            <Link
              href="/projects"
              className="rounded border border-white/30 px-10 py-4 text-lg font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-white/5 hover:shadow-[0_20px_44px_rgba(0,0,0,0.14)]"
              style={{ color: "#f4f4ef" }}
            >
              浏览模板库
            </Link>
          </div>
        </div>
      </Reveal>

      <footer className="w-full border-t border-[#e3e3de]/20 bg-[#f4f4ef]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-12 py-10 md:flex-row">
          <div className="flex flex-col items-center md:items-start">
            <span className="mb-2 text-xl font-bold text-[#23422a]">JaminView</span>
            <p className="text-center text-xs leading-relaxed text-[#424842] md:text-left">
              © 2024 JaminView. All rights reserved.
              <br />
              Designed for the Intellectual Atelier.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {["隐私政策", "服务条款", "开发者文档", "联系我们", "加入我们"].map((item) => (
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
