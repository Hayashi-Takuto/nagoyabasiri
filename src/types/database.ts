export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      drive_sessions: {
        Row: {
          id: string
          user_id: string | null
          started_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          started_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          started_at?: string
          ended_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drive_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      gps_points: {
        Row: {
          id: number
          session_id: string
          latitude: number
          longitude: number
          recorded_at: string
        }
        Insert: {
          id?: number
          session_id: string
          latitude: number
          longitude: number
          recorded_at?: string
        }
        Update: {
          id?: number
          session_id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gps_points_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "drive_sessions"
            referencedColumns: ["id"]
          }
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

export type DriveSession = Database['public']['Tables']['drive_sessions']['Row']
export type GpsPoint = Database['public']['Tables']['gps_points']['Row']
