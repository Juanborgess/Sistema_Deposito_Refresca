import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zsfelllqiwunfftybbjc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZmVsbGxxaXd1bmZmdHliYmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MDY3MTcsImV4cCI6MjEwNjk4MjcxN30.hJisJTqbwoFwd8jRRoj4bMeDSKySjuZror8Z7yvE5G4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
