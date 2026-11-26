import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Missing connection string');
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false });

async function main() {
  // Current role/user
  const [{ current_user }] = await sql`SELECT current_user`;
  console.log('Current role:', current_user);

  // RLS status for foundation tables
  const rlsRows = await sql`
    SELECT c.relname AS table_name, c.relrowsecurity, c.relforcerowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname IN ('patch_versions','patch_changes','sources','entity_evidences')`;
  console.log('\nRLS status (relrowsecurity, relforcerowsecurity):');
  rlsRows.forEach(r => console.log(`${r.table_name}: enabled=${r.relrowsecurity}, force=${r.relforcerowsecurity}`));

  // Grants on each foundation table
  const tables = ['patch_versions','patch_changes','sources','entity_evidences'];
  for (const tbl of tables) {
    const grants = await sql`
      SELECT grantee, privilege_type
      FROM information_schema.role_table_grants
      WHERE table_schema='public' AND table_name=${tbl}`;
    console.log(`\nGrants on ${tbl}:`);
    if (grants.length === 0) console.log('  (none)');
    else grants.forEach(g => console.log(`  ${g.grantee} => ${g.privilege_type}`));
  }

  await sql.end();
}

main().catch(err => {
  console.error('Audit error:', err);
  process.exit(1);
});
