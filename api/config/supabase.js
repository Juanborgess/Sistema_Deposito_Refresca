const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const NEW_SUPABASE_URL = 'https://ybjlfnnhbusfltxxdqiy.supabase.co';
const NEW_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inliamxmbm5oYnVzZmx0eHhkcWl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjM1MzIzMCwiZXhwIjoyMTA3OTI5MjMwfQ.fIq2Px1cyaX--ooR0_WMP9zSLe-Np1D8ttnQPBEZa8I';

// Ignora credenciais antigas do projeto bloqueado caso a Vercel ainda as possua
const supabaseUrl = (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('zsfelllqiwunfftybbjc'))
  ? process.env.SUPABASE_URL
  : NEW_SUPABASE_URL;

const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('zsfelllqiwunfftybbjc'))
  ? process.env.SUPABASE_SERVICE_ROLE_KEY
  : NEW_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
