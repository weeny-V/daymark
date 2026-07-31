export interface Note {
  id: string
  title: string
  body: string
  pinned: boolean
  linkedTaskIds: string[]
  createdAt: string
  updatedAt: string
}

export type NoteChanges = Partial<Pick<Note, 'title' | 'body'>>
