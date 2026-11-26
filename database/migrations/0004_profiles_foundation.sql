
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint

-- Composite unique index required by profiles foreign key.
CREATE UNIQUE INDEX IF NOT EXISTS uq_patch_versions_id_server_type
ON patch_versions (id, server_type);
--> statement-breakpoint

CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  entity_type entity_type_enum NOT NULL,
  patch_version_id uuid NOT NULL,
  server_type server_type_enum NOT NULL,
  effective_range tstzrange NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint

ALTER TABLE profiles
ADD CONSTRAINT fk_profiles_knowledge_entities
FOREIGN KEY (entity_id, entity_type)
REFERENCES knowledge_entities (entity_id, entity_type)
ON DELETE RESTRICT;
--> statement-breakpoint

ALTER TABLE profiles
ADD CONSTRAINT fk_profiles_patch_versions
FOREIGN KEY (patch_version_id, server_type)
REFERENCES patch_versions (id, server_type)
ON DELETE RESTRICT;
--> statement-breakpoint

ALTER TABLE profiles
ADD CONSTRAINT profiles_effective_range_excl
EXCLUDE USING gist (
  entity_id WITH =,
  entity_type WITH =,
  server_type WITH =,
  effective_range WITH &&
);
--> statement-breakpoint

ALTER TABLE profiles
ADD CONSTRAINT chk_effective_range_valid
CHECK (
  NOT isempty(effective_range)
  AND NOT lower_inf(effective_range)
  AND lower_inc(effective_range)
  AND NOT upper_inc(effective_range)
);
