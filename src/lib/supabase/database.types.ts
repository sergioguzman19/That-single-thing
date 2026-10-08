export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          created_at: string
          day_of_week: number
          end_minute: number
          id: string
          lane_id: string
          start_minute: number
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_minute: number
          id?: string
          lane_id: string
          start_minute: number
          user_id?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_minute?: number
          id?: string
          lane_id?: string
          start_minute?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_lane_id_user_id_fkey"
            columns: ["lane_id", "user_id"]
            isOneToOne: false
            referencedRelation: "lanes"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      focus_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          lane_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          lane_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          lane_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_events_lane_id_user_id_fkey"
            columns: ["lane_id", "user_id"]
            isOneToOne: false
            referencedRelation: "lanes"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      lanes: {
        Row: {
          archived_at: string | null
          color: string
          created_at: string
          id: string
          name: string
          position: number
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          color: string
          created_at?: string
          id?: string
          name: string
          position?: number
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          color?: string
          created_at?: string
          id?: string
          name?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          created_at: string
          key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          key: string
          user_id: string
        }
        Update: {
          created_at?: string
          key?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          aging_days: number
          created_at: string
          focus_lane_id: string | null
          focus_until: string | null
          id: string
          last_period_end: string | null
          last_task_id: string | null
          timezone: string
        }
        Insert: {
          aging_days?: number
          created_at?: string
          focus_lane_id?: string | null
          focus_until?: string | null
          id: string
          last_period_end?: string | null
          last_task_id?: string | null
          timezone?: string
        }
        Update: {
          aging_days?: number
          created_at?: string
          focus_lane_id?: string | null
          focus_until?: string | null
          id?: string
          last_period_end?: string | null
          last_task_id?: string | null
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_focus_lane_id_id_fkey"
            columns: ["focus_lane_id", "id"]
            isOneToOne: false
            referencedRelation: "lanes"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "profiles_last_task_id_fkey"
            columns: ["last_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string
          user_id?: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          aging_notified_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          lane_id: string
          notes: string
          position: number
          started_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          aging_notified_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lane_id: string
          notes?: string
          position?: number
          started_at?: string | null
          title: string
          user_id?: string
        }
        Update: {
          aging_notified_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lane_id?: string
          notes?: string
          position?: number
          started_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_lane_id_user_id_fkey"
            columns: ["lane_id", "user_id"]
            isOneToOne: false
            referencedRelation: "lanes"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      notifications_tick: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
