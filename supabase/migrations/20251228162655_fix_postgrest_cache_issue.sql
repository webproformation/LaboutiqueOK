-- Force PostgREST complete cache reset
-- This migration ensures all tables are properly exposed to PostgREST

-- Ensure all public tables have proper grants for anon
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Force PostgREST reload
NOTIFY pgrst, 'reload schema';
