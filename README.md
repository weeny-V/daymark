# Daymark

Daymark is a responsive, browser-local productivity dashboard built with Vue 3. It brings daily planning, task management, habit tracking, notes, and workspace preferences into one calm interface.

[Open the live application](https://weeny-v.github.io/daymark/#/today)

## Features

- **Today dashboard** - review overdue and due-today tasks, capture a task quickly, complete scheduled habits, open a pinned note, and see combined daily progress.
- **Tasks** - create, complete, filter, and delete tasks with priorities and due dates.
- **Upcoming** - review incomplete tasks grouped by future due date.
- **Habits** - create daily or weekday-based habits, record completion by date, and review streak and history information.
- **Notes** - create and autosave notes, search their content, pin important notes, and link notes to tasks.
- **Settings** - choose workspace preferences and download or restore a versioned JSON backup.
- **Responsive navigation** - use a desktop sidebar or a mobile bottom navigation bar.

All productivity data is stored locally in the current browser profile. Daymark does not require an account or sync data across devices. Use **Settings > Data backup** to download a JSON copy of tasks, settings, notes, and habits. Restoring a backup validates the whole file and asks for confirmation before replacing local data.

## Technology

- Vue 3 and TypeScript
- Vue Router and Pinia
- Day.js for date handling
- Motion for Vue (`motion-v`) for purposeful, reduced-motion-aware animation
- Vite
- Vitest, Vue Test Utils, and axe-core
- ESLint, Oxlint, Oxfmt, and `vue-tsc`

## Project structure

```text
src/
  components/       Feature components
  router/           Lazy-loaded routes and page metadata
  shared/           Reusable hooks and UI
  stores/           Pinia stores and persistence lifecycles
  types/            Domain types
  views/            Routed Today, Tasks, Upcoming, Habits, Notes, and Settings pages
```

The stores in `src/stores` are the source of truth for tasks, habits, notes, and settings. Each store owns its domain actions and derived state. Browser persistence is initialized during application startup and kept behind store actions and `src/shared/hooks/useLocalStorage.ts` rather than being scattered through components.

Persisted dates and timestamps use ISO 8601 strings. Day.js handles application date parsing, comparison, arithmetic, and display formatting.

## Getting started

Requirements: Node.js `^22.18.0` or `>=24.12.0` and npm.

```sh
npm install
npm run dev
```

The development server prints the local URL after startup.

## Quality checks

```sh
npm run test
npm run type-check
npm run lint
npm run build
```

To format source files, run:

```sh
npm run format
```

The interface is designed and tested around representative widths of 375 px, 768 px, and 1440 px. Interactive behavior should remain keyboard accessible, expose visible focus states, and respect `prefers-reduced-motion`.

## Backlog and requirements

The canonical backlog, priorities, acceptance criteria, and task status live in [Vue Productivity Dashboard - Project Tasks](https://app.notion.com/p/9fe5b777b9dc449fbef4056341e52a38?v=16ae284ee1624f30a30badc6984cadab&source=copy_link).

## Deployment

The `Deploy to GitHub Pages` workflow builds and publishes the application when changes are pushed to `main`. GitHub Pages must use **GitHub Actions** as its build source.

The production site is served from `/daymark/`. Hash-based routing allows routed URLs to open and refresh correctly on GitHub Pages.
