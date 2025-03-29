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
import json
from supabase import create_client

# Supabase credentials
SUPABASE_URL = 'https://yyfypeedlmgqqhukjhbe.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZnlwZWVkbG1ncXFodWtqaGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDk1MzYsImV4cCI6MjA1ODc4NTUzNn0.8qkf2crtzNOUCNpzEm0zMG9eUEkK0ldj48oeN3vdbiQ'

# SQL scripts to create table and set up RLS
SQL_CREATE_TABLE = """
-- Create the text_entries table
CREATE TABLE text_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT
);
"""

SQL_SETUP_RLS = """
-- Set up Row Level Security (RLS)
ALTER TABLE text_entries ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anonymous inserts
CREATE POLICY "Allow anonymous inserts" 
    ON text_entries 
    FOR INSERT 
    TO anon 
    WITH CHECK (true);
"""

class SupabaseManager:
    """Manages connections and operations with a Supabase database."""
    
    def __init__(self, url=SUPABASE_URL, key=SUPABASE_KEY):
        """Initialize the Supabase client with the provided credentials."""
        self.supabase = create_client(url, key)
        print(f"Connected to Supabase project: {url}")
    
    def execute_sql(self, sql):
        """Execute a raw SQL query against the Supabase database."""
        try:
            # Use the rpc method to execute raw SQL
            # The 'rest' function is a REST endpoint that allows executing SQL directly
            response = self.supabase.rpc('execute_sql', {'query': sql}).execute()
            print(f"SQL execution successful")
            return True
        except Exception as e:
            print(f"Error executing SQL: {e}")
            return False
    
    def init_database(self):
        """Initialize the database by creating the table and setting up RLS."""
        print("Initializing database...")
        
        # Execute the table creation SQL
        print("Creating text_entries table...")
        table_created = self.execute_sql(SQL_CREATE_TABLE)
        
        if not table_created:
            print("Failed to create table. The table might already exist or there's an error.")
        else:
            print("Table created successfully.")
        
        # Execute the RLS setup SQL
        print("Setting up Row Level Security...")
        rls_setup = self.execute_sql(SQL_SETUP_RLS)
        
        if not rls_setup:
            print("Failed to set up RLS. Policies might already exist or there's an error.")
        else:
            print("RLS policies set up successfully.")
        
        return table_created or rls_setup
    
    def test_connection(self):
        """Test the connection to Supabase."""
        try:
            print("Testing connection to Supabase...")
            
            # Try to select from the text_entries table
            response = self.supabase.table('text_entries').select('*').limit(1).execute()
            
            # If we get here, the table exists
            print("Connection successful! The text_entries table exists.")
            print(f"Response data: {response}")
            return True
        except Exception as e:
            # If we get an error about the table not existing, try to create it
            if 'text_entries' in str(e) and 'does not exist' in str(e):
                print("Connected successfully, but 'text_entries' table doesn't exist.")
                print("Attempting to create the table...")
                
                # Try to initialize the database
                db_initialized = self.init_database()
                
                if db_initialized:
                    print("Database initialized successfully!")
                    return True
                else:
                    print("Failed to initialize database. Check permissions or if the table already exists.")
                    return False
            else:
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
    
    # Test the connection and initialize database if needed
    connection_success = supabase_manager.test_connection()
    
    if connection_success:
        # If the connection test is successful, demonstrate some operations
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
