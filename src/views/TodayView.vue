<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTasksStore } from '@/stores/tasks'
import dayjs from "dayjs";

const tasksStore = useTasksStore()
const { count, tasks } = storeToRefs(tasksStore)

const activeTasks = computed(() => tasks.value.filter((task) => !task.completed).slice(0, 5))

</script>

<template>
  <section class="today-view">
    <header>
      <p class="eyebrow">{{ dayjs().format('dddd, MMMM D') }}</p>
      <h1>Today</h1>
      <p class="description">A calm overview of what matters and where to focus next.</p>
    </header>

    <dl class="summary" aria-label="Task progress">
      <div>
        <dt>All tasks</dt>
        <dd>{{ count.all }}</dd>
      </div>
      <div>
        <dt>Active</dt>
        <dd>{{ count.active }}</dd>
      </div>
      <div>
        <dt>Completed</dt>
        <dd>{{ count.completed }}</dd>
      </div>
    </dl>

    <section class="focus" aria-labelledby="focus-title">
      <div class="focus__header">
        <div>
          <p class="eyebrow">Next up</p>
          <h2 id="focus-title">Active tasks</h2>
        </div>
        <RouterLink to="/tasks">View all tasks</RouterLink>
      </div>

      <ul v-if="activeTasks.length" class="focus__list">
        <li v-for="task in activeTasks" :key="task.id">{{ task.title }}</li>
      </ul>
      <p v-else class="focus__empty">
        Nothing is waiting. Add a task when you are ready to plan your next step.
      </p>
    </section>
  </section>
</template>

<style scoped>
.today-view {
  max-width: 52rem;
}

.eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 750;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: -0.045em;
  line-height: 1.08;
}

.description {
  max-width: 40rem;
  margin: var(--space-4) 0 0;
  color: var(--color-text-muted);
  font-size: 1.0625rem;
  line-height: 1.65;
}

.summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  margin: var(--space-8) 0 0;
}

.summary div,
.focus {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgb(24 26 32 / 6%);
}

.summary div {
  padding: var(--space-5);
}

.summary dt {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  font-weight: 650;
}

.summary dd {
  margin: var(--space-2) 0 0;
  font-size: 2rem;
  font-weight: 750;
}

.focus {
  padding: var(--space-5);
  margin-top: var(--space-5);
}

.focus__header {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
}

h2 {
  margin: 0;
  font-size: 1.375rem;
}

.focus__header a {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  color: var(--color-primary);
  font-weight: 700;
}

.focus__list {
  display: grid;
  gap: var(--space-3);
  padding: 0;
  margin: var(--space-5) 0 0;
  list-style: none;
}

.focus__list li {
  padding: var(--space-4);
  background: var(--color-surface-soft);
  border-radius: var(--radius-sm);
  line-height: 1.5;
}

.focus__empty {
  margin: var(--space-5) 0 0;
  color: var(--color-text-muted);
  line-height: 1.6;
}

@media (max-width: 560px) {
  .summary {
    grid-template-columns: 1fr;
  }

  .focus__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
