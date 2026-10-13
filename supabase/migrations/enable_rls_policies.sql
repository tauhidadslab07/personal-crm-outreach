-- Run this in your Supabase SQL Editor if you wish to allow anonymous/public access to these tables:

-- 1. Disable RLS or grant permissive policies for anon/authenticated roles:
ALTER TABLE IF EXISTS leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies if needed:
DROP POLICY IF EXISTS "Public access to leads" ON leads;
DROP POLICY IF EXISTS "Public access to follow_ups" ON follow_ups;
DROP POLICY IF EXISTS "Public access to meetings" ON meetings;
DROP POLICY IF EXISTS "Public access to projects" ON projects;
DROP POLICY IF EXISTS "Public access to tasks" ON tasks;

-- 3. Create permissive policies allowing full CRUD for anon:
CREATE POLICY "Public access to leads" ON leads FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public access to follow_ups" ON follow_ups FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public access to meetings" ON meetings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public access to projects" ON projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public access to tasks" ON tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
