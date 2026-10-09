const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('As variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias no backend.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
