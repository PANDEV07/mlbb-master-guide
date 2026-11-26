import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const connStr = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
if (!connStr) {
  console.error('Missing connection string');
  process.exit(1);
}

// Initialise client without prepared statements for simplicity
const sql = postgres(connStr, { prepare: false });

async function main() {
  // 1. Current and session user
  const [{ current_user }] = await sql`SELECT current_user`;
  const [{ session_user }] = await sql`SELECT session_user`;
  console.log('Current user:', current_user);
  console.log('Session user:', session_user);

  // 2. Role attributes for relevant roles
  const roles = await sql`
    SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolbypassrls
    FROM pg_roles
    WHERE rolname IN ('anon','authenticated','service_role','postgres')`;
  console.log('\nRole attributes:');
  roles.forEach(r => {
    console.log(`  ${r.rolname}: super=${r.rolsuper}, createrole=${r.rolcreaterole}, createdb=${r.rolcreatedb}, bypassrls=${r.rolbypassrls}`);
  });

  const tables = ['patch_versions','patch_changes','sources','entity_evidences'];

  console.log('\\nPrivileges per table and role:');
  for (const tbl of tables) {
    console.log(`\\nTable public.${tbl}:`);
    for (const role of ['anon','authenticated','service_role','postgres','PUBLIC']) {
      const rows = await sql`
        SELECT privilege_type
        FROM information_schema.role_table_grants
        WHERE table_schema = 'public' AND table_name = ${tbl} AND grantee = ${role}`;
      const privs = rows.map(r => r.privilege_type);
      console.log(`  ${role}: ${privs.length ? privs.join(', ') : '(none)'}`);
    }
  }

  // 3. RLS status and policy count per table
  console.log('\nRLS status:');
  for (const tbl of tables) {
    const [{ relrowsecurity, relforcerowsecurity, relhastriggers }] = await sql`
      SELECT relrowsecurity, relforcerowsecurity, relhastriggers
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname='public' AND c.relname=${tbl}`;
    // Count policies
    const [{ policy_count }] = await sql`
      SELECT COUNT(*) as policy_count
      FROM pg_policy p
      JOIN pg_class c ON p.polrelid = c.oid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname='public' AND c.relname=${tbl}`;
    console.log(`  ${tbl}: relrowsecurity=${relrowsecurity}, relforcerowsecurity=${relforcerowsecurity}, policies=${policy_count}`);
  }

  await sql.end();
}

main().catch(err => {
  console.error('Audit error:', err);
  process.exit(1);
});
