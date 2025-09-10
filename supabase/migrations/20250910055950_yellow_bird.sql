/*
  # Add RLS helper function

  1. Functions
    - `set_current_user_id` - Sets the current user ID for RLS policies
*/

-- Function to set current user ID for RLS
CREATE OR REPLACE FUNCTION set_current_user_id(user_id text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION set_current_user_id(text) TO authenticated, anon;