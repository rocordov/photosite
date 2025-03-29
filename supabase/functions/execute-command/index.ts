/**
 * NOTE: The TypeScript errors shown in VSCode are expected and can be ignored.
 * This code is designed to run in Deno's runtime environment provided by Supabase
 * Edge Functions, not in a typical Node.js environment. When deployed to Supabase,
 * these imports and Deno-specific APIs will work correctly.
 * 
 * Secure Command Execution Intermediary (Supabase Edge Function)
 * 
 * This edge function serves as a secure intermediary between an AI system and a Supabase project.
 * It accepts validated commands (such as SQL queries), authenticates the request using a secure API key,
 * and executes those commands against a Supabase project using elevated privileges (service_role).
 * 
 * Security Features:
 * - API Key authentication
 * - Command validation (basic implementation; would need expansion in production)
 * - Service role execution with environment variable secrets
 * - Comprehensive error handling and logging
 * 
 * @author Your Name
 * @version 1.0.0
 */

// Import required dependencies from Deno and Supabase
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.2";

// Define the request interface for type safety
interface CommandRequest {
  command: string;
  params?: Record<string, any>;
  type: "sql" | "rpc"; // Command type: direct SQL or stored procedure
}

// Function to validate the API key from request headers
function validateApiKey(request: Request): boolean {
  const apiKey = request.headers.get("x-api-key");
  
  // Get the API key from environment variables
  const validApiKey = Deno.env.get("API_SECRET_KEY");
  
  if (!apiKey || !validApiKey) {
    return false;
  }
  
  // Use constant-time comparison to prevent timing attacks
  return crypto.subtle.timingSafeEqual(
    new TextEncoder().encode(apiKey),
    new TextEncoder().encode(validApiKey)
  );
}

// Basic command validation function
// In a production environment, this would need to be more sophisticated
function validateCommand(command: string, type: string): { valid: boolean; reason?: string } {
  // Don't allow empty commands
  if (!command || command.trim() === "") {
    return { valid: false, reason: "Command cannot be empty" };
  }
  
  if (type === "sql") {
    // Block potentially dangerous SQL operations
    // This is a very basic check; a real implementation would need more thorough validation
    const dangerousOperations = [
      /DROP\s+DATABASE/i,
      /DROP\s+SCHEMA/i,
      /TRUNCATE\s+SCHEMA/i,
      /ALTER\s+SYSTEM/i,
      /CREATE\s+EXTENSION/i,
      /CREATE\s+TRIGGER/i,
    ];
    
    for (const pattern of dangerousOperations) {
      if (pattern.test(command)) {
        return { 
          valid: false, 
          reason: `Forbidden operation detected: ${pattern.toString()}` 
        };
      }
    }
  }
  
  return { valid: true };
}

// Log function for consistent logging format
function log(level: string, message: string, data?: any): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    data: data || {},
  }));
}

// Main handler function for the Edge Function
serve(async (req: Request) => {
  // Set CORS headers for cross-origin requests
  const headers = new Headers({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*", // In production, restrict this to specific origins
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key",
  });
  
  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers, status: 204 });
  }
  
  // Only accept POST requests
  if (req.method !== "POST") {
    log("error", "Invalid request method", { method: req.method });
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { headers, status: 405 }
    );
  }
  
  try {
    // Validate API key
    if (!validateApiKey(req)) {
      log("error", "Invalid API key");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid API key" }),
        { headers, status: 401 }
      );
    }
    
    // Parse the request body
    const requestData = await req.json() as CommandRequest;
    const { command, params, type } = requestData;
    
    if (!command || !type) {
      log("error", "Missing required fields", { missingFields: !command ? "command" : "type" });
      return new Response(
        JSON.stringify({ error: "Bad request: Missing required fields" }),
        { headers, status: 400 }
      );
    }
    
    // Validate the command
    const validation = validateCommand(command, type);
    if (!validation.valid) {
      log("error", "Command validation failed", { reason: validation.reason });
      return new Response(
        JSON.stringify({ error: `Command validation failed: ${validation.reason}` }),
        { headers, status: 400 }
      );
    }
    
    // Initialize Supabase client with service_role key from environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      log("error", "Missing Supabase configuration", 
          { missingVars: !supabaseUrl ? "SUPABASE_URL" : "SUPABASE_SERVICE_ROLE_KEY" });
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { headers, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Execute the command based on its type
    let result;
    log("info", "Executing command", { type, commandPreview: command.substring(0, 100) });
    
    if (type === "sql") {
      // Execute SQL query
      result = await supabase.rpc('execute_sql_as_super_user', {
        query: command,
        params: params || {}
      });
    } else if (type === "rpc") {
      // Call stored procedure
      result = await supabase.rpc(command, params || {});
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid command type" }),
        { headers, status: 400 }
      );
    }
    
    // Handle errors from the Supabase client
    if (result.error) {
      log("error", "Supabase execution error", { error: result.error });
      return new Response(
        JSON.stringify({ 
          error: "Command execution failed", 
          details: result.error 
        }),
        { headers, status: 500 }
      );
    }
    
    // Return successful response with the result
    log("info", "Command executed successfully");
    return new Response(
      JSON.stringify({ 
        success: true, 
        result: result.data 
      }),
      { headers, status: 200 }
    );
    
  } catch (error) {
    // Handle any unexpected errors
    log("error", "Unexpected error", { error: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      { headers, status: 500 }
    );
  }
});
