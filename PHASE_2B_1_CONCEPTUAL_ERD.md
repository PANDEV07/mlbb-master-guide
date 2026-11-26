# PHASE 2B.1 – Conceptual ER Diagram

```mermaid
erDiagram
    %% Stable identity tables
    KnowledgeEntity ||--|| Hero : "has"
    KnowledgeEntity ||--|| Item : "has"
    KnowledgeEntity ||--|| Emblem : "has"
    KnowledgeEntity ||--|| BattleSpell : "has"

    %% Domain specific tables (one‑to‑one with KnowledgeEntity)
    Hero }|..|{ KnowledgeEntity : "entity_id"
    Item }|..|{ KnowledgeEntity : "entity_id"
    Emblem }|..|{ KnowledgeEntity : "entity_id"
    BattleSpell }|..|{ KnowledgeEntity : "entity_id"

    %% Profile tables (one‑to‑many)
    Hero ||--o{ HeroProfile : "has"
    Item ||--o{ ItemProfile : "has"
    Emblem ||--o{ EmblemProfile : "has"
    BattleSpell ||--o{ SpellProfile : "has"

    %% Patch & Server version
    PatchVersion ||--|| ServerVersion : "belongs to"
    HeroProfile }|..|{ PatchVersion : "patch"
    ItemProfile }|..|{ PatchVersion : "patch"
    EmblemProfile }|..|{ PatchVersion : "patch"
    SpellProfile }|..|{ PatchVersion : "patch"
    BuildVersion }|..|{ PatchVersion : "patch"
    ItemRecipeVersion }|..|{ PatchVersion : "patch"

    %% Temporal constraint (conceptual, not a table)
    HeroProfile ||--|| EffectiveRange : "tstzrange"
    ItemProfile ||--|| EffectiveRange : "tstzrange"
    ItemRecipeVersion ||--|| EffectiveRange : "tstzrange"

    %% Provenance
    Source ||--o{ Evidence : "contains"
    Evidence ||--o{ ClaimEvidence : "links"
    KnowledgeClaim ||--o{ ClaimEvidence : "links"
    KnowledgeClaim }|..|{ KnowledgeEntity : "targets"
    ClaimVerificationHistory }|..|| KnowledgeClaim : "records"

    %% Item recipe version & components
    ItemRecipeVersion }|..|| Item : "for"
    ItemComponentRelation }|..|| ItemRecipeVersion : "belongs to"
    ItemComponentRelation }|..|| Item : "component"

    %% Build intelligence
    Build ||--o{ BuildVersion : "has"
    BuildContext ||--o{ BuildVersion : "used by"
    BuildVersion ||--o{ BuildItem : "contains"
    BuildItem }|..|| ItemProfile : "references"
    BuildVersion ||--o{ AlternativeItem : "alternatives"
    AlternativeItem }|..|| ItemProfile : "references"
    BuildVersion ||--|| BuildReasoning : "has"
    BuildReasoning ||--o{ BuildReasoningClaim : "references"
    BuildReasoningClaim }|..|| KnowledgeClaim : "references"

    %% Enumerations (shown as notes, not tables)
    ServerVersion : enum "ORIGINAL_SERVER, ADVANCE_SERVER"
    EntityType : enum "HERO, ITEM, EMBLEM, BATTLE_SPELL, OTHER"
    Stance : enum "SUPPORTING, CONTRADICTING, INCONCLUSIVE"
    VerificationStatus : enum "VERIFIED, UNVERIFIED, CONFLICTED, OUTDATED, NOT_FOUND, NOT_RESEARCHED"
```

*The diagram now reflects the corrected relationships, cardinalities, and additional tables introduced in Phase 2B.1 — Final Consistency Corrections.*