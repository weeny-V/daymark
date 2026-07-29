# Daymark

Daymark is a responsive Vue 3 productivity dashboard for planning the day,
managing tasks, keeping notes, and adjusting workspace settings.

## Application structure

- `src/router/index.ts` defines lazy-loaded routes for Today, Tasks, Notes,
  Settings, and the not-found page.
- `src/views/TodayView.vue` presents live task counts and up to five active tasks.
- `src/views/TasksView.vue` provides task creation, filtering, completion, and
  deletion workflows.
- `src/stores/tasks.ts` owns shared task state, actions, derived values, and
  persistence initialization.
- `src/shared/hooks/useLocalStorage.ts` isolates browser-storage serialization,
  validation, and error handling.

## Local data

Daymark stores tasks in `localStorage`. Task data is local to the current browser
and browser profile; it is not synced to other devices or backed up remotely.

## Task state architecture

The setup-style Pinia store in `src/stores/tasks.ts` is the single owner of the
task collection and active filter. It exposes task actions (`addTask`,
`toggleTask`, `deleteTask`, and `initialize`) along with derived filtered tasks
and progress counts. Routed views read reactive store values with `storeToRefs`
and request changes through store actions instead of mutating the task array.

Persistence remains behind `src/shared/hooks/useLocalStorage.ts`. The task store
provides the storage key and task validator, hydrates state through its guarded
`initialize` action during application bootstrap, and installs one watcher to
save later task changes. This makes hydrated task state available before any
route renders while keeping browser-storage parsing and error handling separate
from task-domain logic and presentation components.

## Date and time handling

Use [Day.js](https://day.js.org/) for application date parsing, formatting,
comparison, and date arithmetic. Keep persisted timestamps in ISO 8601 format
and convert them to user-facing values at the display boundary. Use the native
`Date` API only where a browser or platform API specifically requires it.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## GitHub Pages deployment

The `Deploy to GitHub Pages` workflow builds and publishes the application when
changes are pushed to `main`. In the repository settings, select **GitHub
Actions** as the source under **Pages → Build and deployment**.

The production site is served from `/daymark/`. Hash-based routing keeps routed
URLs working when they are opened or refreshed directly on GitHub Pages.
