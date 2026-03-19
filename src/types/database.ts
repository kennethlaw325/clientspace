// 此文件由 supabase gen types typescript 格式生成
// 如需重新生成，請確保設定 SUPABASE_ACCESS_TOKEN 環境變數後執行：
//   npm run gen:types
//
// 參考：https://supabase.com/docs/guides/database/api/generating-types

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
      workspaces: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          logo_url: string | null
          brand_color: string
          plan: "free" | "starter" | "pro"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          logo_url?: string | null
          brand_color?: string
          plan?: "free" | "starter" | "pro"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          brand_color?: string
          plan?: "free" | "starter" | "pro"
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          id: string
          workspace_id: string
          name: string
          email: string
          company: string | null
          avatar_url: string | null
          portal_token: string
          last_seen_at: string | null
          archived_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          email: string
          company?: string | null
          avatar_url?: string | null
          portal_token?: string
          last_seen_at?: string | null
          archived_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          email?: string
          company?: string | null
          avatar_url?: string | null
          portal_token?: string
          last_seen_at?: string | null
          archived_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          id: string
          workspace_id: string
          client_id: string
          name: string
          description: string | null
          status: "active" | "completed" | "archived"
          max_revisions: number
          used_revisions: number
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          client_id: string
          name: string
          description?: string | null
          status?: "active" | "completed" | "archived"
          max_revisions?: number
          used_revisions?: number
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          client_id?: string
          name?: string
          description?: string | null
          status?: "active" | "completed" | "archived"
          max_revisions?: number
          used_revisions?: number
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          status: "todo" | "in_progress" | "review" | "done"
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          status?: "todo" | "in_progress" | "review" | "done"
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          status?: "todo" | "in_progress" | "review" | "done"
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          id: string
          project_id: string
          deliverable_id: string | null
          uploaded_by_type: "freelancer" | "client"
          uploaded_by_id: string
          file_name: string
          file_size: number
          mime_type: string | null
          storage_path: string
          version: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          deliverable_id?: string | null
          uploaded_by_type: "freelancer" | "client"
          uploaded_by_id: string
          file_name: string
          file_size: number
          mime_type?: string | null
          storage_path: string
          version?: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          deliverable_id?: string | null
          uploaded_by_type?: "freelancer" | "client"
          uploaded_by_id?: string
          file_name?: string
          file_size?: number
          mime_type?: string | null
          storage_path?: string
          version?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          id: string
          project_id: string
          deliverable_id: string | null
          sender_type: "freelancer" | "client"
          sender_id: string
          content: string
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          deliverable_id?: string | null
          sender_type: "freelancer" | "client"
          sender_id: string
          content: string
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          deliverable_id?: string | null
          sender_type?: "freelancer" | "client"
          sender_id?: string
          content?: string
          parent_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          id: string
          workspace_id: string
          stripe_customer_id: string
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          plan: "free" | "starter" | "pro"
          status: "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "unpaid"
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          stripe_customer_id: string
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          plan?: "free" | "starter" | "pro"
          status?: "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "unpaid"
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          plan?: "free" | "starter" | "pro"
          status?: "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "unpaid"
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          id: string
          workspace_id: string
          client_id: string | null
          project_id: string | null
          actor_type: "freelancer" | "client" | "system"
          actor_id: string | null
          event_type: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          client_id?: string | null
          project_id?: string | null
          actor_type?: "freelancer" | "client" | "system"
          actor_id?: string | null
          event_type: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          client_id?: string | null
          project_id?: string | null
          actor_type?: "freelancer" | "client" | "system"
          actor_id?: string | null
          event_type?: string
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          id: string
          workspace_id: string
          client_id: string
          project_id: string | null
          invoice_number: string
          status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
          due_date: string | null
          tax_rate: number
          notes: string | null
          stripe_payment_link: string | null
          stripe_payment_intent_id: string | null
          total_amount: number
          is_recurring: boolean
          recurring_frequency: "monthly" | "quarterly" | "yearly" | null
          recurring_next_date: string | null
          recurring_end_date: string | null
          recurring_parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          client_id: string
          project_id?: string | null
          invoice_number: string
          status?: "draft" | "sent" | "paid" | "overdue" | "cancelled"
          due_date?: string | null
          tax_rate?: number
          notes?: string | null
          stripe_payment_link?: string | null
          stripe_payment_intent_id?: string | null
          total_amount?: number
          is_recurring?: boolean
          recurring_frequency?: "monthly" | "quarterly" | "yearly" | null
          recurring_next_date?: string | null
          recurring_end_date?: string | null
          recurring_parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          client_id?: string
          project_id?: string | null
          invoice_number?: string
          status?: "draft" | "sent" | "paid" | "overdue" | "cancelled"
          due_date?: string | null
          tax_rate?: number
          notes?: string | null
          stripe_payment_link?: string | null
          stripe_payment_intent_id?: string | null
          total_amount?: number
          is_recurring?: boolean
          recurring_frequency?: "monthly" | "quarterly" | "yearly" | null
          recurring_next_date?: string | null
          recurring_end_date?: string | null
          recurring_parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          amount: number
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity?: number
          unit_price?: number
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          quantity?: number
          unit_price?: number
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverable_reviews: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          file_url: string | null
          file_type: string | null
          status: "pending_review" | "approved" | "revision_requested"
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          file_url?: string | null
          file_type?: string | null
          status?: "pending_review" | "approved" | "revision_requested"
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          file_url?: string | null
          file_type?: string | null
          status?: "pending_review" | "approved" | "revision_requested"
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      review_comments: {
        Row: {
          id: string
          review_id: string
          author_type: "freelancer" | "client"
          author_name: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          author_type: "freelancer" | "client"
          author_name: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          author_type?: "freelancer" | "client"
          author_name?: string
          body?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_comments_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "deliverable_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_tokens: {
        Row: {
          id: string
          review_id: string
          token: string
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          token?: string
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          token?: string
          expires_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_tokens_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "deliverable_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          event_type: string
          email_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          email_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          email_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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

// Convenience types
export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"]
export type Client = Database["public"]["Tables"]["clients"]["Row"]
export type Project = Database["public"]["Tables"]["projects"]["Row"]
export type Deliverable = Database["public"]["Tables"]["deliverables"]["Row"]
export type FileRecord = Database["public"]["Tables"]["files"]["Row"]
export type Message = Database["public"]["Tables"]["messages"]["Row"]
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"]
export type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"]
export type Invoice = Database["public"]["Tables"]["invoices"]["Row"]
export type InvoiceItem = Database["public"]["Tables"]["invoice_items"]["Row"]
export type DeliverableReview = Database["public"]["Tables"]["deliverable_reviews"]["Row"]
export type ReviewComment = Database["public"]["Tables"]["review_comments"]["Row"]
export type ReviewToken = Database["public"]["Tables"]["review_tokens"]["Row"]
export type NotificationPreferenceRow = Database["public"]["Tables"]["notification_preferences"]["Row"]
