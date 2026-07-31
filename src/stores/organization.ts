import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import { useTasksStore } from '@/stores/tasks'
import type { Project, Tag, TaskOrganization } from '@/types/Organization'

export const ORGANIZATION_STORAGE_KEY = 'daymark.organization'
export const EMPTY_ORGANIZATION: TaskOrganization = { version: 1, projects: [], tags: [] }

const isNamedEntity = (value: unknown): value is Project | Tag => {
  if (typeof value !== 'object' || value === null) return false
  const entity = value as Record<string, unknown>
  return typeof entity.id === 'string' && typeof entity.name === 'string' && !!entity.name.trim()
}

export const isTaskOrganization = (value: unknown): value is TaskOrganization => {
  if (typeof value !== 'object' || value === null) return false
  const organization = value as Record<string, unknown>
  if (
    organization.version !== 1 ||
    !Array.isArray(organization.projects) ||
    !organization.projects.every(isNamedEntity) ||
    !Array.isArray(organization.tags) ||
    !organization.tags.every(isNamedEntity)
  )
    return false

  const ids = [...organization.projects, ...organization.tags].map((entity) => entity.id)
  return new Set(ids).size === ids.length
}

export const useOrganizationStore = defineStore('organization', () => {
  const storage = useLocalStorage<TaskOrganization>({
    key: ORGANIZATION_STORAGE_KEY,
    fallback: () => structuredClone(EMPTY_ORGANIZATION),
    validate: isTaskOrganization,
  })
  const organization = ref<TaskOrganization>(structuredClone(EMPTY_ORGANIZATION))
  const selectedProjectId = ref('all')
  const selectedTagId = ref('all')
  let initialized = false

  const projects = computed(() => organization.value.projects)
  const tags = computed(() => organization.value.tags)
  const normalizedName = (name: string) => name.trim()
  const nameAvailable = (items: (Project | Tag)[], name: string, exceptId?: string) =>
    !items.some(
      (item) => item.id !== exceptId && item.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    )

  const initialize = () => {
    if (initialized) return
    organization.value = storage.get()
    watch(organization, (value) => storage.set(value), { deep: true })
    initialized = true
  }

  const addEntity = (kind: 'projects' | 'tags', name: string) => {
    const normalized = normalizedName(name)
    const items = organization.value[kind]
    if (!normalized || !nameAvailable(items, normalized)) return false
    items.push({ id: crypto.randomUUID(), name: normalized })
    return true
  }

  const renameEntity = (kind: 'projects' | 'tags', id: string, name: string) => {
    const normalized = normalizedName(name)
    const items = organization.value[kind]
    const item = items.find((entry) => entry.id === id)
    if (!item || !normalized || !nameAvailable(items, normalized, id)) return false
    item.name = normalized
    return true
  }

  const deleteProject = (id: string) => {
    if (!projects.value.some((project) => project.id === id)) return false
    organization.value.projects = projects.value.filter((project) => project.id !== id)
    useTasksStore().clearProject(id)
    if (selectedProjectId.value === id) selectedProjectId.value = 'all'
    return true
  }

  const deleteTag = (id: string) => {
    if (!tags.value.some((tag) => tag.id === id)) return false
    organization.value.tags = tags.value.filter((tag) => tag.id !== id)
    useTasksStore().clearTag(id)
    if (selectedTagId.value === id) selectedTagId.value = 'all'
    return true
  }

  const replaceAll = (value: TaskOrganization) => {
    organization.value = structuredClone(value)
    selectedProjectId.value = 'all'
    selectedTagId.value = 'all'
  }

  return {
    organization,
    projects,
    tags,
    selectedProjectId,
    selectedTagId,
    initialize,
    addProject: (name: string) => addEntity('projects', name),
    addTag: (name: string) => addEntity('tags', name),
    renameProject: (id: string, name: string) => renameEntity('projects', id, name),
    renameTag: (id: string, name: string) => renameEntity('tags', id, name),
    deleteProject,
    deleteTag,
    replaceAll,
  }
})
