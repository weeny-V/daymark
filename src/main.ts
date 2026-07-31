import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useSettingsStore } from './stores/settings'
import { useTasksStore } from './stores/tasks'
import { useHabitsStore } from './stores/habits'
import { useNotesStore } from './stores/notes'
import { useOrganizationStore } from './stores/organization'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
useSettingsStore(pinia).initialize()
useOrganizationStore(pinia).initialize()
useTasksStore(pinia).initialize()
useHabitsStore(pinia).initialize()
useNotesStore(pinia).initialize()
app.use(router)

app.mount('#app')
