# Vue Productivity Dashboard

## Project overview

This repository contains **Daymark**, a responsive personal-productivity dashboard built with Vue 3. It gives users one calm workspace for planning their day, managing tasks, tracking habits, keeping notes, and adjusting workspace settings.

## Source of truth

The canonical project backlog, priorities, task status, requirements, and acceptance criteria are maintained in Notion:

- [Vue Productivity Dashboard - Project Tasks](https://app.notion.com/p/9fe5b777b9dc449fbef4056341e52a38?v=16ae284ee1624f30a30badc6984cadab&source=copy_link)

Before implementing a backlog task:

1. Open the corresponding Notion task.
2. Read its context, objective, requirements, acceptance criteria, dependencies, and definition of done.
3. Keep the implementation within that scope.
4. Verify every acceptance criterion before considering the task complete.
5. Update the Notion status only after the implementation and relevant checks pass.

## Product goals

- Make daily planning feel focused and approachable.
- Provide consistent navigation across all productivity features.
- Keep common actions quick on desktop and mobile.
- Prefer clear hierarchy and generous whitespace over dense dashboards.
- Build reusable foundations for tasks, notes, habits, and settings.
- Maintain accessible keyboard and screen-reader behavior.

## Current product surface

The application currently includes:

- A sticky `AppHeader` with Daymark branding and account actions.
- A reusable `AppNavigation` rendered as a desktop sidebar and mobile bottom bar.
- A Today dashboard with task quick capture, overdue and due-today tasks, scheduled habits, a pinned-note shortcut, and combined daily progress.
- Task creation, completion, filtering, deletion, priorities, and due dates.
- An Upcoming view that groups incomplete tasks by future due date.
- Local habit creation, daily or weekday schedules, date-based completion, streaks, history, and an empty state.
- Note creation and autosave, search, pinning, and task links that handle deleted tasks gracefully.
- Browser-local appearance and planning settings.
- Not-found recovery, route-aware page titles, and focus management after navigation.
- Responsive support at 375 px, 768 px, and 1440 px.

## Important source files

- `src/App.vue` - root application shell and shared design tokens.
- `src/main.ts` - Vue, Pinia, store, and router initialization.
- `src/router/index.ts` - lazy-loaded Today, Tasks, Upcoming, Habits, Notes, Settings, and not-found routes.
- `src/shared/ui/AppHeader.vue` - global header.
- `src/shared/ui/AppNavigation.vue` - primary navigation.
- `src/shared/hooks/useLocalStorage.ts` - validated browser-storage boundary.
- `src/views/TodayView.vue` - cross-feature daily dashboard.
- `src/views/TasksView.vue` and `src/views/UpcomingView.vue` - task workflows.
- `src/views/HabitsView.vue` - habit management and history.
- `src/views/NotesView.vue` - note editing, search, pinning, and task links.
- `src/views/SettingsView.vue` - appearance and planning preferences.
- `src/stores/tasks.ts`, `habits.ts`, `notes.ts`, and `settings.ts` - domain state, derived values, actions, and persistence lifecycles.

## Technology stack

- Vue 3 with `<script setup>` and the Composition API
- TypeScript
- Vue Router
- Pinia
- Day.js
- Motion for Vue (`motion-v`)
- Vite
- Vitest, Vue Test Utils, jsdom, and axe-core
- Scoped component CSS and shared CSS custom properties
- ESLint, Oxlint, and Oxfmt
- `vue-tsc` for type checking

## Development commands

```bash
npm run dev
npm run test
npm run type-check
npm run lint
npm run format
npm run build
```

Run the test suite, type checking, linting, and the production build before handing off a completed code change. For documentation-only changes, inspect the diff and run formatting or targeted checks when relevant.

## Implementation conventions

- Use Vue single-file components and TypeScript.
- Prefer `<script setup lang="ts">` and the Composition API.
- Keep components focused and reusable.
- Keep transient state inside components and shared cross-route state in Pinia.
- Request domain changes through store actions instead of mutating store collections from views.
- Keep persistence behind store actions or dedicated utilities; do not access browser storage throughout components.
- Initialize persisted stores during application bootstrap so hydrated state is available before routed views render.
- Put application-wide tokens and global shell styles in `src/App.vue`.
- Prefer scoped styles for component-specific rules.
- Reuse existing CSS custom properties before introducing literal colors or spacing.
- Follow the existing 4/8 px spacing rhythm.
- Use Motion for Vue only for purposeful interaction or state animation, and pair it with `useReducedMotion` or an equivalent reduced-motion path.
- Avoid adding dependencies when the platform or a small local component is sufficient.
- Use Day.js for application date parsing, formatting, comparison, and arithmetic.
- Store persisted timestamps and calendar dates as ISO 8601 strings and format them at the display boundary.
- Use the native `Date` API only when a browser or platform API specifically requires it.
- Render page-level content through the router.
- Preserve mobile safe-area handling for fixed bottom navigation.
- Do not introduce horizontal scrolling at supported viewport widths.

## Design direction

Daymark uses a calm, modern productivity aesthetic:

- Light neutral canvas and white surfaces, with a supported dark theme.
- Purple as the primary brand and active-state color.
- Clear typography with compact headings and readable body text.
- Rounded controls and cards.
- Subtle borders and shadows.
- Restrained animation that respects `prefers-reduced-motion`.
- Strong visual hierarchy without excessive decoration.

Reuse established tokens and patterns unless a task or supplied design explicitly requires a change.

## Accessibility requirements

- Use semantic landmarks such as `header`, `nav`, and `main`.
- Ensure all functionality works with keyboard-only input.
- Give interactive elements a visible `:focus-visible` treatment.
- Identify the current route visually and with `aria-current="page"`.
- Use descriptive accessible names for icon-only controls.
- Keep touch targets at least 44 by 44 px.
- Maintain WCAG AA color contrast.
- Do not communicate state through color alone.
- Respect reduced-motion preferences in CSS and JavaScript animation.
- Use one logical page-level `h1` per routed screen.

## Responsive requirements

Check layouts at these representative widths:

- 375 px - mobile
- 768 px - tablet/small desktop boundary
- 1440 px - desktop

The primary navigation is a fixed bottom bar below 768 px and a sticky sidebar at 768 px and above.

## State and local data

Pinia stores own the task, habit, note, and settings domains. Data is persisted in `localStorage`, scoped to the current browser and profile, and is not currently synchronized or backed up remotely.

Store persistence must validate hydrated values, tolerate missing or malformed data, and preserve a clear initialization lifecycle. Cross-feature references, such as a note linked to a task, should use stable IDs and remain usable when the referenced entity has been deleted.

## Agent workflow

- Inspect existing files and the working tree before editing.
- Preserve unrelated user changes.
- Prefer small, task-scoped changes.
- Do not rewrite established components without a requirement.
- Use the Notion task as the acceptance checklist.
- Add or update tests for behavior changes.
- Test responsive behavior and accessibility in proportion to the change.
- Run targeted checks while iterating, then the required full checks before handoff.
- Document assumptions when requirements are incomplete.
- Report changed files and validation results in the handoff.
