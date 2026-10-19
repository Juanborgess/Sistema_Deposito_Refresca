import { createClient } from '@supabase/supabase-js';

const NEW_SUPABASE_URL = 'https://ybjlfnnhbusfltxxdqiy.supabase.co';
const NEW_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inliamxmbm5oYnVzZmx0eHhkcWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNTMyMzAsImV4cCI6MjEwNzkyOTIzMH0.-NZ9bF6LBsNUq3MPdnoeR6_i__Hl88ZUJi695-lQVQU';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ignora automaticamente variáveis da Vercel se forem do projeto bloqueado antigo
const supabaseUrl = (rawUrl && !rawUrl.includes('zsfelllqiwunfftybbjc')) ? rawUrl : NEW_SUPABASE_URL;
const supabaseAnonKey = (rawAnon && !rawAnon.includes('zsfelllqiwunfftybbjc')) ? rawAnon : NEW_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
