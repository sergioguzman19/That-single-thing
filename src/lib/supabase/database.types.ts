// Escrito a mano a partir de supabase/migrations. Regenerar con `npm run db:types` una vez enlazado el proyecto.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      lanes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          position: number;
          created_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          color: string;
          position?: number;
          created_at?: string;
          archived_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["lanes"]["Insert"]>;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          lane_id: string;
          title: string;
          notes: string;
          position: number;
          created_at: string;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          lane_id: string;
          title: string;
          notes?: string;
          position?: number;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "tasks_lane_id_user_id_fkey";
            columns: ["lane_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "lanes";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      blocks: {
        Row: {
          id: string;
          user_id: string;
          lane_id: string;
          day_of_week: number;
          start_minute: number;
          end_minute: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          lane_id: string;
          day_of_week: number;
          start_minute: number;
          end_minute: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["blocks"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "blocks_lane_id_user_id_fkey";
            columns: ["lane_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "lanes";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          timezone: string;
          rot_days: number;
          focus_lane_id: string | null;
          focus_until: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          timezone?: string;
          rot_days?: number;
          focus_lane_id?: string | null;
          focus_until?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
