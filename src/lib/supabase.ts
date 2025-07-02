import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Create a single supabase client for interacting with your database
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Log configuration details (without exposing the full key)
console.log('Supabase Configuration:', { 
  url: supabaseUrl,
  keyProvided: !!supabaseAnonKey,
  keyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'missing'
});

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);