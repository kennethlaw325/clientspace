// TODO: Generate with `npx supabase gen types typescript` after migrations
// For now, manual types matching our schema

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          brand_color: string;
          plan: "free" | "starter" | "pro";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          brand_color?: string;
          plan?: "free" | "starter" | "pro";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          brand_color?: string;
          plan?: "free" | "starter" | "pro";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          email: string;
          company: string | null;
          avatar_url: string | null;
          portal_token: string;
          last_seen_at: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          email: string;
          company?: string | null;
          avatar_url?: string | null;
          portal_token?: string;
          last_seen_at?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          email?: string;
          company?: string | null;
          avatar_url?: string | null;
          portal_token?: string;
          last_seen_at?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          workspace_id: string;
          client_id: string;
          name: string;
          description: string | null;
          status: "active" | "completed" | "archived";
          max_revisions: number;
          used_revisions: number;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          client_id: string;
          name: string;
          description?: string | null;
          status?: "active" | "completed" | "archived";
          max_revisions?: number;
          used_revisions?: number;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          client_id?: string;
          name?: string;
          description?: string | null;
          status?: "active" | "completed" | "archived";
          max_revisions?: number;
          used_revisions?: number;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      deliverables: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          status: "todo" | "in_progress" | "review" | "done";
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          status?: "todo" | "in_progress" | "review" | "done";
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          status?: "todo" | "in_progress" | "review" | "done";
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deliverables_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      files: {
        Row: {
          id: string;
          project_id: string;
          deliverable_id: string | null;
          uploaded_by_type: "freelancer" | "client";
          uploaded_by_id: string;
          file_name: string;
          file_size: number;
          mime_type: string | null;
          storage_path: string;
          version: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          deliverable_id?: string | null;
          uploaded_by_type: "freelancer" | "client";
          uploaded_by_id: string;
          file_name: string;
          file_size: number;
          mime_type?: string | null;
          storage_path: string;
          version?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          deliverable_id?: string | null;
          uploaded_by_type?: "freelancer" | "client";
          uploaded_by_id?: string;
          file_name?: string;
          file_size?: number;
          mime_type?: string | null;
          storage_path?: string;
          version?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "files_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "files_deliverable_id_fkey";
            columns: ["deliverable_id"];
            isOneToOne: false;
            referencedRelation: "deliverables";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          project_id: string;
          deliverable_id: string | null;
          sender_type: "freelancer" | "client";
          sender_id: string;
          content: string;
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          deliverable_id?: string | null;
          sender_type: "freelancer" | "client";
          sender_id: string;
          content: string;
          parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          deliverable_id?: string | null;
          sender_type?: "freelancer" | "client";
          sender_id?: string;
          content?: string;
          parent_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_deliverable_id_fkey";
            columns: ["deliverable_id"];
            isOneToOne: false;
            referencedRelation: "deliverables";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          workspace_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          plan: "free" | "starter" | "pro";
          status: "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "unpaid";
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          stripe_customer_id: string;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          plan?: "free" | "starter" | "pro";
          status?: "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "unpaid";
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          stripe_customer_id?: string;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          plan?: "free" | "starter" | "pro";
          status?: "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "unpaid";
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: true;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_logs: {
        Row: {
          id: string;
          workspace_id: string;
          client_id: string | null;
          project_id: string | null;
          actor_type: "freelancer" | "client" | "system";
          actor_id: string | null;
          event_type: string;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          client_id?: string | null;
          project_id?: string | null;
          actor_type?: "freelancer" | "client" | "system";
          actor_id?: string | null;
          event_type: string;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          client_id?: string | null;
          project_id?: string | null;
          actor_type?: "freelancer" | "client" | "system";
          actor_id?: string | null;
          event_type?: string;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_logs_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Convenience types
export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Deliverable = Database["public"]["Tables"]["deliverables"]["Row"];
export type FileRecord = Database["public"]["Tables"]["files"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"];
