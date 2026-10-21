/*
# Revoke public execute on handle_new_user trigger function

## Changes
- Revoke EXECUTE on `public.handle_new_user()` from anon and authenticated roles
- The function is a trigger that runs on auth.users INSERT; it should not be callable via the REST API

## Security
- Prevents anon/authenticated roles from calling the function directly via /rest/v1/rpc/handle_new_user
- The trigger still fires automatically on new user signup
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
