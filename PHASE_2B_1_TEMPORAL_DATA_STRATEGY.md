# PHASE 2B.1 – Temporal Data Strategy

## Goals
- Preserve **historical reconstruction** of every game‑knowledge entity across patches and server flavours.
- Prevent **overlapping active profiles** for the same entity on the same `server_version`.
- Distinguish **Original Server** vs **Advance Server** data throughout the model.
- Enable querying of **experiment** (cancelled, hot‑fix, re‑work) intervals.

## Core Concepts
| Concept | Description |
|---------|-------------|
| `effective_range` | PostgreSQL `tstzrange` (timestamp with time‑zone) representing the inclusive start and exclusive end of a profile’s validity. |
| `server_version` | Text enum (`ORIGINAL_SERVER`, `ADVANCE_SERVER`). Stored on each *profile* table to avoid joins for server‑specific queries. |
| `patch_version` | foreign key to `PatchVersion` (stable reference to the semantic patch identifier). |
| `status` | Enum (`ACTIVE`, `REMOVED`, `REWORKED`, `EXPERIMENTAL`, `CANCELLED`). Indicates why a profile is no longer the primary source. |

## Table‑level Design (example for `HeroProfile`)

---
### PatchVersion composite foreign key

All profile tables now reference **both** `patch_version` **and** `server_version` via a composite foreign key:
```sql
ALTER TABLE hero_profile
  ADD CONSTRAINT fk_hero_profile_patch
    FOREIGN KEY (patch_version, server_version)
    REFERENCES patch_version(patch_version, server_version)
    ON DELETE RESTRICT;
```
The foreign‑key enforces `FOR KEY SHARE` locking on the referenced `patch_version` row during INSERT/UPDATE, preventing concurrent deletions or updates that could leave orphan profiles.
---

---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
```sql
CREATE TABLE hero_profile (
  hero_profile_id uuid PRIMARY KEY,
  hero_id          uuid NOT NULL REFERENCES hero(hero_id),
  patch_version    text NOT NULL REFERENCES patch_version(patch_version),
  server_version   text NOT NULL,
  effective_range  tstzrange NOT NULL,
  status           hero_profile_status NOT NULL,
  -- other attribute columns …
  CONSTRAINT hero_profile_no_overlap
    EXCLUDE USING gist (
      hero_id WITH =,
      server_version WITH =,
      effective_range WITH &&
    )
);
```
*The `EXCLUDE` constraint guarantees that for a given `hero_id` and `server_version` there can be **at most one** profile whose `effective_range` overlaps.*

### Why store `server_version` on the profile?
Storing `server_version` directly on the profile removes the need to join through `patch_version` to discover the server flavour. It also avoids inconsistencies that could arise if a `PatchVersion` were later re‑assigned to a different server.

## Overlap Rejection Example
Assume a hero `H‑001` on `ORIGINAL_SERVER`:
1. Insert profile **A** with `effective_range = '[2024-01-01 00:00+00, 2024-04-01 00:00+00)'`.
2. Attempt to insert profile **B** with `effective_range = '[2024-03-15 00:00+00, 2024-06-01 00:00+00)'`.
The `EXCLUDE` constraint rejects **B** because the ranges overlap (`2024-03-15` – `2024-04-01`). The error returned is:
```
ERROR:  conflicting key value violates exclusion constraint "hero_profile_no_overlap"
```
The correct resolution is to **split** the earlier profile or mark the overlapping portion as `EXPERIMENTAL`/`CANCELLED` with a separate record.

## Re‑construction Query
```sql
SELECT *
FROM hero_profile hp
WHERE hp.hero_id = 'H‑001'
  AND hp.server_version = 'ORIGINAL_SERVER'
  AND hp.effective_range @> '2024-05-10 12:00+00'::timestamptz;
```
The `@>` operator tests whether a timestamp falls inside the range, returning the unique active profile for that date.

## Handling Patch‑Specific Changes
- **Patch rollout**: create a new profile with a fresh `effective_range` beginning at the patch release timestamp.
- **Hot‑fix**: insert a temporary profile with `status = 'EXPERIMENTAL'` covering the hot‑fix interval.
- **Re‑work**: close the previous profile (`effective_to` = re‑work start) and open a new one.

## Alternatives (if `EXCLUDE` unavailable)
- Use a **trigger** that queries for overlapping ranges on `INSERT/UPDATE` and raises an exception. This is less performant and harder to maintain than native exclusion constraints.

## Summary
The temporal strategy relies on PostgreSQL range types with a **single exclusion constraint per profile table**. It enforces non‑overlap, isolates server flavours, and provides a clean, query‑friendly way to reconstruct historic state without redundant `patch_version` joins.
