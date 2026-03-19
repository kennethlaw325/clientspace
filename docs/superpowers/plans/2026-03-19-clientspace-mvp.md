# ClientSpace MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working freelancer client portal MVP — auth, workspace, client/project management, file sharing, messaging, revision tracking, and client-facing portal with magic link access.

**Architecture:** Next.js 16 App Router + Supabase (Auth, PostgreSQL with RLS, Storage, Realtime). Supabase JS client for all data access (not Prisma) — this preserves RLS security and keeps one client for auth + queries + storage + realtime. ShadCN UI + Tailwind CSS v4 for components.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, ShadCN UI, Supabase (@supabase/ssr), Resend (email), Vitest (tests)

**Key Architecture Decisions:**
- **Supabase client over Prisma** — Prisma bypasses RLS, defeating Supabase's security model. We use Supabase JS client + generated types for type safety. RLS uses nested subqueries (e.g., `workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())`). At MVP scale (<1000 workspaces) this is fine; optimize with materialized views if needed later.
- **Client portal uses token-based access** — Clients don't create Supabase Auth accounts. They access via `/portal/[token]` URL. Server validates token, fetches data with service role client (bypasses RLS — all portal queries must filter by `client_id` explicitly). Tokens are UUIDs, no expiration for MVP. Freelancers can regenerate tokens to revoke access.
- **Freelancer uses Supabase Auth** — Email/password signup. RLS policies protect all data.
- **File versioning is display-only** — Same-name uploads increment a version counter for display. No rollback or version comparison in MVP.
- **Admin client (service role) is server-only** — `src/lib/supabase/admin.ts` must NEVER be imported in client components. Add JSDoc warning.

---

## File Structure

```
src/
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx              # Minimal public layout
│   │   ├── page.tsx                # Landing page (existing, will update)
│   │   └── pricing/page.tsx        # Pricing page
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard layout (sidebar + header)
│   │   ├── page.tsx                # Redirect to /projects
│   │   ├── clients/
│   │   │   ├── page.tsx            # Client list
│   │   │   └── [id]/page.tsx       # Client detail
│   │   ├── projects/
│   │   │   ├── page.tsx            # Project list
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Project detail + deliverables
│   │   │       ├── files/page.tsx  # Project files
│   │   │       └── messages/page.tsx # Project messages
│   │   └── settings/page.tsx       # Workspace settings (branding)
│   ├── (auth)/
│   │   ├── layout.tsx              # Auth layout (centered card)
│   │   ├── login/page.tsx          # Login page
│   │   └── signup/page.tsx         # Signup page
│   ├── auth/
│   │   └── callback/route.ts       # Supabase auth callback
│   ├── portal/
│   │   └── [token]/
│   │       ├── layout.tsx          # Portal layout (branded)
│   │       ├── page.tsx            # Portal home (project list)
│   │       └── [projectId]/
│   │           ├── page.tsx        # Project detail
│   │           ├── files/page.tsx  # Files view
│   │           └── messages/page.tsx # Messages view
│   ├── api/
│   │   └── portal/
│   │       └── send-link/route.ts  # Send magic link email
│   ├── layout.tsx                  # Root layout
│   └── globals.css
├── components/
│   ├── ui/                         # ShadCN components (auto-generated)
│   ├── dashboard/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── client-card.tsx
│   │   ├── add-client-dialog.tsx
│   │   ├── project-card.tsx
│   │   ├── add-project-dialog.tsx
│   │   ├── deliverable-board.tsx
│   │   ├── deliverable-column.tsx
│   │   ├── deliverable-item.tsx
│   │   ├── revision-counter.tsx
│   │   ├── file-upload.tsx
│   │   ├── file-list.tsx
│   │   ├── message-thread.tsx
│   │   └── message-input.tsx
│   └── portal/
│       ├── portal-header.tsx
│       ├── portal-project-card.tsx
│       └── portal-message-form.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client (Server Components/Actions)
│   │   └── admin.ts                # Service role client (portal access)
│   ├── actions/
│   │   ├── auth.ts                 # Signup, login, logout
│   │   ├── workspaces.ts           # Workspace CRUD
│   │   ├── clients.ts              # Client CRUD + magic link
│   │   ├── projects.ts             # Project CRUD
│   │   ├── deliverables.ts         # Deliverable CRUD + status
│   │   ├── files.ts                # File upload/download
│   │   └── messages.ts             # Message CRUD
│   └── utils.ts                    # cn() + helpers
├── types/
│   └── database.ts                 # Generated Supabase types
└── middleware.ts                    # Auth protection middleware

supabase/
├── config.toml
├── migrations/
│   ├── 00001_create_workspaces.sql
│   ├── 00002_create_clients.sql
│   ├── 00003_create_projects.sql
│   ├── 00004_create_deliverables.sql
│   ├── 00005_create_files.sql
│   ├── 00006_create_messages.sql
│   └── 00007_rls_policies.sql
└── seed.sql
```

---

## Database Schema

All migrations live in `supabase/migrations/`. Full SQL below.

### 00001_create_workspaces.sql
```sql
CREATE TABLE workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  brand_color TEXT NOT NULL DEFAULT '#6366f1',
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX idx_workspaces_slug ON workspaces(slug);
```

### 00002_create_clients.sql
```sql
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  avatar_url TEXT,
  portal_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, email)
);

CREATE INDEX idx_clients_workspace ON clients(workspace_id);
CREATE INDEX idx_clients_portal_token ON clients(portal_token);
```

### 00003_create_projects.sql
```sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  max_revisions INT NOT NULL DEFAULT 3,
  used_revisions INT NOT NULL DEFAULT 0,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_workspace ON projects(workspace_id);
CREATE INDEX idx_projects_client ON projects(client_id);
```

### 00004_create_deliverables.sql
```sql
CREATE TABLE deliverables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deliverables_project ON deliverables(project_id);
```

### 00005_create_files.sql
```sql
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES deliverables(id) ON DELETE SET NULL,
  uploaded_by_type TEXT NOT NULL CHECK (uploaded_by_type IN ('freelancer', 'client')),
  uploaded_by_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_files_project ON files(project_id);
```

### 00006_create_messages.sql
```sql
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES deliverables(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('freelancer', 'client')),
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_project ON messages(project_id);
CREATE INDEX idx_messages_parent ON messages(parent_id);
```

### 00007_rls_policies.sql
```sql
-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Workspaces: owner full access
CREATE POLICY "workspace_owner_all" ON workspaces
  FOR ALL USING (owner_id = auth.uid());

-- Clients: workspace owner access
CREATE POLICY "workspace_owner_clients" ON clients
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

-- Projects: workspace owner access
CREATE POLICY "workspace_owner_projects" ON projects
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

-- Deliverables: via project's workspace
CREATE POLICY "workspace_owner_deliverables" ON deliverables
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  );

-- Files: via project's workspace
CREATE POLICY "workspace_owner_files" ON files
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  );

-- Messages: via project's workspace
CREATE POLICY "workspace_owner_messages" ON messages
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  );
```

### Supabase Storage Setup
```sql
-- Run in Supabase SQL editor (storage buckets can't be created via migration)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('project-files', 'project-files', false, 52428800); -- 50MB limit

-- Storage RLS: workspace owner can upload/read
CREATE POLICY "workspace_owner_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "workspace_owner_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "workspace_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM workspaces WHERE owner_id = auth.uid()
    )
  );
```

---

## Task 1: Project Setup & Dependencies

**Files:**
- Modify: `package.json`
- Create: `src/lib/utils.ts`
- Create: `components.json` (ShadCN config)
- Modify: `src/app/globals.css`
- Modify: `tsconfig.json`

- [ ] **Step 1: Install Supabase dependencies**

```bash
cd D:/Claude/clientspace
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Install ShadCN UI + dependencies**

```bash
npx shadcn@latest init
# Choose: New York style, Zinc color, CSS variables: yes
```

This creates `components.json` and updates `globals.css` with CSS variables.

- [ ] **Step 3: Add core ShadCN components**

```bash
npx shadcn@latest add button card input label textarea badge separator avatar dropdown-menu dialog sheet tabs toast select
```

- [ ] **Step 4: Install additional dependencies**

```bash
npm install resend lucide-react clsx tailwind-merge
```

- [ ] **Step 5: Create utility file**

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
```

- [ ] **Step 6: Install Vitest for testing**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Create `src/test/setup.ts`:
```typescript
import "@testing-library/jest-dom/vitest";
```

Add to `package.json` scripts:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: install dependencies — Supabase, ShadCN UI, Vitest, Resend"
```

---

## Task 2: Supabase Configuration

**Prerequisites:** User must create a Supabase project at https://supabase.com/dashboard and get the project URL + anon key + service role key.

**Files:**
- Create: `.env.local`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/admin.ts`
- Create: `src/types/database.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Create environment file**

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Verify `.gitignore` includes `.env.local`.

- [ ] **Step 2: Create browser Supabase client**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 3: Create server Supabase client**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}
```

- [ ] **Step 4: Create admin Supabase client (for portal access)**

```typescript
// src/lib/supabase/admin.ts
/**
 * WARNING: This client uses the SERVICE_ROLE key which bypasses ALL RLS policies.
 * NEVER import this file in client components or expose it to the browser.
 * Only use in: Server Components, Server Actions, API Routes.
 * Always filter queries explicitly by client_id/workspace_id — RLS won't protect you here.
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient must only be used server-side");
  }
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

- [ ] **Step 5: Create placeholder types file**

```typescript
// src/types/database.ts
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
        Insert: Omit<Database["public"]["Tables"]["workspaces"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workspaces"]["Insert"]>;
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
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["clients"]["Row"], "id" | "portal_token" | "created_at" | "updated_at"> & {
          id?: string;
          portal_token?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["projects"]["Row"], "id" | "status" | "max_revisions" | "used_revisions" | "created_at" | "updated_at"> & {
          id?: string;
          status?: "active" | "completed" | "archived";
          max_revisions?: number;
          used_revisions?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["deliverables"]["Row"], "id" | "status" | "sort_order" | "created_at" | "updated_at"> & {
          id?: string;
          status?: "todo" | "in_progress" | "review" | "done";
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deliverables"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["files"]["Row"], "id" | "version" | "created_at"> & {
          id?: string;
          version?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["files"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["messages"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };
    };
  };
};

// Convenience types
export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Deliverable = Database["public"]["Tables"]["deliverables"]["Row"];
export type FileRecord = Database["public"]["Tables"]["files"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
```

- [ ] **Step 6: Write test for utils**

```typescript
// src/lib/__tests__/utils.test.ts
import { describe, it, expect } from "vitest";
import { formatDate, formatFileSize, generateSlug } from "../utils";

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });
  it("formats KB", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });
  it("formats MB", () => {
    expect(formatFileSize(2621440)).toBe("2.5 MB");
  });
});

describe("generateSlug", () => {
  it("converts to lowercase kebab-case", () => {
    expect(generateSlug("My Cool Agency")).toBe("my-cool-agency");
  });
  it("strips special characters", () => {
    expect(generateSlug("Test & Co.")).toBe("test-co");
  });
});
```

- [ ] **Step 7: Run tests**

```bash
npm run test:run
```

Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: configure Supabase clients, types, and utilities"
```

---

## Task 3: Database Schema & Migrations

**Prerequisites:** Supabase CLI installed (`npm install -D supabase`), Supabase project created.

**Files:**
- Create: `supabase/config.toml` (via `supabase init`)
- Create: `supabase/migrations/*.sql` (all 7 migration files from schema section above)
- Create: `supabase/seed.sql`

- [ ] **Step 1: Initialize Supabase locally**

```bash
cd D:/Claude/clientspace
npm install -D supabase
npx supabase init
npx supabase link --project-ref YOUR_PROJECT_REF
```

**Git handling:** Commit `supabase/config.toml` and `supabase/migrations/`. Do NOT commit `supabase/.env` or `supabase/.temp/`. The `.gitignore` generated by `supabase init` handles this correctly.

- [ ] **Step 2: Create all migration files**

Create the 7 migration files listed in the Database Schema section above. Use sequential timestamps:

```bash
npx supabase migration new create_workspaces
npx supabase migration new create_clients
npx supabase migration new create_projects
npx supabase migration new create_deliverables
npx supabase migration new create_files
npx supabase migration new create_messages
npx supabase migration new rls_policies
```

Copy the SQL from the Database Schema section into each file.

- [ ] **Step 3: Create seed data**

```sql
-- supabase/seed.sql
-- Seed data is inserted after a user signs up via the app.
-- This file is for local development reference only.
-- To test locally, create a user in Supabase Auth dashboard first,
-- then use the app to create workspace/clients/projects.
```

- [ ] **Step 4: Push migrations to Supabase**

```bash
npx supabase db push
```

Expected: All migrations applied successfully.

- [ ] **Step 5: Generate TypeScript types**

```bash
npx supabase gen types typescript --linked > src/types/database.ts
```

This replaces the manual types from Task 2 with generated ones. Update the convenience type exports at the bottom of the file.

- [ ] **Step 6: Create storage bucket**

Run the storage SQL from the Database Schema section in the Supabase SQL Editor (Dashboard → SQL Editor).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: database schema — workspaces, clients, projects, deliverables, files, messages with RLS"
```

---

## Task 4: Authentication (Signup / Login / Logout)

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/signup/page.tsx`
- Create: `src/app/auth/callback/route.ts`
- Create: `src/lib/actions/auth.ts`

- [ ] **Step 1: Create auth server actions**

```typescript
// src/lib/actions/auth.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Check your email to confirm your account" };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/projects");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

- [ ] **Step 2: Create auth callback route**

```typescript
// src/app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/projects`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-failed`);
}
```

- [ ] **Step 3: Create auth layout**

```tsx
// src/app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  );
}
```

- [ ] **Step 4: Create login page**

```tsx
// src/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your ClientSpace account</CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-indigo-600 hover:underline">Sign up</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 5: Create signup page**

```tsx
// src/app/(auth)/signup/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(result.success);
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>Start managing your clients in minutes</CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
          )}
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">{success}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 hover:underline">Sign in</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 6: Verify auth flow manually**

Run `npm run dev`, navigate to `/signup`, create an account, confirm email, sign in. Verify redirect to `/projects` (will 404 — expected).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: authentication — signup, login, logout with Supabase Auth"
```

---

## Task 5: Auth Middleware & Route Protection

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create Next.js middleware**

```typescript
// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protected routes: redirect to login if not authenticated
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/projects") ||
    request.nextUrl.pathname.startsWith("/clients") ||
    request.nextUrl.pathname.startsWith("/settings");

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Auth routes: redirect to dashboard if already authenticated
  const isAuthRoute = request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/signup";

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|portal|auth).*)",
  ],
};
```

- [ ] **Step 2: Test middleware manually**

1. Sign out → visit `/projects` → should redirect to `/login`
2. Sign in → visit `/login` → should redirect to `/projects`

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: auth middleware — protect dashboard routes, redirect auth routes"
```

---

## Task 6: Workspace Onboarding

**Files:**
- Create: `src/lib/actions/workspaces.ts`
- Create: `src/app/(dashboard)/onboarding/page.tsx`
- Modify: `src/middleware.ts` (add onboarding redirect)

- [ ] **Step 1: Create workspace actions**

```typescript
// src/lib/actions/workspaces.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/utils";

export async function getWorkspace() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  return data;
}

export async function createWorkspace(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  if (!name) return { error: "Workspace name is required" };

  const slug = generateSlug(name);

  const { error } = await supabase.from("workspaces").insert({
    owner_id: user.id,
    name,
    slug,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "This workspace name is taken. Try another." };
    }
    return { error: error.message };
  }

  redirect("/projects");
}

export async function updateWorkspace(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  const brandColor = formData.get("brand_color") as string;

  const updates: Record<string, string> = {};
  if (name) updates.name = name;
  if (brandColor) updates.brand_color = brandColor;

  const { error } = await supabase
    .from("workspaces")
    .update(updates)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}
```

- [ ] **Step 2: Create onboarding page**

```tsx
// src/app/(dashboard)/onboarding/page.tsx
"use client";

import { useState } from "react";
import { createWorkspace } from "@/lib/actions/workspaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createWorkspace(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Set up your workspace</CardTitle>
          <CardDescription>
            This is what your clients will see. You can change it later.
          </CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input id="name" name="name" placeholder="e.g. Jane Design Studio" required />
              <p className="text-xs text-muted-foreground">
                This creates your portal URL: app.clientspace.io/jane-design-studio
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Workspace"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Update middleware — redirect to onboarding if no workspace**

Replace the entire `src/middleware.ts` with this complete version (adds onboarding check after auth check):

```typescript
// src/middleware.ts — COMPLETE FILE after Task 6
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/projects") ||
    request.nextUrl.pathname.startsWith("/clients") ||
    request.nextUrl.pathname.startsWith("/settings") ||
    request.nextUrl.pathname === "/onboarding";

  const isAuthRoute = request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/signup";

  // Not logged in → redirect to login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in → redirect away from auth pages
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    return NextResponse.redirect(url);
  }

  // Logged in + on dashboard → check workspace exists
  if (isProtectedRoute && user && request.nextUrl.pathname !== "/onboarding") {
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!workspace) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|portal|auth).*)",
  ],
};
```

- [ ] **Step 4: Test onboarding flow**

Sign up → confirm email → sign in → should redirect to `/onboarding` → create workspace → redirect to `/projects`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: workspace onboarding — post-signup workspace creation flow"
```

---

## Task 7: Dashboard Layout

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/components/dashboard/sidebar.tsx`
- Create: `src/components/dashboard/header.tsx`
- Create: `src/app/(dashboard)/page.tsx`

- [ ] **Step 1: Create sidebar component**

```tsx
// src/components/dashboard/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FolderOpen, Users, Settings, LayoutDashboard } from "lucide-react";

const navItems = [
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-white min-h-screen p-4 flex flex-col">
      <Link href="/projects" className="flex items-center gap-2 px-3 py-2 mb-6">
        <LayoutDashboard className="h-6 w-6 text-indigo-500" />
        <span className="text-xl font-bold">
          Client<span className="text-indigo-500">Space</span>
        </span>
      </Link>
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith(item.href)
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Create header component**

```tsx
// src/components/dashboard/header.tsx
import { signOut } from "@/lib/actions/auth";
import { getWorkspace } from "@/lib/actions/workspaces";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export async function Header() {
  const workspace = await getWorkspace();

  return (
    <header className="h-14 border-b bg-white px-6 flex items-center justify-between">
      <h2 className="text-sm font-medium text-slate-600">
        {workspace?.name}
      </h2>
      <form action={signOut}>
        <Button variant="ghost" size="sm" type="submit">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </form>
    </header>
  );
}
```

- [ ] **Step 3: Create dashboard layout**

```tsx
// src/app/(dashboard)/layout.tsx
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create dashboard home (redirect)**

```tsx
// src/app/(dashboard)/page.tsx
import { redirect } from "next/navigation";

export default function DashboardPage() {
  redirect("/projects");
}
```

- [ ] **Step 5: Verify layout renders**

Run `npm run dev`, sign in → should see sidebar + header. `/projects` will be empty — that's expected.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: dashboard layout — sidebar navigation + header"
```

---

## Task 8: Client Management

**Files:**
- Create: `src/lib/actions/clients.ts`
- Create: `src/app/(dashboard)/clients/page.tsx`
- Create: `src/app/(dashboard)/clients/[id]/page.tsx`
- Create: `src/components/dashboard/client-card.tsx`

- [ ] **Step 1: Create client server actions**

```typescript
// src/lib/actions/clients.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "./workspaces";

export async function getClients() {
  const supabase = await createClient();
  const workspace = await getWorkspace();
  if (!workspace) return [];

  const { data } = await supabase
    .from("clients")
    .select("*, projects(count)")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getClient(id: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("clients")
    .select("*, projects(*)")
    .eq("id", id)
    .single();

  return data;
}

export async function createClientAction(formData: FormData) {
  const supabase = await createClient();
  const workspace = await getWorkspace();
  if (!workspace) return { error: "No workspace found" };

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const company = formData.get("company") as string;

  if (!name || !email) return { error: "Name and email are required" };

  // Check plan limits
  const { count } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  const limits = { free: 2, starter: 10, pro: Infinity };
  const limit = limits[workspace.plan as keyof typeof limits] ?? 2;

  if ((count ?? 0) >= limit) {
    return { error: `You've reached your ${workspace.plan} plan limit of ${limit} clients. Upgrade to add more.` };
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      workspace_id: workspace.id,
      name,
      email,
      company: company || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return { error: "A client with this email already exists" };
    return { error: error.message };
  }

  return { data };
}

export async function updateClient(id: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const company = formData.get("company") as string;

  const { error } = await supabase
    .from("clients")
    .update({ name, email, company: company || null })
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteClient(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}
```

- [ ] **Step 2: Create client list page**

```tsx
// src/app/(dashboard)/clients/page.tsx
import { getClients } from "@/lib/actions/clients";
import { ClientCard } from "@/components/dashboard/client-card";
import { AddClientDialog } from "@/components/dashboard/add-client-dialog";
import { Users } from "lucide-react";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <AddClientDialog />
      </div>
      {clients.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No clients yet. Add your first client to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create client card component**

```tsx
// src/components/dashboard/client-card.tsx
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Building } from "lucide-react";
import type { Client } from "@/types/database";

export function ClientCard({ client }: { client: Client & { projects: { count: number }[] } }) {
  const projectCount = client.projects?.[0]?.count ?? 0;

  return (
    <Link href={`/clients/${client.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{client.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5" />
            {client.email}
          </div>
          {client.company && (
            <div className="flex items-center gap-2">
              <Building className="h-3.5 w-3.5" />
              {client.company}
            </div>
          )}
          <Badge variant="secondary">{projectCount} project{projectCount !== 1 ? "s" : ""}</Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 4: Create add client dialog**

```tsx
// src/components/dashboard/add-client-dialog.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientAction } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export function AddClientDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createClientAction(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new client</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company (optional)</Label>
            <Input id="company" name="company" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Client"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: Create client detail page**

```tsx
// src/app/(dashboard)/clients/[id]/page.tsx
import { notFound } from "next/navigation";
import { getClient } from "@/lib/actions/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{client.name}</h1>
      <p className="text-muted-foreground mb-6">{client.email}</p>

      <h2 className="text-lg font-semibold mb-4">Projects</h2>
      {client.projects?.length === 0 ? (
        <p className="text-muted-foreground">No projects yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {client.projects?.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{project.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge>{project.status}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: client management — list, create, detail pages"
```

---

## Task 9: Project Management

**Files:**
- Create: `src/lib/actions/projects.ts`
- Create: `src/app/(dashboard)/projects/page.tsx`
- Create: `src/app/(dashboard)/projects/[id]/page.tsx`
- Create: `src/components/dashboard/project-card.tsx`
- Create: `src/components/dashboard/add-project-dialog.tsx`

- [ ] **Step 1: Create project server actions**

```typescript
// src/lib/actions/projects.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "./workspaces";

export async function getProjects() {
  const supabase = await createClient();
  const workspace = await getWorkspace();
  if (!workspace) return [];

  const { data } = await supabase
    .from("projects")
    .select("*, clients(name, email), deliverables(count)")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getProject(id: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("projects")
    .select("*, clients(name, email), deliverables(*)")
    .eq("id", id)
    .single();

  return data;
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const workspace = await getWorkspace();
  if (!workspace) return { error: "No workspace found" };

  const name = formData.get("name") as string;
  const clientId = formData.get("client_id") as string;
  const description = formData.get("description") as string;
  const maxRevisions = parseInt(formData.get("max_revisions") as string) || 3;

  if (!name || !clientId) return { error: "Name and client are required" };

  const { data, error } = await supabase
    .from("projects")
    .insert({
      workspace_id: workspace.id,
      client_id: clientId,
      name,
      description: description || null,
      max_revisions: maxRevisions,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function updateProjectStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function incrementRevision(projectId: string) {
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("used_revisions, max_revisions")
    .eq("id", projectId)
    .single();

  if (!project) return { error: "Project not found" };

  const { error } = await supabase
    .from("projects")
    .update({ used_revisions: project.used_revisions + 1 })
    .eq("id", projectId);

  if (error) return { error: error.message };
  return { success: true, used: project.used_revisions + 1, max: project.max_revisions };
}
```

- [ ] **Step 2: Create project list page with project card and add dialog**

Follow the same pattern as client list (Task 8). Project card shows: name, client name, status badge, deliverable count, revision counter ("2/3 revisions"), due date.

Add project dialog includes: project name, select client (dropdown from `getClients()`), description, max revisions (default 3), due date.

- [ ] **Step 3: Create project detail page**

```tsx
// src/app/(dashboard)/projects/[id]/page.tsx
import { notFound } from "next/navigation";
import { getProject } from "@/lib/actions/projects";
import { DeliverableBoard } from "@/components/dashboard/deliverable-board";
import { RevisionCounter } from "@/components/dashboard/revision-counter";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">
            Client: {project.clients?.name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <RevisionCounter used={project.used_revisions} max={project.max_revisions} />
          <Badge>{project.status}</Badge>
        </div>
      </div>

      <Tabs defaultValue="deliverables">
        <TabsList>
          <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
          <TabsTrigger value="files" asChild>
            <Link href={`/projects/${id}/files`}>Files</Link>
          </TabsTrigger>
          <TabsTrigger value="messages" asChild>
            <Link href={`/projects/${id}/messages`}>Messages</Link>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="deliverables" className="mt-4">
          <DeliverableBoard
            projectId={id}
            deliverables={project.deliverables ?? []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: project management — list, create, detail with tabs"
```

---

## Task 10: Deliverable Board & Revision Tracking

**Files:**
- Create: `src/lib/actions/deliverables.ts`
- Create: `src/components/dashboard/deliverable-board.tsx`
- Create: `src/components/dashboard/deliverable-column.tsx`
- Create: `src/components/dashboard/deliverable-item.tsx`
- Create: `src/components/dashboard/revision-counter.tsx`

- [ ] **Step 1: Create deliverable server actions**

```typescript
// src/lib/actions/deliverables.ts
"use server";

import { createClient } from "@/lib/supabase/server";

export async function createDeliverable(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  if (!title) return { error: "Title is required" };

  // Get next sort order
  const { data: existing } = await supabase
    .from("deliverables")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const sortOrder = existing?.[0] ? existing[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from("deliverables")
    .insert({ project_id: projectId, title, description: description || null, sort_order: sortOrder })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function updateDeliverableStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("deliverables")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteDeliverable(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("deliverables").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}
```

- [ ] **Step 2: Create revision counter component**

```tsx
// src/components/dashboard/revision-counter.tsx
import { cn } from "@/lib/utils";

export function RevisionCounter({ used, max }: { used: number; max: number }) {
  const percentage = max > 0 ? (used / max) * 100 : 0;
  const isOverLimit = used >= max;

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-6 rounded-sm",
              i < used
                ? isOverLimit ? "bg-red-500" : "bg-indigo-500"
                : "bg-slate-200"
            )}
          />
        ))}
      </div>
      <span className={cn(
        "font-medium",
        isOverLimit ? "text-red-600" : "text-muted-foreground"
      )}>
        {used}/{max} revisions
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Create deliverable board (kanban-style columns)**

```tsx
// src/components/dashboard/deliverable-board.tsx
"use client";

import { useRouter } from "next/navigation";
import { DeliverableColumn } from "./deliverable-column";
import { updateDeliverableStatus } from "@/lib/actions/deliverables";
import type { Deliverable } from "@/types/database";

const columns = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
] as const;

export function DeliverableBoard({
  projectId,
  deliverables,
}: {
  projectId: string;
  deliverables: Deliverable[];
}) {
  const router = useRouter();

  async function handleStatusChange(deliverableId: string, newStatus: string) {
    await updateDeliverableStatus(deliverableId, newStatus);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {columns.map((column) => (
        <DeliverableColumn
          key={column.id}
          title={column.label}
          status={column.id}
          projectId={projectId}
          deliverables={deliverables.filter((d) => d.status === column.id)}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create deliverable column component**

No drag-and-drop for MVP — use a dropdown to change status. Keep it simple.

```tsx
// src/components/dashboard/deliverable-column.tsx
"use client";

import { useRouter } from "next/navigation";
import { createDeliverable } from "@/lib/actions/deliverables";
import { DeliverableItem } from "./deliverable-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useState } from "react";
import type { Deliverable } from "@/types/database";

export function DeliverableColumn({
  title,
  status,
  projectId,
  deliverables,
  onStatusChange,
}: {
  title: string;
  status: string;
  projectId: string;
  deliverables: Deliverable[];
  onStatusChange: (id: string, status: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const router = useRouter();

  async function handleAdd(formData: FormData) {
    await createDeliverable(projectId, formData);
    setAdding(false);
    router.refresh();
  }

  return (
    <div className="bg-slate-100 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-slate-700">{title}</h3>
        <span className="text-xs text-muted-foreground">{deliverables.length}</span>
      </div>
      <div className="space-y-2">
        {deliverables.map((d) => (
          <DeliverableItem key={d.id} deliverable={d} onStatusChange={onStatusChange} />
        ))}
        {status === "todo" && (
          adding ? (
            <form action={handleAdd} className="space-y-2">
              <Input name="title" placeholder="Deliverable title" autoFocus required />
              <div className="flex gap-2">
                <Button type="submit" size="sm">Add</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <Button variant="ghost" size="sm" className="w-full" onClick={() => setAdding(true)}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          )
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4b: Create deliverable item component**

```tsx
// src/components/dashboard/deliverable-item.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Deliverable } from "@/types/database";

const statuses = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

export function DeliverableItem({
  deliverable,
  onStatusChange,
}: {
  deliverable: Deliverable;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <Card className="bg-white">
      <CardContent className="p-3 space-y-2">
        <p className="text-sm font-medium">{deliverable.title}</p>
        {deliverable.description && (
          <p className="text-xs text-muted-foreground">{deliverable.description}</p>
        )}
        <Select
          value={deliverable.status}
          onValueChange={(value) => onStatusChange(deliverable.id, value)}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
```

Note: Add `select` to the ShadCN components installed in Task 1 Step 3.

- [ ] **Step 5: Test the kanban board**

Create a project → add deliverables → change status between columns. Verify revision counter displays correctly.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: deliverable kanban board + revision counter"
```

---

## Task 11: File Sharing

**Files:**
- Create: `src/lib/actions/files.ts`
- Create: `src/app/(dashboard)/projects/[id]/files/page.tsx`
- Create: `src/components/dashboard/file-upload.tsx`
- Create: `src/components/dashboard/file-list.tsx`

- [ ] **Step 1: Create file server actions**

```typescript
// src/lib/actions/files.ts
"use server";

import { createClient } from "@/lib/supabase/server";

export async function getProjectFiles(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function uploadFile(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file") as File;
  if (!file) return { error: "No file selected" };

  // Check file size (50MB limit)
  if (file.size > 52428800) {
    return { error: "File size must be under 50MB" };
  }

  // Get workspace ID for storage path
  const { data: project } = await supabase
    .from("projects")
    .select("workspace_id")
    .eq("id", projectId)
    .single();

  if (!project) return { error: "Project not found" };

  const storagePath = `${project.workspace_id}/${projectId}/${Date.now()}_${file.name}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("project-files")
    .upload(storagePath, file);

  if (uploadError) return { error: uploadError.message };

  // Check for existing file with same name (versioning)
  const { data: existing } = await supabase
    .from("files")
    .select("version")
    .eq("project_id", projectId)
    .eq("file_name", file.name)
    .order("version", { ascending: false })
    .limit(1);

  const version = existing?.[0] ? existing[0].version + 1 : 1;

  // Create file record
  const { data, error } = await supabase
    .from("files")
    .insert({
      project_id: projectId,
      uploaded_by_type: "freelancer",
      uploaded_by_id: user.id,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
      storage_path: storagePath,
      version,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function getFileUrl(storagePath: string) {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("project-files")
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  return data?.signedUrl ?? null;
}

export async function deleteFile(id: string, storagePath: string) {
  const supabase = await createClient();

  await supabase.storage.from("project-files").remove([storagePath]);
  const { error } = await supabase.from("files").delete().eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}
```

- [ ] **Step 2: Create file upload component**

Client-side component with drag-and-drop zone, progress indicator, and file type validation.

- [ ] **Step 3: Create file list component**

Displays files in a table with: name, size (formatted), version badge, uploaded date, download button, delete button.

- [ ] **Step 4: Create files page**

```tsx
// src/app/(dashboard)/projects/[id]/files/page.tsx
import { getProjectFiles } from "@/lib/actions/files";
import { FileUpload } from "@/components/dashboard/file-upload";
import { FileList } from "@/components/dashboard/file-list";

export default async function ProjectFilesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const files = await getProjectFiles(id);

  return (
    <div className="space-y-6">
      <FileUpload projectId={id} />
      <FileList files={files} />
    </div>
  );
}
```

- [ ] **Step 5: Test file upload/download**

Upload a file → verify it appears in list → download it → verify content matches.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: file sharing — upload, download, versioning with Supabase Storage"
```

---

## Task 12: Messaging System

**Files:**
- Create: `src/lib/actions/messages.ts`
- Create: `src/app/(dashboard)/projects/[id]/messages/page.tsx`
- Create: `src/components/dashboard/message-thread.tsx`
- Create: `src/components/dashboard/message-input.tsx`

- [ ] **Step 1: Create message server actions**

```typescript
// src/lib/actions/messages.ts
"use server";

import { createClient } from "@/lib/supabase/server";

export async function getProjectMessages(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("project_id", projectId)
    .is("parent_id", null)
    .order("created_at", { ascending: true });

  if (!data) return [];

  // Fetch replies for each message
  const messageIds = data.map((m) => m.id);
  const { data: replies } = await supabase
    .from("messages")
    .select("*")
    .in("parent_id", messageIds)
    .order("created_at", { ascending: true });

  return data.map((msg) => ({
    ...msg,
    replies: replies?.filter((r) => r.parent_id === msg.id) ?? [],
  }));
}

export async function sendMessage(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const content = formData.get("content") as string;
  const parentId = formData.get("parent_id") as string;

  if (!content?.trim()) return { error: "Message cannot be empty" };

  const { data, error } = await supabase
    .from("messages")
    .insert({
      project_id: projectId,
      sender_type: "freelancer",
      sender_id: user.id,
      content: content.trim(),
      parent_id: parentId || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}
```

- [ ] **Step 2: Create message thread component**

Displays messages with:
- Sender type badge (Freelancer / Client)
- Message content
- Timestamp
- "Reply" button that expands inline reply form
- Nested replies indented

- [ ] **Step 3: Create message input component**

Text area with send button. Supports both top-level messages and replies (via hidden `parent_id` input).

- [ ] **Step 4: Create messages page**

```tsx
// src/app/(dashboard)/projects/[id]/messages/page.tsx
import { getProjectMessages } from "@/lib/actions/messages";
import { MessageThread } from "@/components/dashboard/message-thread";
import { MessageInput } from "@/components/dashboard/message-input";

export default async function ProjectMessagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const messages = await getProjectMessages(id);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No messages yet. Start the conversation.
          </p>
        ) : (
          messages.map((msg) => (
            <MessageThread key={msg.id} message={msg} projectId={id} />
          ))
        )}
      </div>
      <MessageInput projectId={id} />
    </div>
  );
}
```

- [ ] **Step 5: Add Supabase Realtime subscription for live messages**

```tsx
// In message-thread.tsx or a wrapper component, add client-side realtime:
"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function useRealtimeMessages(projectId: string) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${projectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `project_id=eq.${projectId}` },
        () => router.refresh()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId, router, supabase]);
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: messaging system — threaded comments with realtime updates"
```

---

## Task 13: Client Portal — Magic Link Access

**Files:**
- Create: `src/app/portal/[token]/layout.tsx`
- Create: `src/app/portal/[token]/page.tsx`
- Create: `src/app/api/portal/send-link/route.ts`
- Create: `src/components/portal/portal-header.tsx`
- Modify: `src/lib/actions/clients.ts` (add portal link functions)

- [ ] **Step 1: Add portal link helpers to client actions**

```typescript
// Add to src/lib/actions/clients.ts

export async function getPortalUrl(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("portal_token")
    .eq("id", clientId)
    .single();

  if (!data) return null;
  return `${process.env.NEXT_PUBLIC_APP_URL}/portal/${data.portal_token}`;
}

export async function regeneratePortalToken(clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ portal_token: crypto.randomUUID() })
    .eq("id", clientId);

  if (error) return { error: error.message };
  return { success: true };
}
```

- [ ] **Step 2: Create send magic link API route**

```typescript
// src/app/api/portal/send-link/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await request.json();

  const { data: client } = await supabase
    .from("clients")
    .select("name, email, portal_token")
    .eq("id", clientId)
    .single();

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("name")
    .eq("owner_id", user.id)
    .single();

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${client.portal_token}`;

  await resend.emails.send({
    from: "ClientSpace <noreply@clientspace.io>",
    to: client.email,
    subject: `${workspace?.name} has shared a project portal with you`,
    html: `
      <h2>Hi ${client.name},</h2>
      <p>${workspace?.name} has invited you to their client portal.</p>
      <p><a href="${portalUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">View Portal</a></p>
      <p style="color:#666;font-size:14px;">This link is private to you. Do not share it.</p>
    `,
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create portal layout**

```tsx
// src/app/portal/[token]/layout.tsx
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PortalHeader } from "@/components/portal/portal-header";

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  // Validate token and get client + workspace
  const { data: client } = await supabase
    .from("clients")
    .select("*, workspaces(*)")
    .eq("portal_token", token)
    .single();

  if (!client) notFound();

  // Update last_seen_at
  await supabase
    .from("clients")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", client.id);

  const workspace = client.workspaces;

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader
        workspaceName={workspace?.name ?? ""}
        brandColor={workspace?.brand_color ?? "#6366f1"}
        logoUrl={workspace?.logo_url}
      />
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Create portal home page (project list)**

```tsx
// src/app/portal/[token]/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RevisionCounter } from "@/components/dashboard/revision-counter";

export default async function PortalHomePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("portal_token", token)
    .single();

  if (!client) notFound();

  const { data: projects } = await supabase
    .from("projects")
    .select("*, deliverables(count)")
    .eq("client_id", client.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Your Projects</h1>
      <div className="grid gap-4">
        {projects?.map((project) => (
          <Link key={project.id} href={`/portal/${token}/${project.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>{project.name}</CardTitle>
                  <Badge>{project.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <RevisionCounter used={project.used_revisions} max={project.max_revisions} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create portal header component**

```tsx
// src/components/portal/portal-header.tsx
export function PortalHeader({
  workspaceName,
  brandColor,
  logoUrl,
}: {
  workspaceName: string;
  brandColor: string;
  logoUrl: string | null;
}) {
  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        {logoUrl ? (
          <img src={logoUrl} alt={workspaceName} className="h-8 w-8 rounded" />
        ) : (
          <div className="h-8 w-8 rounded flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: brandColor }}>
            {workspaceName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="font-semibold text-lg">{workspaceName}</span>
      </div>
    </header>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: client portal — magic link access, branded layout, project list"
```

---

## Task 14: Client Portal — Project Views & Interactions

**Files:**
- Create: `src/app/portal/[token]/[projectId]/page.tsx`
- Create: `src/app/portal/[token]/[projectId]/files/page.tsx`
- Create: `src/app/portal/[token]/[projectId]/messages/page.tsx`
- Create: `src/components/portal/portal-message-form.tsx`

- [ ] **Step 1: Create portal project detail page**

Shows deliverables in read-only kanban view, revision counter, project description.

- [ ] **Step 2: Create portal files page**

Shows files uploaded by freelancer. Client can download (via signed URL) and upload their own files.

For client uploads, create a server action that uses the admin client:
```typescript
// src/lib/actions/portal.ts
"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function portalUploadFile(token: string, projectId: string, formData: FormData) {
  const supabase = createAdminClient();

  // Validate token
  const { data: client } = await supabase
    .from("clients")
    .select("id, workspace_id:workspaces(id)")
    .eq("portal_token", token)
    .single();

  if (!client) return { error: "Invalid portal access" };

  const file = formData.get("file") as File;
  if (!file) return { error: "No file selected" };
  if (file.size > 52428800) return { error: "File must be under 50MB" };

  const workspaceId = (client as any).workspace_id?.id;
  const storagePath = `${workspaceId}/${projectId}/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("project-files")
    .upload(storagePath, file);

  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from("files").insert({
    project_id: projectId,
    uploaded_by_type: "client",
    uploaded_by_id: client.id,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type || null,
    storage_path: storagePath,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function portalSendMessage(token: string, projectId: string, formData: FormData) {
  const supabase = createAdminClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("portal_token", token)
    .single();

  if (!client) return { error: "Invalid portal access" };

  const content = formData.get("content") as string;
  const parentId = formData.get("parent_id") as string;

  if (!content?.trim()) return { error: "Message cannot be empty" };

  const { error } = await supabase.from("messages").insert({
    project_id: projectId,
    sender_type: "client",
    sender_id: client.id,
    content: content.trim(),
    parent_id: parentId || null,
  });

  if (error) return { error: error.message };
  return { success: true };
}
```

- [ ] **Step 3: Create portal messages page**

Shows messages (same thread view as dashboard) + message input form for client to reply.

- [ ] **Step 4: Test full portal flow**

1. Create client → copy portal URL
2. Open in incognito → see projects
3. Open project → see deliverables, files, messages
4. Upload file as client → verify appears in freelancer dashboard
5. Send message as client → verify appears in freelancer dashboard

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: client portal — project detail, file upload, messaging"
```

---

## Task 15: Workspace Branding Settings

**Files:**
- Create: `src/app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Create settings page**

```tsx
// src/app/(dashboard)/settings/page.tsx
import { getWorkspace, updateWorkspace } from "@/lib/actions/workspaces";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const workspace = await getWorkspace();
  if (!workspace) redirect("/onboarding");

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Workspace Settings</h1>
      <SettingsForm workspace={workspace} />
    </div>
  );
}
```

- [ ] **Step 2: Create settings form (client component)**

Includes:
- Workspace name (text input)
- Brand color (color picker input)
- Logo upload (file input → upload to Supabase Storage `workspace-logos` bucket → save URL)
- Portal URL display (read-only, based on slug)
- Save button

- [ ] **Step 3: Add logo upload to workspace actions**

```typescript
// Add to src/lib/actions/workspaces.ts
export async function uploadLogo(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("logo") as File;
  if (!file) return { error: "No file selected" };

  const path = `${user.id}/logo_${Date.now()}.${file.name.split(".").pop()}`;

  const { error: uploadError } = await supabase.storage
    .from("workspace-logos")
    .upload(path, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from("workspace-logos")
    .getPublicUrl(path);

  const { error } = await supabase
    .from("workspaces")
    .update({ logo_url: publicUrl })
    .eq("owner_id", user.id);

  if (error) return { error: error.message };
  return { url: publicUrl };
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: workspace settings — name, brand color, logo upload"
```

---

## Task 16: Email Notifications

**Files:**
- Create: `src/lib/email.ts`
- Modify: `src/lib/actions/messages.ts` (trigger notification)
- Modify: `src/lib/actions/files.ts` (trigger notification)
- Modify: `src/lib/actions/deliverables.ts` (trigger notification)

- [ ] **Step 1: Create email helper**

```typescript
// src/lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type EmailType = "new_message" | "new_file" | "status_update";

interface NotificationParams {
  to: string;
  recipientName: string;
  workspaceName: string;
  projectName: string;
  type: EmailType;
  detail: string;
  portalUrl?: string;
}

export async function sendNotification({
  to, recipientName, workspaceName, projectName, type, detail, portalUrl,
}: NotificationParams) {
  const subjects: Record<EmailType, string> = {
    new_message: `New message on ${projectName}`,
    new_file: `New file uploaded to ${projectName}`,
    status_update: `${projectName} status updated`,
  };

  const ctaUrl = portalUrl ?? process.env.NEXT_PUBLIC_APP_URL;

  await resend.emails.send({
    from: `${workspaceName} via ClientSpace <noreply@clientspace.io>`,
    to,
    subject: subjects[type],
    html: `
      <h2>Hi ${recipientName},</h2>
      <p>${detail}</p>
      <p><a href="${ctaUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">View Project</a></p>
    `,
  });
}
```

- [ ] **Step 2: Add notification triggers to message and file actions**

When freelancer sends message → notify client via email (if client has email).
When client sends message → no email (freelancer checks dashboard).
When file uploaded → notify the other party.
When deliverable status changes → notify client.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: email notifications via Resend for messages, files, status changes"
```

---

## Task 17: Landing Page & Pricing

**Files:**
- Modify: `src/app/(marketing)/page.tsx` (existing landing page)
- Create: `src/app/(marketing)/layout.tsx`
- Create: `src/app/(marketing)/pricing/page.tsx`

- [ ] **Step 1: Create marketing layout**

Simple layout with nav (logo, Pricing link, Login/Signup buttons) and footer.

- [ ] **Step 2: Update landing page**

Expand existing landing page with:
- Hero section (existing, polish)
- Features grid (6 features: Portal, Files, Messaging, Revisions, Branding, Magic Links)
- How it works (3 steps: Sign up → Add clients → Share portal)
- Social proof placeholder
- CTA section

- [ ] **Step 3: Create pricing page**

Three-tier pricing cards matching the spec:
- Free: $0, 2 clients, 1 project/client, 100MB
- Starter: $12/mo, 10 clients, unlimited projects, 5GB
- Pro: $29/mo, unlimited clients, 50GB, custom domain

- [ ] **Step 4: Move existing page.tsx into marketing route group**

Move `src/app/page.tsx` to `src/app/(marketing)/page.tsx`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: landing page with features + pricing page"
```

---

## Task 18: Responsive Design & Final Polish

**Files:**
- Modify: multiple component files

- [ ] **Step 1: Mobile sidebar**

Convert sidebar to a sheet (ShadCN Sheet component) on mobile. Add hamburger menu button to header on `md:hidden`.

- [ ] **Step 2: Responsive grids**

Ensure all grid layouts collapse on mobile:
- Client cards: 1 column on mobile, 2 on md, 3 on lg
- Deliverable board: horizontal scroll on mobile (or stacked columns)
- File list: responsive table or card view on mobile

- [ ] **Step 3: Portal mobile optimization**

Portal should be fully usable on mobile (clients often check on phone):
- Stack layout
- Touch-friendly buttons
- File upload works on mobile

- [ ] **Step 4: Test all breakpoints**

Test at 375px (mobile), 768px (tablet), 1280px (desktop).

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: responsive design — mobile sidebar, grids, portal"
```

---

## Phase 2 & 3 (Future Plans)

These will be planned in separate documents after Phase 1 MVP ships.

### Phase 2: Monetization (Week 4-6)
- Stripe subscription billing (free/starter/pro plans)
- Invoice generation + Stripe payment links
- Change request workflow (scope creep prevention)
- Contract/proposal templates with e-signature

### Phase 3: Growth (Week 7-12)
- Custom domain support for client portals
- Project templates (reusable)
- Time tracking
- Team/agency features
- Zapier integration
- AI-powered project summaries

---

## Pre-Implementation Checklist

Before starting Task 1, ensure:
- [ ] Supabase project created at https://supabase.com/dashboard
- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` obtained
- [ ] `SUPABASE_SERVICE_ROLE_KEY` obtained
- [ ] Resend account created + API key (for email notifications)
- [ ] Supabase email auth enabled in dashboard (Authentication → Providers → Email)
