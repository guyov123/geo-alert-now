export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_security_event: boolean
          link: string
          location: string
          source: string
          timestamp: string
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          is_security_event?: boolean
          link: string
          location: string
          source: string
          timestamp: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_security_event?: boolean
          link?: string
          location?: string
          source?: string
          timestamp?: string
          title?: string
        }
        Relationships: []
      }
      location_history: {
        Row: {
          city: string | null
          created_at: string | null
          id: string
          latitude: number
          longitude: number
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          id?: string
          latitude: number
          longitude: number
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string | null
          id?: string
          latitude?: number
          longitude?: number
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          categories: string[] | null
          created_at: string | null
          enabled: boolean | null
          id: string
          radius_km: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          categories?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          radius_km?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          categories?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          radius_km?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          fcm_token: string | null
          id: string
          last_location_lat: number | null
          last_location_lng: number | null
          last_location_update: string | null
          location: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fcm_token?: string | null
          id: string
          last_location_lat?: number | null
          last_location_lng?: number | null
          last_location_update?: string | null
          location?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fcm_token?: string | null
          id?: string
          last_location_lat?: number | null
          last_location_lng?: number | null
          last_location_update?: string | null
          location?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rss_sources: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          url?: string
        }
        Relationships: []
      }
      rss_sources_old: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      user_alert_history: {
        Row: {
          alert_id: string
          created_at: string
          id: string
          is_relevant: boolean
          user_id: string
        }
        Insert: {
          alert_id: string
          created_at?: string
          id?: string
          is_relevant?: boolean
          user_id: string
        }
        Update: {
          alert_id?: string
          created_at?: string
          id?: string
          is_relevant?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_alert_history_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_rss_preferences: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          source_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          source_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          source_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rss_preferences_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "rss_sources"
            referencedColumns: ["id"]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
