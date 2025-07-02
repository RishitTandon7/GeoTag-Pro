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
      friend_codes: {
        Row: {
          id: string
          code: string
          created_at: string
          is_active: boolean
          redeemed_by: string | null
          redeemed_at: string | null
        }
        Insert: {
          id?: string
          code: string
          created_at?: string
          is_active?: boolean
          redeemed_by?: string | null
          redeemed_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          created_at?: string
          is_active?: boolean
          redeemed_by?: string | null
          redeemed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friend_codes_redeemed_by_fkey"
            columns: ["redeemed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_tier: string
          subscription_status: string
          customer_id: string | null
          subscription_id: string | null
          price_id: string | null
          subscription_start_date: string | null
          subscription_end_date: string | null
          username: string
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: string
          subscription_status?: string
          customer_id?: string | null
          subscription_id?: string | null
          price_id?: string | null
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          username: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: string
          subscription_status?: string
          customer_id?: string | null
          subscription_id?: string | null
          price_id?: string | null
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_history: {
        Row: {
          id: string
          created_at: string
          user_id: string
          amount: number
          currency: string
          status: string
          payment_method: string
          payment_intent_id: string | null
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          amount: number
          currency: string
          status: string
          payment_method: string
          payment_intent_id?: string | null
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          amount?: number
          currency?: string
          status?: string
          payment_method?: string
          payment_intent_id?: string | null
          description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      subscription_status: "active" | "trialing" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "unpaid"
      subscription_tier: "free" | "friend" | "premium"
    }
  }
}