-- 0004_patch_foundation.sql
-- This migration adds the profiles table and required constraints.

-- Ensure extension for exclusion constraints is available.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Composite unique key on patch_versions required for FK (id, server_type).
-- If it already exists in the database it will be ignored.
CREATE UNIQUE INDEX IF NOT EXISTS uq_patch_versions_id_server_type
  ON patch_versions (id, server_type);

-- Create profiles table.
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  entity_type entity_type_enum NOT NULL,
  patch_version_id uuid NOT NULL,
  server_type server_type_enum NOT NULL,
  effective_range tstzrange NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Composite foreign key to knowledge_entities (entity_id, entity_type) with RESTRICT.
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_knowledge_entities
    FOREIGN KEY (entity_id, entity_type)
    REFERENCES knowledge_entities (entity_id, entity_type)
    ON DELETE RESTRICT;

-- Composite foreign key to patch_versions (id, server_type) with RESTRICT.
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_patch_versions
    FOREIGN KEY (patch_version_id, server_type)
    REFERENCES patch_versions (id, server_type)
    ON DELETE RESTRICT;

-- Exclusion constraint to prevent overlapping effective_range for the same entity & server.
ALTER TABLE profiles
  ADD CONSTRAINT profiles_effective_range_excl
    EXCLUDE USING gist (
      entity_id WITH =,
      entity_type WITH =,
      server_type WITH =,
      effective_range WITH &&
    );

-- CHECK constraint enforcing non‑empty, finite lower bound, inclusive lower, exclusive upper.
ALTER TABLE profiles
  ADD CONSTRAINT chk_effective_range_valid
    CHECK (
      NOT isempty(effective_range) AND
      NOT lower_inf(effective_range) AND
      lower_inc(effective_range) AND
      NOT upper_inc(effective_range)
    );
