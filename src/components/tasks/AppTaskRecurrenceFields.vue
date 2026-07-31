<script setup lang="ts">
import AppSelectField from '@/shared/ui/AppSelectField.vue'

defineProps<{ disabled?: boolean; error?: string }>()

const recurrenceType = defineModel<string>('type', { required: true })
const weekdays = defineModel<number[]>('weekdays', { required: true })

const weekdayOptions = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]
</script>

<template>
  <div class="recurrence-fields">
    <AppSelectField>
      <template #label>Repeat</template>
      <select v-model="recurrenceType" name="recurrenceType" :disabled="disabled">
        <option value="">Does not repeat</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="weekdays">Selected weekdays</option>
      </select>
      <template #message>
        <span v-if="error" role="alert">{{ error }}</span>
        <span v-else>Recurring tasks require a due date.</span>
      </template>
    </AppSelectField>

    <fieldset v-if="recurrenceType === 'weekdays'" class="recurrence-fields__weekdays">
      <legend>Repeat on</legend>
      <label v-for="day in weekdayOptions" :key="day.value">
        <input v-model="weekdays" type="checkbox" :value="day.value" :disabled="disabled" />
        <span>{{ day.label }}</span>
      </label>
    </fieldset>
  </div>
</template>

<style scoped>
.recurrence-fields {
  display: grid;
  gap: var(--space-3);
}

.recurrence-fields__weekdays {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: 0;
  margin: 0;
  border: 0;
}

.recurrence-fields__weekdays legend {
  width: 100%;
  margin-bottom: var(--space-1);
  font-size: 0.875rem;
  font-weight: 650;
}

.recurrence-fields__weekdays label {
  display: grid;
  min-width: 2.75rem;
  min-height: 2.75rem;
  cursor: pointer;
  place-items: center;
}

.recurrence-fields__weekdays input {
  position: absolute;
  opacity: 0;
}

.recurrence-fields__weekdays span {
  display: grid;
  min-width: 2.75rem;
  min-height: 2.75rem;
  padding: var(--space-2);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-sm);
  place-items: center;
}

.recurrence-fields__weekdays input:checked + span {
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
}

.recurrence-fields__weekdays input:focus-visible + span {
  outline: 3px solid color-mix(in srgb, var(--color-focus) 35%, transparent);
  outline-offset: 2px;
}
</style>
