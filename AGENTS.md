# Vue Productivity Dashboard

## Project overview

This repository contains a responsive personal-productivity dashboard built with Vue 3. The application is intended to give users one calm workspace for planning their day, managing tasks, keeping notes, tracking habits, and adjusting workspace settings.

The current product name used in the interface is **Daymark**.

## Source of truth

The canonical project backlog, priorities, task status, requirements, and acceptance criteria are maintained in Notion:

- [Vue Productivity Dashboard — Project Tasks](https://app.notion.com/p/9fe5b777b9dc449fbef4056341e52a38?v=16ae284ee1624f30a30badc6984cadab&source=copy_link)

Before implementing a task:

1. Open the corresponding Notion task.
2. Read its context, objective, requirements, acceptance criteria, dependencies, and definition of done.
3. Keep the implementation within that scope.
4. Verify every acceptance criterion before considering the task complete.
5. Update the Notion task status only after the implementation and relevant checks pass.

## Product goals

- Make daily planning feel focused and approachable.
- Provide consistent navigation across all productivity features.
- Keep common actions quick on both desktop and mobile.
- Prefer clear hierarchy and generous whitespace over dense dashboards.
- Build reusable foundations for tasks, notes, habits, and settings.
- Maintain accessible keyboard and screen-reader behavior.

## Current application structure

The application shell is already implemented and provides:

- A sticky `AppHeader` with Daymark branding and account actions.
- A reusable `AppNavigation` component.
- Desktop sidebar navigation.
- Compact mobile bottom navigation below 768 px.
- Routes for Today, Tasks, Notes, and Settings.
- A centered, responsive content region rendered through `RouterView`.
- Active-route styling and `aria-current="page"` semantics.
- Visible keyboard focus states.
- Responsive support at 375 px, 768 px, and 1440 px.

Important source files:

- `src/App.vue` — root application shell and shared design tokens.
- `src/shared/ui/AppHeader.vue` — global header.
- `src/shared/ui/AppNavigation.vue` — primary navigation.
- `src/router/index.ts` — lazy-loaded routes and page-title metadata.
- `src/views/TodayView.vue` — Today dashboard backed by shared task state.
- `src/views/TasksView.vue` — task management screen.
- `src/views/NotesView.vue` and `src/views/SettingsView.vue` — feature placeholders.
- `src/views/NotFoundView.vue` — unknown-route recovery screen.
- `src/stores/tasks.ts` — shared task state, actions, getters, and persistence lifecycle.
- `src/shared/hooks/useLocalStorage.ts` — validated browser-storage boundary.
- `src/main.ts` — Vue, Pinia, task-store, and router initialization.

## Technology stack

- Vue 3 with `<script setup>` and the Composition API
- TypeScript
- Vue Router
- Pinia
- Day.js
- Vite
- Scoped component CSS
- CSS custom properties for shared design tokens
- ESLint and Oxlint
- `vue-tsc` for type checking

## Development commands

```bash
npm run dev
npm run type-check
npm run lint
npm run format
npm run build
```

Run type checking, linting, and the production build before handing off a completed change.

## Implementation conventions

- Use Vue single-file components and TypeScript.
- Prefer `<script setup lang="ts">`.
- Keep components focused and reusable.
- Put application-wide tokens and global shell styles in `src/App.vue`.
- Prefer scoped styles for component-specific rules.
- Use existing CSS custom properties before introducing new literal values.
- Follow the existing 4/8 px spacing rhythm.
- Avoid adding dependencies when the platform or a small local component is sufficient.
- Use Day.js for application date parsing, formatting, comparison, and arithmetic.
- Store persisted timestamps as ISO 8601 strings and format them at the display boundary.
- Use the native `Date` API only when a browser or platform API specifically requires it.
- Render page-level content through the router.
- Preserve mobile safe-area handling for fixed bottom navigation.
- Do not introduce horizontal scrolling at supported viewport widths.

## Design direction

Daymark uses a calm, modern productivity aesthetic:

- Light neutral canvas and white surfaces.
- Purple as the primary brand and active-state color.
- Clear typography with compact headings and readable body text.
- Rounded controls and cards.
- Subtle borders and shadows.
- Restrained animation that respects `prefers-reduced-motion`.
- Strong visual hierarchy without excessive decoration.

Reuse the existing design tokens and patterns unless a task or supplied design explicitly requires a change.

## Accessibility requirements

- Use semantic HTML landmarks such as `header`, `nav`, and `main`.
- All functionality must work with keyboard-only input.
- Interactive elements need visible `:focus-visible` treatment.
- The current route must be visually and programmatically identifiable.
- Use descriptive accessible names for icon-only controls.
- Keep touch targets at least 44 by 44 px.
- Maintain WCAG AA color contrast.
- Do not communicate state through color alone.
- Respect reduced-motion preferences.
- Use one logical page-level `h1` per routed screen.

## Responsive requirements

Always check layouts at these representative widths:

- 375 px — mobile
- 768 px — tablet/small desktop boundary
- 1440 px — desktop

The primary navigation is a fixed bottom bar below 768 px and a sticky sidebar at 768 px and above.

## State and data

Pinia is installed for shared application state. Keep transient, component-local state inside components and use Pinia for state shared across routes or features. Keep persistence concerns behind store actions or dedicated utilities rather than writing to browser storage throughout components.

The generated starter counter store is not part of the product domain and may be removed when store work begins.

## Agent workflow

- Inspect existing files before editing.
- Preserve unrelated user changes.
- Prefer small, task-scoped changes.
- Do not rewrite established components without a requirement.
- Use the Notion task as the acceptance checklist.
- Test responsive behavior and accessibility in proportion to the change.
- Document assumptions when requirements are incomplete.
- Report changed files and validation results in the handoff.
