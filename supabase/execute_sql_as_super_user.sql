-- SQL function for executing arbitrary SQL with elevated privileges
-- This function should be run in your Supabase SQL Editor

-- Create the function with SECURITY DEFINER to run with elevated privileges
CREATE OR REPLACE FUNCTION execute_sql_as_super_user(query text, params jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE query INTO result USING params;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM, 'code', SQLSTATE);
END;
$$;

-- Grant execution privileges to service_role
GRANT EXECUTE ON FUNCTION execute_sql_as_super_user TO service_role;

-- IMPORTANT SECURITY NOTES:
-- 1. This function allows arbitrary SQL execution with elevated privileges.
-- 2. It should ONLY be accessible through the secure Edge Function with API key validation.
-- 3. Ensure your API_SECRET_KEY is strong and kept confidential.
-- 4. Consider adding more granular permissions rather than allowing arbitrary SQL in production.
