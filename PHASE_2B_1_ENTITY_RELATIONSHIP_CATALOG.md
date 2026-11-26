# PHASE 2B.1 – Entity Relationship Catalog

## Stable Identity Tables
| Table | Primary Key | Description |
|-------|-------------|-------------|
| **Hero** | `hero_id` (UUID) | Stable identifier for each hero |
| **Item** | `item_id` (UUID) | Stable identifier for each item |
| **Emblem** | `emblem_id` (UUID) | Stable identifier for each emblem |
| **BattleSpell** | `spell_id` (UUID) | Stable identifier for each battle spell |
| **ServerVersion** | `server_version` (text) | `ORIGINAL_SERVER` or `ADVANCE_SERVER` |
| **PatchVersion** | `patch_version` (text) | Semantic version string |

## Patch‑Specific Profile Tables
| Table | FK to Stable | FK to Patch | FK to Server | Description |
|-------|--------------|------------|--------------|-------------|
| **HeroProfile** | `hero_id` | `patch_version` | `server_version` | Stats, abilities per patch |
| **ItemProfile** | `item_id` | `patch_version` | `server_version` | Stats, price per patch |
| **EmblemProfile** | `emblem_id` | `patch_version` | `server_version` | Cooldown, effect per patch |
| **SpellProfile** | `spell_id` | `patch_version` | `server_version` | Cooldown, mana cost per patch |

## Temporal Profile Tables (example)
| Table | Range Columns | Exclusion Constraint |
|-------|--------------|----------------------|
| **HeroProfile** | `effective_from` `effective_to` (`tstzrange`) | Prevent overlapping active profiles for same `hero_id` & `server_version` |
| **ItemProfile** | same as above | Same constraint |

## Provenance Tables
| Table | Primary Key | Description |
|-------|-------------|-------------|
| **Source** | `source_id` (UUID) | External source definition |
| **Evidence** | `evidence_id` (UUID) | Artifact linked to a source |
| **KnowledgeClaim** | `claim_id` (UUID) | Statement about an entity attribute |
| **ClaimEvidence** | composite PK (`claim_id`,`evidence_id`) | Links claim to evidence with `stance` enum |

## Junction / Association Tables
| Table | Description |
|-------|-------------|
| **ItemComponent** | Self‑referencing many‑to‑many linking `item_id` (parent) → `component_item_id` (child) with `quantity` and `order_index` |
| **Build** | Recommended build for a hero profile |
| **BuildItem** | Links `Build` to `ItemProfile` with `slot_order` |
| **BuildContext** | Attributes describing when a build applies (role, lane, game phase, ranked mode, opponent/ally composition) |
| **AlternativeItem** | Conditional replacement items for a build slot |

All tables are conceptual; actual DDL will be generated in later phases.
