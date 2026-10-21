// Gerado a partir do banco do Supabase (generate_typescript_types).
// Ao mudar o banco com uma migration, gere de novo e substitua este arquivo.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          description: string
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          created_at?: string
          description: string
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          contact_name: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          instagram_url: string | null
          instagram_username: string | null
          internal_notes: string | null
          name: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          instagram_url?: string | null
          instagram_username?: string | null
          internal_notes?: string | null
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          instagram_url?: string | null
          instagram_username?: string | null
          internal_notes?: string | null
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_assets: {
        Row: {
          content_id: string
          created_at: string
          description: string | null
          id: string
          kind: string
          name: string
          url: string
        }
        Insert: {
          content_id: string
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          name: string
          url: string
        }
        Update: {
          content_id?: string
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          name?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: 'content_assets_content_id_fkey'
            columns: ['content_id']
            isOneToOne: false
            referencedRelation: 'contents'
            referencedColumns: ['id']
          },
        ]
      }
      contents: {
        Row: {
          archived_at: string | null
          briefing: string | null
          call_to_action: string | null
          caption: string | null
          client_id: string
          content_type: string
          created_at: string
          editorial_pillar: string | null
          final_asset_url: string | null
          finished_at: string | null
          format: string
          id: string
          internal_notes: string | null
          objective: string | null
          production_due_date: string | null
          production_status: string
          project_id: string | null
          published_at: string | null
          scheduled_date: string | null
          script: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          briefing?: string | null
          call_to_action?: string | null
          caption?: string | null
          client_id: string
          content_type?: string
          created_at?: string
          editorial_pillar?: string | null
          final_asset_url?: string | null
          finished_at?: string | null
          format?: string
          id?: string
          internal_notes?: string | null
          objective?: string | null
          production_due_date?: string | null
          production_status?: string
          project_id?: string | null
          published_at?: string | null
          scheduled_date?: string | null
          script?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          briefing?: string | null
          call_to_action?: string | null
          caption?: string | null
          client_id?: string
          content_type?: string
          created_at?: string
          editorial_pillar?: string | null
          final_asset_url?: string | null
          finished_at?: string | null
          format?: string
          id?: string
          internal_notes?: string | null
          objective?: string | null
          production_due_date?: string | null
          production_status?: string
          project_id?: string | null
          published_at?: string | null
          scheduled_date?: string | null
          script?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'contents_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contents_project_same_client_fk'
            columns: ['project_id', 'client_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id', 'client_id']
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          internal_notes: string | null
          name: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          internal_notes?: string | null
          name: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          internal_notes?: string | null
          name?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'projects_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
        ]
      }
      task_checklist_items: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean
          position: number
          task_id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean
          position?: number
          task_id: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean
          position?: number
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_checklist_items_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
        ]
      }
      tasks: {
        Row: {
          archived_at: string | null
          client_id: string | null
          completed_at: string | null
          content_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          client_id?: string | null
          completed_at?: string | null
          content_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          client_id?: string | null
          completed_at?: string | null
          content_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_content_same_client_fk'
            columns: ['content_id', 'client_id']
            isOneToOne: false
            referencedRelation: 'contents'
            referencedColumns: ['id', 'client_id']
          },
          {
            foreignKeyName: 'tasks_project_same_client_fk'
            columns: ['project_id', 'client_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id', 'client_id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicTables = Database['public']['Tables']

export type Tables<T extends keyof PublicTables> = PublicTables[T]['Row']
export type TablesInsert<T extends keyof PublicTables> = PublicTables[T]['Insert']
export type TablesUpdate<T extends keyof PublicTables> = PublicTables[T]['Update']
