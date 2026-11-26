# PHASE 2A.3.3 – Grants Verification

## Role Attributes

| Role | Superuser | Create Role | Create DB | Bypass RLS |
|------|-----------|-------------|-----------|------------|
| **postgres** | false | true | true | true |
| **service_role** | false | false | false | true |
| **authenticated** | false | false | false | false |
| **anon** | false | false | false | false |

## Table Privileges (public schema)

| Table | Role | Privileges |
|-------|------|------------|
| **patch_versions** | anon | INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER |
|  | authenticated | INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER |
|  | service_role | INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER |
|  | postgres | INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER |
|  | PUBLIC | (none) |
| **patch_changes** | anon | INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER |
|  | authenticated | INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER |
|  | service_role | INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER |
|  | postgres | INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER |
|  | PUBLIC | (none) |
| **sources** | anon | INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER |
|  | authenticated | INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER |
|  | service_role | INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER |
|  | postgres | INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER |
|  | PUBLIC | (none) |
| **entity_evidences** | anon | INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER |
|  | authenticated | INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER |
|  | service_role | INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER |
|  | postgres | INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER |
|  | PUBLIC | (none) |

## Row-Level Security (RLS) Status

| Table | relrowsesecurity | relforcerowsecurity | Policies |
|-------|----------------|---------------------|----------|
| patch_versions | false | false | 0 |
| patch_changes | false | false | 0 |
| sources | false | false | 0 |
| entity_evidences | false | false | 0 |

*All queries executed with `node scripts/grants_audit.js` (run **outside sandbox** to reach Supabase).*