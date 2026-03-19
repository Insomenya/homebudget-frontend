export interface Member {
  id: number
  name: string
  icon: string
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface CreateMemberInput {
  name: string
  icon: string
}

export interface UpdateMemberInput extends CreateMemberInput {
  is_archived: boolean
}