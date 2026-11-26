# PHASE 2B.1 – Core Game Knowledge Architecture (Corrected)

## Overview
This document defines the **conceptual architecture** for the core game‑knowledge domain of the **MLBB Master Guide**. It captures stable identities, patch‑specific profiles, provenance, item recipes, and build intelligence.

---

## KnowledgeEntity Registry (Cross‑Domain Uniqueness)

| Table | PK | FK | Notes |
|-------|----|----|-------|
| **KnowledgeEntity** | `entity_id` (UUID) | – | `entity_type` ENUM (`HERO`, `ITEM`, `EMBLEM`, `BATTLE_SPELL`, `OTHER`) and stable `canonical_name` |
| **Hero**, **Item**, **Emblem**, **BattleSpell** | domain‑specific PK (`hero_id`, `item_id`, …) | `entity_id` → KnowledgeEntity(`entity_id`) **ON DELETE RESTRICT** | `UNIQUE(entity_id)` ensures one‑to‑one link |

### Trigger `validate_entity_type`
```sql
-- The function locks the registry row to guarantee safe concurrent checks.
CREATE OR REPLACE FUNCTION validate_entity_type()
RETURNS trigger AS $$
DECLARE reg_type TEXT;
BEGIN
  -- Obtain a row‑level lock on the KnowledgeEntity row.
  SELECT entity_type INTO reg_type
  FROM knowledgeentity
  WHERE entity_id = NEW.entity_id
  FOR UPDATE;

  IF TG_TABLE_NAME = 'hero' AND reg_type <> 'HERO' THEN
    RAISE EXCEPTION 'KnowledgeEntity type mismatch: expected HERO';
  ELSIF TG_TABLE_NAME = 'item' AND reg_type <> 'ITEM' THEN
    RAISE EXCEPTION 'KnowledgeEntity type mismatch: expected ITEM';
  ELSIF TG_TABLE_NAME = 'emblem' AND reg_type <> 'EMBLEM' THEN
    RAISE EXCEPTION 'KnowledgeEntity type mismatch: expected EMBLEM';
  ELSIF TG_TABLE_NAME = 'battlespell' AND reg_type <> 'BATTLE_SPELL' THEN
    RAISE EXCEPTION 'KnowledgeEntity type mismatch: expected BATTLE_SPELL';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to each domain table (BEFORE INSERT OR UPDATE).
CREATE TRIGGER trg_hero_entity_type BEFORE INSERT OR UPDATE ON hero
FOR EACH ROW EXECUTE FUNCTION validate_entity_type();
CREATE TRIGGER trg_item_entity_type BEFORE INSERT OR UPDATE ON item
FOR EACH ROW EXECUTE FUNCTION validate_entity_type();
CREATE TRIGGER trg_emblem_entity_type BEFORE INSERT OR UPDATE ON emblem
FOR EACH ROW EXECUTE FUNCTION validate_entity_type();
CREATE TRIGGER trg_battlespell_entity_type BEFORE INSERT OR UPDATE ON battlespell
FOR EACH ROW EXECUTE FUNCTION validate_entity_type();
```

### Composite Foreign Key for Cross‑Domain Uniqueness
```sql
-- Add a composite unique index on (entity_id, entity_type) in KnowledgeEntity.
CREATE UNIQUE INDEX uq_knowledgeentity_id_type ON knowledgeentity(entity_id, entity_type);

-- Domain tables reference both columns, guaranteeing the type matches.
-- Corrected composite foreign key using explicit entity_type column
ALTER TABLE hero
  ADD COLUMN entity_type text NOT NULL DEFAULT 'HERO' CHECK (entity_type = 'HERO'),
  ADD CONSTRAINT fk_hero_entity
    FOREIGN KEY (entity_id, entity_type)
    REFERENCES knowledgeentity(entity_id, entity_type)
    ON DELETE RESTRICT;
-- Repeat analogous changes for item, emblem, battlespell tables, using their respective constant values."
-- Repeat for item, emblem, battlespell using their respective constants.
```

### Guarantees (PostgreSQL‑enforced)
- **Row‑level lock** (`FOR UPDATE`) in the trigger prevents two concurrent transactions from reading the same `entity_id` and associating it with different domains.
- **Composite FK** `(entity_id, entity_type)` ensures a `KnowledgeEntity` can only be linked to the matching domain table.
- **UNIQUE** on `entity_id` in each domain table still guarantees one‑to‑one.
- **Immutability** of `entity_type` is enforced because the composite FK does not allow an update that would change the constant value; any attempt to MODIFY `entity_type` would violate the FK and raise an error.
- **Orphan handling** remains as before – temporary orphans are cleaned by a periodic job; `ON DELETE RESTRICT` blocks removal while dependents exist.
```sql
CREATE OR REPLACE FUNCTION validate_entity_type()
RETURNS trigger AS $$
BEGIN
  IF TG_TABLE_NAME = 'hero' AND (SELECT entity_type FROM knowledgeentity WHERE entity_id = NEW.entity_id) <> 'HERO' THEN
    RAISE EXCEPTION 'KnowledgeEntity type mismatch: expected HERO';
  ELSIF TG_TABLE_NAME = 'item' AND (SELECT entity_type FROM knowledgeentity WHERE entity_id = NEW.entity_id) <> 'ITEM' THEN
    RAISE EXCEPTION 'KnowledgeEntity type mismatch: expected ITEM';
  ELSIF TG_TABLE_NAME = 'emblem' AND (SELECT entity_type FROM knowledgeentity WHERE entity_id = NEW.entity_id) <> 'EMBLEM' THEN
    RAISE EXCEPTION 'KnowledgeEntity type mismatch: expected EMBLEM';
  ELSIF TG_TABLE_NAME = 'battlespell' AND (SELECT entity_type FROM knowledgeentity WHERE entity_id = NEW.entity_id) <> 'BATTLE_SPELL' THEN
    RAISE EXCEPTION 'KnowledgeEntity type mismatch: expected BATTLE_SPELL';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to each domain table (BEFORE INSERT OR UPDATE)
CREATE TRIGGER trg_hero_entity_type BEFORE INSERT OR UPDATE ON hero
FOR EACH ROW EXECUTE FUNCTION validate_entity_type();
CREATE TRIGGER trg_item_entity_type BEFORE INSERT OR UPDATE ON item
FOR EACH ROW EXECUTE FUNCTION validate_entity_type();
CREATE TRIGGER trg_emblem_entity_type BEFORE INSERT OR UPDATE ON emblem
FOR EACH ROW EXECUTE FUNCTION validate_entity_type();
CREATE TRIGGER trg_battlespell_entity_type BEFORE INSERT OR UPDATE ON battlespell
FOR EACH ROW EXECUTE FUNCTION validate_entity_type();
```

### Guarantees
- **FK** guarantees the `entity_id` exists in `KnowledgeEntity`.
- **UNIQUE** on `entity_id` prevents a second domain row from referencing the same registry entry.
- **Trigger** enforces that `entity_type` stored in `KnowledgeEntity` matches the domain table; any mismatch aborts the transaction.
- **Concurrency**: because the trigger runs inside the same transaction as the INSERT/UPDATE, concurrent attempts to associate the same `entity_id` with different domains will be serialized by row‑level locks on `KnowledgeEntity` and will result in a duplicate‑key or trigger exception.
- **Lifecycle rules (application‑level)**: create `KnowledgeEntity` first, then domain row; delete dependent rows before removing the registry entry; changing `entity_type` after creation is disallowed (trigger will raise an exception). To change the logical type, a migration procedure must delete the old domain row and create a new one with a new `entity_id`.
- **Orphan registry handling**: a `KnowledgeEntity` without a linked domain row is allowed temporarily (e.g., during creation) but should be cleaned up by a periodic housekeeping job; FK `ON DELETE RESTRICT` prevents accidental removal while dependent rows exist.

| Table | PK | FK | Notes |
|-------|----|----|-------|
| **KnowledgeEntity** | `entity_id` (UUID) | – | `entity_type` ENUM (`HERO`, `ITEM`, `EMBLEM`, `BATTLE_SPELL`, `OTHER`). Holds a stable `canonical_name`.
| **Hero**, **Item**, **Emblem**, **BattleSpell** | domain‑specific PK (`hero_id`, `item_id`, …) | `entity_id` → KnowledgeEntity(`entity_id`) **ON DELETE RESTRICT**, plus a `CHECK (entity_type = '<DOMAIN>')` enforced via a **trigger** that validates the `entity_type` matches the domain. A **UNIQUE** constraint on each domain table’s `entity_id` guarantees a 1‑to‑1 link.

### Guarantees (PostgreSQL‑enforced)
- **FK** ensures the `entity_id` exists in `KnowledgeEntity`.
- **UNIQUE** on `domain_table.entity_id` prevents a second domain row from referencing the same registry entry.
- **Trigger** (`validate_entity_type`) checks that the `entity_type` stored in `KnowledgeEntity` matches the domain (e.g., `HERO` for Hero). This is the only relational mechanism needed to stop cross‑domain reuse.

### Application‑level lifecycle rules
- **Create**: Insert a row in `KnowledgeEntity` with correct `entity_type`; then insert the domain row referencing the returned `entity_id`.
- **Update**: Changing `entity_type` is prohibited (trigger raises error). Updating other domain fields is unrestricted.
- **Delete**: Must delete all dependent rows (profiles, claims, evidence) before deleting the domain row; only then can the `KnowledgeEntity` row be removed (FK `ON DELETE RESTRICT`).

---

## Temporal Model (Canonical Server Relationship)
- **ServerVersion** is modelled as an **ENUM** with values `ORIGINAL_SERVER` and `ADVANCE_SERVER`. It is stored directly on every *profile* table; no separate lookup table is required.
- Each profile table (e.g., `HeroProfile`, `ItemProfile`) contains:
  - `patch_version` (FK → `PatchVersion.patch_version`)
  - `server_version` (ENUM)
  - `effective_range` (`tstzrange`)
  - `status` (ENUM `ACTIVE`, `REMOVED`, `REWORKED`, `EXPERIMENTAL`, `CANCELLED`)
- **EXCLUDE constraint** (per profile table):
  ```sql
  EXCLUDE USING gist (
    hero_id          WITH =,
    server_version   WITH =,
    effective_range  WITH &&
  );
  ```
  This guarantees that for a given entity and server there is never an overlapping active interval.
- **Patch‑server coherence**: A trigger `check_patch_server_match` validates that `PatchVersion.server_version = profile.server_version` on INSERT/UPDATE. This is a **database‑enforced** rule (trigger) ensuring no contradictory patch‑server pairing.
- Historical reconstruction is performed by querying the profile whose `effective_range @> <timestamp>`.
- The required `btree_gist` extension must be installed for the equality operator on UUID/text.

---

## Provenance Model (Relational Correction)
| Table | PK | FK | Notes |
|-------|----|----|-------|
| **Source** | `source_id` (UUID) | – | `type`, `url`, `title`, `accessed_at` |
| **Evidence** | `evidence_id` (UUID) | `source_id` → Source(`source_id`) **ON DELETE RESTRICT** | `retrieved_at`, `published_at`, `locator`, `excerpt`, `content_hash` |
| **KnowledgeClaim** | `claim_id` (UUID) | `entity_id` → KnowledgeEntity(`entity_id`) **ON DELETE RESTRICT** | `attribute_key`, `value`, `verification_status`, `confidence_level`, `reviewer_id`, `reviewed_at` |
| **ClaimEvidence** | Composite PK (`claim_id`,`evidence_id`) | `claim_id` → KnowledgeClaim, `evidence_id` → Evidence **ON DELETE RESTRICT** | `stance` ENUM (`SUPPORTING`, `CONTRADICTING`, `INCONCLUSIVE`) |
| **ClaimVerificationHistory** | `history_id` (UUID) | `claim_id` → KnowledgeClaim **ON DELETE CASCADE** | `previous_status`, `new_status`, `reviewer_id`, `reviewed_at`, `note` |

### Key points
- `ClaimEvidence.stance` captures the relationship direction; a single `Evidence` can link to multiple claims with different stances.
- `ClaimVerificationHistory` stores every status change, allowing full reconstruction of a claim’s verification timeline.
- No direct FK from `KnowledgeClaim` to `Source` or `Evidence`; all provenance passes through the junction tables.

---

## Item Recipe (Patch‑Aware Relationship)
| Table | PK | FK | Notes |
|-------|----|----|-------|
| **ItemRecipeVersion** | `recipe_version_id` (UUID) | `item_id` → Item(`item_id`), `patch_version` → PatchVersion(`patch_version`), `server_version` (ENUM) | `effective_range` (`tstzrange`) defines the validity period of this recipe version. |
| **ItemComponentRelation** | Composite PK (`recipe_version_id`,`component_item_id`) | `recipe_version_id` → ItemRecipeVersion, `component_item_id` → Item(`item_id`) | `quantity`, `order_index` |

### Behaviour
- Each `Item` can have multiple `ItemRecipeVersion` rows, each tied to a specific `PatchVersion`/`ServerVersion` and an `effective_range`.
- Changing a recipe creates a new `ItemRecipeVersion` with a new `effective_range` (no UPDATE of existing rows). Historical recipes remain immutable.
- Cycle detection remains an **application‑level** responsibility; the schema does not enforce DAG constraints.

---

## Build Intelligence Model (Corrected Cardinalities)
| Table | PK | FK | Notes |
|-------|----|----|-------|
| **Build** | `build_id` (UUID) | – | Represents a logical build concept.
| **BuildContext** | `context_id` (UUID) | – | Attributes: `hero_profile_id`, `role`, `lane`, `game_phase`, `ranked_mode`, `opponent_composition`, `ally_composition`, `context_hash` (optional deduplication aid). One context can be reused by many builds.
| **BuildVersion** | `build_version_id` (UUID) | `build_id` → Build, `context_id` → BuildContext, `patch_version` → PatchVersion, `server_version` (ENUM) | Allows multiple versions of the same build under the same context (different reasoning, hot‑fixes, etc.). No unique constraint blocks this.
| **BuildItem** | Composite PK (`build_version_id`,`item_profile_id`) | `build_version_id` → BuildVersion, `item_profile_id` → ItemProfile | `slot_order` |
| **AlternativeItem** | Composite PK (`build_version_id`,`slot_order`,`alt_item_profile_id`) | `build_version_id` → BuildVersion, `alt_item_profile_id` → ItemProfile | `condition` (text) |
| **BuildReasoning** | `reasoning_id` (UUID) | `build_version_id` → BuildVersion | Free‑text; may reference many `KnowledgeClaim` via junction table **BuildReasoningClaim** (PK: `reasoning_id`,`claim_id`). |
| **BuildReasoningClaim** | Composite PK (`reasoning_id`,`claim_id`) | `reasoning_id` → BuildReasoning, `claim_id` → KnowledgeClaim | – |

---

## Domain Integrity (MLBB‑specific placeholders)
All illustrative examples use **generic placeholders** labeled as such (e.g., `[[Hero Placeholder]]`, `[[Skill Placeholder]]`). No factual MLBB data is asserted.

---

## References
- `PHASE_2B_1_ENTITY_RELATIONSHIP_CATALOG.md`
- `PHASE_2B_1_TEMPORAL_DATA_STRATEGY.md`
- `PHASE_2B_1_PROVENANCE_MODEL.md`
- `PHASE_2B_1_DESIGN_DECISIONS.md`
