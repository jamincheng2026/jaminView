<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 🛑 JAMINVIEW V2 EDITOR REBUILD - CODEX / GITHUB COPILOT / AI HANDOFF RULES 🛑

**If you are an AI assistant (Codex, Claude, ChatGPT, Cursor, etc.) reading this, you MUST follow these constraints.**
This project has suffered from bad architectural drift in the past due to fragmented components and "patchwork" state management.
**You are not allowed to invent ad-hoc patterns. You must follow the exact architectural definitions below.**

## 📖 REQUIRED READING BEFORE WRITING CODE:
1. You MUST read `docs/editor-v2-rebuild-master-plan.md` to understand the overarching architecture.
2. You MUST read `docs/editor-v2-tasks.md` to coordinate your current task assignment.
3. You MUST analyze how the equivalent feature was implemented in Vue in the `reference/go-view/` directory, and translate its logic into React + VChart.

## 🚨 CONSTRAINT 1: THE "FIVE-FILE PATTERN" ONLY
When building any component (widget, chart, map), it MUST be isolated into its own folder containing exactly these 5 files. Do not build monolithic code.
1. `index.ts` - Registration & metadata
2. `config.ts` - Default configuration (A direct VChart standard Spec object)
3. `panel.tsx` - Right side edit panel UI
4. `render.tsx` - Canvas View (e.g., React `<VChart>` bound directly to the config spec)
5. `data.json` - Default load data

## 🚨 CONSTRAINT 2: STATE MANAGEMENT = ZUSTAND
**ABSOLUTELY NO `useState` for widget configuration data.**
Note: `useState` IS perfectly fine for local UI state (e.g., accordion open/close, dragging state, local tab indices). However, do NOT use `useState` to hold the actual widget configuration form values. Direct all config edits straight into patches dispatched to the global Zustand store (`editor-store.ts`).

## 🚨 CONSTRAINT 3: BRAND DESIGN SYSTEM & SHADCN UI
JaminView Editor uses Shadcn UI components as the base for Editor UI, heavily customized with our Light-Mode Dark Green brand. You MUST use arbitrary Tailwind values matching our exact design tokens for these components:
- Backgrounds/Panels: `bg-[#fafaf5]` (Oatmeal)
- Primary Accents / Active states / Toggles / Tabs: `bg-[#23422a]` / `text-[#23422a]` (Dark Green)
- Borders / Inactive Toggles / Dividers: `border-[#d7d8d1]`
- General Text Main: `text-[#1a1c19]` (Never pure black)
- Secondary Text: `text-[#727971]`

## 🚨 CONSTRAINT 4: NO CONFIG ABSTRACTION (VCHART SPEC DIRECT BINDING)
Never create wrapper properties like `{ widget_style: { barThickness: 10 } }`.
Instead, map panel controls directly to their VChart Spec paths. If you want to change Bar Chart thickness, patch the spec directly: `{ spec: { bar: { style: { barWidth: newValue } } } }`.
The VChart Spec is the **ONLY** source of truth for rendering. Do not build any abstraction / translation middleware between the React Editor Panel and the VChart Renderer.

## 🚨 CONSTRAINT 5: AI WORKFLOW & SELF-TESTING MANDATE
When completing any assigned task, you MUST perform a self-test to verify functionality before reporting completion. You must record your test steps and results in your response log. NEVER declare a task done without verifying it compiles and renders without errors.

## 🚨 CONSTRAINT 6: CODE QUALITY & TYPESCRIPT
Code must be production-grade. Absolutely NO `any` types. Everything must have strict TypeScript interfaces (especially mapping to `widget.spec` configurations). Clean modularity is required.

## 🚨 CONSTRAINT 7: LANGUAGE & I18N RULES
All Editor UI text, placeholder data, and configurations must be written in **Chinese** by default. We are targeting a Chinese userbase initially. However, structure text cleanly so that `next-intl` can be easily applied later (do not hardcode strings inside deeply abstracted conditional loops if possible; keep them in presentation layers).

**WARNING: VIOLATION OF ANY OF THESE RULES WILL CAUSE THE CODE TO BE REJECTED.**
