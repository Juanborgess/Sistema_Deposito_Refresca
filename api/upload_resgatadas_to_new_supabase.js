const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ybjlfnnhbusfltxxdqiy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('ERRO: SUPABASE_SERVICE_ROLE_KEY não encontrada no arquivo .env!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FOLDER = path.resolve(__dirname, 'fotos_resgatadas');

function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.avif':
      return 'image/avif';
    default:
      return 'application/octet-stream';
  }
}

async function uploadAll() {
  console.log('🚀 Conectando ao Supabase Novo:', SUPABASE_URL);
  console.log('📁 Lendo fotos de:', FOLDER);

  if (!fs.existsSync(FOLDER)) {
    console.error('❌ Pasta fotos_resgatadas não encontrada!');
    return;
  }

  const files = fs.readdirSync(FOLDER);
  console.log(`📦 Encontradas ${files.length} fotos para enviar!\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(FOLDER, file);
    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = getMimeType(file);

    try {
      const { data, error } = await supabase.storage
        .from('produtos')
        .upload(file, fileBuffer, {
          contentType: mimeType,
          upsert: true,
          cacheControl: '31536000'
        });

      if (error) {
        console.error(`❌ [${i + 1}/${files.length}] Falha em ${file}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ [${i + 1}/${files.length}] Enviado com sucesso: ${file}`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ [${i + 1}/${files.length}] Erro ao enviar ${file}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n=============================================');
  console.log(`🎉 UPLOAD CONCLUÍDO NO SUPABASE NOVO!`);
  console.log(`✅ Sucessos: ${successCount}`);
  if (errorCount > 0) console.log(`❌ Erros: ${errorCount}`);
  console.log('=============================================\n');
  console.log('Agora abra ou atualize (F5) a tela do Supabase no seu navegador para ver as fotos no bucket produtos!');
}

uploadAll();
