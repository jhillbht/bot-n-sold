// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://urdvklczigznduyzmgrf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyZHZrbGN6aWd6bmR1eXptZ3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4NTYzNDUsImV4cCI6MjA0OTQzMjM0NX0.4965MMym95-Bx2F84kB1GH1lVQxZN4QwOKrFxxL905k";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);