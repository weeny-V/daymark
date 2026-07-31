export interface Project {
  id: string
  name: string
}

export interface Tag {
  id: string
  name: string
}

export interface TaskOrganization {
  version: 1
  projects: Project[]
  tags: Tag[]
}
