-- Fix handle_new_user to use correct auth.users column names
-- The previous migration `20260331000006_fix_users_rls.sql` incorrectly referenced `app_metadata` 
-- instead of `raw_app_meta_data`, which causes a Postgres error during INSERT on auth.users ("Database error saving new user").

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO users (id, full_name, phone, email, auth_provider)
  VALUES (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      'User'
    ),
    coalesce(nullif(trim(new.raw_user_meta_data->>'phone'), ''), ''),
    coalesce(new.email, ''),
    CASE
      WHEN new.raw_app_meta_data->>'provider' = 'google' THEN 'google'
      ELSE coalesce(new.raw_user_meta_data->>'auth_provider', 'email')
    END
  );
  RETURN new;
END;
$$;
