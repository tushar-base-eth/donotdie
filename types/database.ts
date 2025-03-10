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
      daily_volume: {
        Row: {
          date: string
          user_id: string
          volume: number
        }
        Insert: {
          date: string
          user_id: string
          volume?: number
        }
        Update: {
          date?: string
          user_id?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_volume_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          id: string
          is_deleted: boolean | null
          name: string
        }
        Insert: {
          id?: string
          is_deleted?: boolean | null
          name: string
        }
        Update: {
          id?: string
          is_deleted?: boolean | null
          name?: string
        }
        Relationships: []
      }
      exercise_equipment: {
        Row: {
          equipment_id: string
          exercise_id: string
        }
        Insert: {
          equipment_id: string
          exercise_id: string
        }
        Update: {
          equipment_id?: string
          exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_equipment_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: Database["public"]["Enums"]["exercise_category"]
          id: string
          is_deleted: boolean | null
          name: string
          primary_muscle_group: Database["public"]["Enums"]["muscle_group"]
          secondary_muscle_group:
            | Database["public"]["Enums"]["muscle_group"]
            | null
          uses_distance: boolean | null
          uses_duration: boolean | null
          uses_reps: boolean | null
          uses_weight: boolean | null
        }
        Insert: {
          category: Database["public"]["Enums"]["exercise_category"]
          id?: string
          is_deleted?: boolean | null
          name: string
          primary_muscle_group: Database["public"]["Enums"]["muscle_group"]
          secondary_muscle_group?:
            | Database["public"]["Enums"]["muscle_group"]
            | null
          uses_distance?: boolean | null
          uses_duration?: boolean | null
          uses_reps?: boolean | null
          uses_weight?: boolean | null
        }
        Update: {
          category?: Database["public"]["Enums"]["exercise_category"]
          id?: string
          is_deleted?: boolean | null
          name?: string
          primary_muscle_group?: Database["public"]["Enums"]["muscle_group"]
          secondary_muscle_group?:
            | Database["public"]["Enums"]["muscle_group"]
            | null
          uses_distance?: boolean | null
          uses_duration?: boolean | null
          uses_reps?: boolean | null
          uses_weight?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          body_fat_percentage: number | null
          created_at: string
          date_of_birth: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          height_cm: number | null
          id: string
          name: string
          theme_preference: Database["public"]["Enums"]["theme_preference_type"]
          total_volume: number
          total_workouts: number
          unit_preference: Database["public"]["Enums"]["unit_preference_type"]
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          body_fat_percentage?: number | null
          created_at?: string
          date_of_birth?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          id: string
          name: string
          theme_preference?: Database["public"]["Enums"]["theme_preference_type"]
          total_volume?: number
          total_workouts?: number
          unit_preference?: Database["public"]["Enums"]["unit_preference_type"]
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          body_fat_percentage?: number | null
          created_at?: string
          date_of_birth?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          id?: string
          name?: string
          theme_preference?: Database["public"]["Enums"]["theme_preference_type"]
          total_volume?: number
          total_workouts?: number
          unit_preference?: Database["public"]["Enums"]["unit_preference_type"]
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      sets: {
        Row: {
          created_at: string
          distance_meters: number | null
          duration_seconds: number | null
          id: string
          reps: number | null
          set_number: number
          weight_kg: number | null
          workout_exercise_id: string
        }
        Insert: {
          created_at?: string
          distance_meters?: number | null
          duration_seconds?: number | null
          id?: string
          reps?: number | null
          set_number: number
          weight_kg?: number | null
          workout_exercise_id: string
        }
        Update: {
          created_at?: string
          distance_meters?: number | null
          duration_seconds?: number | null
          id?: string
          reps?: number | null
          set_number?: number
          weight_kg?: number | null
          workout_exercise_id?: string
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
      user_exercise_equipment: {
        Row: {
          equipment_id: string
          user_exercise_id: string
        }
        Insert: {
          equipment_id: string
          user_exercise_id: string
        }
        Update: {
          equipment_id?: string
          user_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_exercise_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_exercise_equipment_user_exercise_id_fkey"
            columns: ["user_exercise_id"]
            isOneToOne: false
            referencedRelation: "user_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      user_exercises: {
        Row: {
          category: Database["public"]["Enums"]["exercise_category"]
          created_at: string | null
          id: string
          name: string
          primary_muscle_group: Database["public"]["Enums"]["muscle_group"]
          secondary_muscle_group:
            | Database["public"]["Enums"]["muscle_group"]
            | null
          user_id: string
          uses_distance: boolean | null
          uses_duration: boolean | null
          uses_reps: boolean | null
          uses_weight: boolean | null
        }
        Insert: {
          category: Database["public"]["Enums"]["exercise_category"]
          created_at?: string | null
          id?: string
          name: string
          primary_muscle_group: Database["public"]["Enums"]["muscle_group"]
          secondary_muscle_group?:
            | Database["public"]["Enums"]["muscle_group"]
            | null
          user_id: string
          uses_distance?: boolean | null
          uses_duration?: boolean | null
          uses_reps?: boolean | null
          uses_weight?: boolean | null
        }
        Update: {
          category?: Database["public"]["Enums"]["exercise_category"]
          created_at?: string | null
          id?: string
          name?: string
          primary_muscle_group?: Database["public"]["Enums"]["muscle_group"]
          secondary_muscle_group?:
            | Database["public"]["Enums"]["muscle_group"]
            | null
          user_id?: string
          uses_distance?: boolean | null
          uses_duration?: boolean | null
          uses_reps?: boolean | null
          uses_weight?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_exercises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          created_at: string
          effort_level: Database["public"]["Enums"]["effort_level_type"] | null
          exercise_type: Database["public"]["Enums"]["exercise_source"]
          id: string
          order: number
          predefined_exercise_id: string | null
          user_exercise_id: string | null
          workout_id: string
        }
        Insert: {
          created_at?: string
          effort_level?: Database["public"]["Enums"]["effort_level_type"] | null
          exercise_type: Database["public"]["Enums"]["exercise_source"]
          id?: string
          order: number
          predefined_exercise_id?: string | null
          user_exercise_id?: string | null
          workout_id: string
        }
        Update: {
          created_at?: string
          effort_level?: Database["public"]["Enums"]["effort_level_type"] | null
          exercise_type?: Database["public"]["Enums"]["exercise_source"]
          id?: string
          order?: number
          predefined_exercise_id?: string | null
          user_exercise_id?: string | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_predefined_exercise_id_fkey"
            columns: ["predefined_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_user_exercise_id_fkey"
            columns: ["user_exercise_id"]
            isOneToOne: false
            referencedRelation: "user_exercises"
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
          created_at: string
          id: string
          user_id: string
          workout_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          workout_date?: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          workout_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      effort_level_type: "super_easy" | "easy" | "ok" | "hard" | "super_hard"
      exercise_category:
        | "strength_training"
        | "cardio"
        | "flexibility"
        | "other"
      exercise_source: "predefined" | "user"
      gender_type: "male" | "female" | "other"
      muscle_group:
        | "chest"
        | "back"
        | "legs"
        | "arms"
        | "core"
        | "full_body"
        | "other"
      theme_preference_type: "light" | "dark"
      unit_preference_type: "metric" | "imperial"
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
