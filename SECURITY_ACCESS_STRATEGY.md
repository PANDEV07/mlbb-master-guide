# SECURITY ACCESS STRATEGY

## 1. Overview
This document separates **server‑side PostgreSQL access** (used by the application backend via Drizzle) from **Supabase Data API access** (exposed to client‑side code through Supabase‑provided roles).  The goal is to keep the database secure while allowing future read‑only public consumption once proper security hardening is in place.

## 2. Access Paths
| Access Path | Mechanism | Primary Role | Typical Operations |
|------------|-----------|--------------|--------------------|
| **Server‑side read** | Direct PostgreSQL connection using the `postgres` administrative credential (service account) | `postgres` (administrative PostgreSQL role) | SELECT queries, reporting, internal analytics. |
| **Server‑side ingestion / admin** | Direct PostgreSQL connection via `postgres` (or a future limited app role) using Drizzle ORM | `postgres` (or custom `app_user` role) | INSERT, UPDATE, DELETE, schema migrations, batch ingest. |
| **Supabase Data API (public)** | HTTP REST/GraphQL endpoints provided by Supabase, gated by Supabase API roles | `anon` (unauthenticated) / `authenticated` (JWT‑based) | Read‑only queries once RLS policies are enabled. |
| **Supabase Data API (service)** | Supabase internal `service_role` used for server‑side functions that need to bypass RLS. | `service_role` (Supabase service role) | Currently unused for public access; can be used for internal functions after hardening. |

## 3. Recommended Strategy (no changes applied yet)
1. **Server‑side read access** – Continue using the existing `postgres` credential for backend services.  Treat this as an **administrative credential** and never expose it to the client.
2. **Server‑side ingestion & admin operations** – Perform all data ingestion through backend workflows (e.g., Next.js API routes, batch jobs) using the same `postgres` connection or a future **custom application role** with least‑privilege permissions.
3. **Public read‑only knowledge data** – Do **not** enable the Data API until Row‑Level Security (RLS) policies are defined and the over‑permissive grants are tightened.  When ready, expose read‑only endpoints via the `anon` role with RLS policies limiting rows to public‑available knowledge.
4. **Future authenticated user data** – Plan separate Supabase roles (`authenticated`) with RLS policies that restrict data to the owning user or allowed groups.
5. **Future Data API activation** – Activate only after:
   - RLS is enabled on all foundation tables.
   - Grants are reduced to the minimum required for each role.
   - A dedicated application role is created for backend operations.
   - Security hardening tasks are completed and documented.

**Note:** This strategy does **not** create any roles, policies, or enable the Data API at this time.  All actions remain planning‑only until explicit approval.
