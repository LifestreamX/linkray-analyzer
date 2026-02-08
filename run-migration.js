// Script to run Supabase migration programmatically
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env file');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Read migration file
  const migrationSql = fs.readFileSync(
    'supabase-migration-upsert-scans.sql',
    'utf8',
  );

  console.log('Running migration...\n');
  console.log(migrationSql);
  console.log('\n');

  // Note: The anon key typically doesn't have permissions to run DDL commands
  // This migration should be run via the Supabase SQL Editor with your database password
  console.log('⚠️  This migration requires database admin access.');
  console.log('📋 Copy the SQL above and paste it into:');
  console.log(
    '   https://app.supabase.com/project/fbjbkxweoujreepjystm/sql/new',
  );
  console.log('\n✅ Then click "RUN" in the SQL editor.');
}

runMigration().catch(console.error);
