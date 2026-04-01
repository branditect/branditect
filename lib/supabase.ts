import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://alzqwhkkntfritasizzx.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsenF3aGtrbnRmcml0YXNpenp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNDIwMzQsImV4cCI6MjA5MDYxODAzNH0.rnOj0oZ5urAQndVAgaNniUKoith7Zl0X3hag7kS5Jq8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
