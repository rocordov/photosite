# Client Session Details Collector

This implementation adds client session tracking capabilities to the website by capturing browser and user details and storing them in a Supabase database.

## Files Created/Modified

1. **`assets/js/customizations.js`** - Main script that collects and stores session details.
2. **`assets/js/components/component-loader.js`** - Modified to load the customizations script on every page.
3. **`secrets/supabase.key`** - Contains the Supabase anon key for API access.
4. **`customizations-test.html`** - Test page to verify the functionality.

## How It Works

1. When a user visits any page on the site, the `customizations.js` script is loaded automatically via the component loader.
2. The script collects client information like browser details, OS, screen resolution, etc.
3. If the user is authenticated with Supabase, it also captures user information (ID, email, etc.)
4. This information is stored in the `client_session_details` table in the Supabase database.
5. To prevent spam, details are only stored once per browser session (using `sessionStorage`).

## Features

- Automatic collection of 10+ browser/client data points
- User authentication detection and profile linking
- Session-based throttling to prevent excessive database writes
- Fallback mechanisms for loading the Supabase client
- Comprehensive error handling and debug logging
- Compatible with the existing modular component system

## Testing

1. Open `customizations-test.html` in your browser to test the functionality.
2. Click "Manually Test Data Collection & Storage" to trigger data collection.
3. Check the browser console for detailed logs (if DEBUG is enabled).
4. The captured data will be displayed in the debug section of the page.
5. You can reset the session storage to test multiple times in the same browser session.

## Checking Data in Supabase

1. Log in to your Supabase dashboard.
2. Navigate to the Table Editor.
3. Select the `client_session_details` table.
4. You should see new rows appear as users visit your site.

## Production Considerations

1. Consider adding a privacy notice about data collection.
2. Implement data retention policies to manage database growth.
3. Create database indexes for common query patterns (already included in SQL).
4. Rotate the Supabase anon key periodically for security.
5. Create analytics views to extract insights from the collected data.
