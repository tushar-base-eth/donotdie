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
      available_exercises: {
        Row: {
          id: string
          name: string
          primary_muscle_group: string
          secondary_muscle_group: string | null
        }
        Insert: {
          id?: string
          name: string
          primary_muscle_group: string
          secondary_muscle_group?: string | null
        }
        Update: {
          id?: string
          name?: string
          primary_muscle_group?: string
          secondary_muscle_group?: string | null
        }
        Relationships: []
      }
      daily_volume: {
        Row: {
          date: string
          id: number
          user_id: string | null
          volume: number
        }
        Insert: {
          date: string
          id?: number
          user_id?: string | null
          volume: number
        }
        Update: {
          date?: string
          id?: number
          user_id?: string | null
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_volume_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          endpoint: string
          id: string
          ip_address: string
          requests: number | null
          window_start: string | null
        }
        Insert: {
          endpoint: string
          id?: string
          ip_address: string
          requests?: number | null
          window_start?: string | null
        }
        Update: {
          endpoint?: string
          id?: string
          ip_address?: string
          requests?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      sets: {
        Row: {
          created_at: string | null
          id: string
          reps: number
          weight_kg: number
          workout_exercise_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reps: number
          weight_kg: number
          workout_exercise_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reps?: number
          weight_kg?: number
          workout_exercise_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sets_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          body_fat_percentage: number | null
          created_at: string | null
          date_of_birth: string
          email: string
          gender: string
          height_cm: number
          id: string
          name: string
          theme_preference: string | null
          total_volume: number | null
          total_workouts: number | null
          unit_preference: string | null
          updated_at: string | null
          weight_kg: number
        }
        Insert: {
          body_fat_percentage?: number | null
          created_at?: string | null
          date_of_birth: string
          email: string
          gender: string
          height_cm: number
          id?: string
          name: string
          theme_preference?: string | null
          total_volume?: number | null
          total_workouts?: number | null
          unit_preference?: string | null
          updated_at?: string | null
          weight_kg: number
        }
        Update: {
          body_fat_percentage?: number | null
          created_at?: string | null
          date_of_birth?: string
          email?: string
          gender?: string
          height_cm?: number
          id?: string
          name?: string
          theme_preference?: string | null
          total_volume?: number | null
          total_workouts?: number | null
          unit_preference?: string | null
          updated_at?: string | null
          weight_kg?: number
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          created_at: string | null
          exercise_id: string | null
          id: string
          workout_id: string | null
        }
        Insert: {
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          workout_id?: string | null
        }
        Update: {
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "available_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_ip_address: string
          p_endpoint: string
          p_max_requests: number
          p_window_minutes: number
        }
        Returns: boolean
      }
      create_user_with_profile: {
        Args: {
          user_email: string
          user_password: string
          user_name: string
          user_gender: string
          user_dob: string
          user_weight: number
          user_height: number
          user_bf: number
          user_unit: string
          user_theme: string
        }
        Returns: string
      }
      get_total_volume: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      get_volume_by_day: {
        Args: {
          p_user_id: string
          p_days: number
        }
        Returns: {
          date: string
          volume: number
        }[]
      }
      update_user_stats: {
        Args: {
          p_user_id: string
          p_volume: number
        }
        Returns: undefined
      }
      update_user_stats_on_delete: {
        Args: { p_user_id: string; p_volume: number };
        Returns: void;
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
