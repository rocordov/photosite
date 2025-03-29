# Supabase Browser & User Details Collector

This project implements a web page that collects browser details and authentication information, storing it in a Supabase database.

## Project Structure

```
supabase/
├── create_client_session_details.sql   # SQL script to create and configure the table
└── storedetails.html                  # Web page for collecting and storing details
```

## Setup Instructions

### 1. Create the Database Table

To create the necessary database table and set up Row Level Security (RLS) policies, follow these steps:

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Navigate to the SQL Editor in the left sidebar menu
3. Create a new query
4. Copy and paste the contents of `create_client_session_details.sql` into the SQL editor
5. Run the query

### 2. Configure Authentication Provider(s)

To enable Google authentication:

1. In your Supabase dashboard, navigate to Authentication > Providers
2. Enable Google authentication
3. Configure OAuth credentials (Client ID and Secret) from the Google Developer Console
4. Set the redirect URL to your hosted application URL

### 3. Test the Implementation

1. Open the `storedetails.html` file in your browser
2. You should be able to:
   - View browser details automatically detected
   - Sign in with Google (if configured in Supabase)
   - Store details in the database

## Key Features

1. **Browser Details Collection**:
   - Browser name and version
   - Operating system
   - Screen resolution
   - Language settings
   - User agent
   - Timezone information

2. **Authentication Integration**:
   - Google OAuth sign-in
   - User profile display
   - Association of browser details with authenticated user

3. **Database Storage**:
   - Automatic storage in Supabase PostgreSQL database
   - Row Level Security for data protection
   - User-specific data association

## Database Schema

The `client_session_details` table has the following structure:

```sql
CREATE TABLE client_session_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Browser and system details
  browser TEXT,
  os TEXT,
  screen_resolution TEXT,
  language TEXT,
  user_agent TEXT,
  color_depth TEXT,
  timezone TEXT,
  cookies_enabled BOOLEAN,
  referring_url TEXT,
  ip_address TEXT,
  
  -- User authentication and profile data
  user_id UUID,
  auth_provider TEXT,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  is_authenticated BOOLEAN DEFAULT FALSE
);
```

## Production Deployment Notes

For production use:

1. Store your Supabase URL and anon key in environment variables
2. Configure additional authentication providers as needed
3. Add privacy notices and user consent for data collection
4. Consider adding user management and data viewing capabilities
5. Implement data retention policies for the collected information
