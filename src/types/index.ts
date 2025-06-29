export interface User {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string | null
  created_at: string
  updated_at?: string
}

export interface Flow {
  id: string
  name: string
  description?: string
  status: 'active' | 'inactive' | 'draft'
  trigger_type: string
  actions: FlowAction[]
  created_at: string
  updated_at: string
  user_id: string
}

export interface FlowAction {
  id: string
  type: string
  config: Record<string, any>
  order: number
}

export interface Integration {
  id: string
  name: string
  type: string
  status: 'connected' | 'disconnected' | 'error'
  config: Record<string, any>
  created_at: string
  updated_at: string
  user_id: string
}

export interface Template {
  id: string
  name: string
  description?: string
  category: string
  config: Record<string, any>
  is_public: boolean
  created_at: string
  updated_at: string
  user_id: string
}
