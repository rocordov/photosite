#!/usr/bin/env python3
"""
Supabase Connection Test Script

This script demonstrates how to connect to a Supabase database using the
supabase-py library and perform basic operations.

Requirements:
- supabase-py: pip install supabase
- python-dotenv (optional, for loading credentials from .env file)
"""

import os
from supabase import create_client, Client
#!/usr/bin/env python3
"""
Supabase Connection Test Script

This script demonstrates how to connect to a Supabase database using the
supabase-py library and perform basic operations.

Requirements:
- supabase-py: pip install supabase
- python-dotenv (optional, for loading credentials from .env file)
"""

#!/usr/bin/env python3
"""
Supabase Connection Test Script

This script demonstrates how to connect to a Supabase database using the
supabase-py library and perform basic operations.

Requirements:
- supabase-py: pip install supabase
- python-dotenv (optional, for loading credentials from .env file)
"""

import os
from supabase import create_client, Client

# Supabase credentials
SUPABASE_URL = 'https://yyfypeedlmgqqhukjhbe.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZnlwZWVkbG1ncXFodWtqaGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDk1MzYsImV4cCI6MjA1ODc4NTUzNn0.8qkf2crtzNOUCNpzEm0zMG9eUEkK0ldj48oeN3vdbiQ'

class SupabaseManager:
    """Manages connections and operations with a Supabase database."""
    
    def __init__(self, url=SUPABASE_URL, key=SUPABASE_KEY):
        """Initialize the Supabase client with the provided credentials."""
        self.supabase: Client = create_client(url, key)
        print(f"Connected to Supabase project: {url}")
    
    def test_connection(self):
        """Test the connection to Supabase by attempting a simple query."""
        try:
            # Test query - this will try to access the public schema's tables
            # Adjust table name as needed - if this doesn't exist, it will still
            # validate your connection but return an empty result
            response = self.supabase.table('profiles').select('*').limit(1).execute()
            print("Connection test successful!")
            print(f"Response data: {response}")
            return True
        except Exception as e:
            print(f"Error testing connection: {e}")
            return False
    
    def create_text_entry(self, content):
        """Create a new text entry in the 'text_entries' table."""
        try:
            response = self.supabase.table('text_entries').insert({"content": content}).execute()
            print(f"Created new text entry: {content}")
            print(f"Response: {response}")
            return response.data
        except Exception as e:
            print(f"Error creating text entry: {e}")
            return None
    
    def list_text_entries(self, limit=10):
        """List the most recent text entries."""
        try:
            response = self.supabase.table('text_entries').select('*').order('created_at', desc=True).limit(limit).execute()
            print(f"Retrieved {len(response.data)} text entries")
            return response.data
        except Exception as e:
            print(f"Error listing text entries: {e}")
            return []


def main():
    """Main function to demonstrate Supabase connectivity."""
    print("Testing Supabase connection...")
    
    # Create Supabase manager instance
    supabase_manager = SupabaseManager()
    
    # Test the connection
    connection_success = supabase_manager.test_connection()
    
    if connection_success:
        # If the connection test is successful, demonstrate some operations
        # Uncomment these lines to test creating and listing entries
        
        # Create a sample text entry
        sample_text = "This is a test entry from Python!"
        supabase_manager.create_text_entry(sample_text)
        
        # List existing entries
        entries = supabase_manager.list_text_entries()
        if entries:
            print("\nText Entries:")
            for i, entry in enumerate(entries, 1):
                print(f"{i}. {entry.get('content', 'No content')} - {entry.get('created_at', 'Unknown date')}")
    
    print("\nConnection test complete.")


if __name__ == "__main__":
    main()
