import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useSettingsStore } from './stores/settings'
import { useTasksStore } from './stores/tasks'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
useSettingsStore(pinia).initialize()
useTasksStore(pinia).initialize()
app.use(router)

app.mount('#app')
