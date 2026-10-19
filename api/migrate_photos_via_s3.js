const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase Novo
const NEW_SUPABASE_URL = 'https://ybjlfnnhbusfltxxdqiy.supabase.co';
const NEW_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inliamxmbm5oYnVzZmx0eHhkcWl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjM1MzIzMCwiZXhwIjoyMTA3OTI5MjMwfQ.fIq2Px1cyaX--ooR0_WMP9zSLe-Np1D8ttnQPBEZa8I';
const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SERVICE_ROLE_KEY);

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

async function migrate(accessKeyId, secretAccessKey) {
  console.log('🚀 Iniciando conexão S3 com o Supabase antigo...');
  
  const s3 = new S3Client({
    region: 'sa-east-1',
    endpoint: 'https://zsfelllqiwunfftybbjc.storage.supabase.co/storage/v1/s3',
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    forcePathStyle: true
  });

  // Criar pasta de backup local físico
  const backupDir = path.resolve(__dirname, 'backup_fotos');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('📂 Listando arquivos no bucket "produtos" via S3...');
  let continuationToken = undefined;
  const allObjects = [];

  do {
    const listCmd = new ListObjectsV2Command({
      Bucket: 'produtos',
      ContinuationToken: continuationToken
    });
    const listRes = await s3.send(listCmd);
    if (listRes.Contents) {
      allObjects.push(...listRes.Contents);
    }
    continuationToken = listRes.NextContinuationToken;
  } while (continuationToken);

  console.log(`📦 Encontrados ${allObjects.length} arquivos no bucket antigo!`);

  let successCount = 0;
  for (let i = 0; i < allObjects.length; i++) {
    const obj = allObjects[i];
    const key = obj.Key;
    try {
      // 1. Baixar via S3
      const getCmd = new GetObjectCommand({
        Bucket: 'produtos',
        Key: key
      });
      const getRes = await s3.send(getCmd);
      const buffer = await streamToBuffer(getRes.Body);

      // 2. Salvar backup local
      fs.writeFileSync(path.join(backupDir, path.basename(key)), buffer);

      // 3. Upload para o bucket do Supabase Novo
      const contentType = getRes.ContentType || 'image/jpeg';
      const { error: uploadError } = await newSupabase.storage
        .from('produtos')
        .upload(key, buffer, {
          contentType,
          upsert: true
        });

      if (uploadError) {
        console.error(`❌ Erro upload ${key}:`, uploadError.message);
      } else {
        successCount++;
        console.log(`  [${i + 1}/${allObjects.length}] Migrado com sucesso: ${key}`);
      }
    } catch (err) {
      console.error(`❌ Erro no arquivo ${key}:`, err.message);
    }
  }

  console.log(`\n🎉 Migração concluída: ${successCount}/${allObjects.length} fotos transferidas para o novo Supabase!`);
  console.log(`💾 Cópia física de backup salva em: ${backupDir}`);

  // 4. Atualizar as URLs dos produtos no banco novo
  console.log('\n🔄 Atualizando as URLs dos produtos no banco de dados novo...');
  const { data: produtos, error: prodErr } = await newSupabase.from('produtos').select('id, imagem_url');
  if (prodErr) {
    console.error('Erro ao buscar produtos:', prodErr.message);
  } else {
    let updatedUrls = 0;
    for (const p of produtos) {
      if (p.imagem_url && p.imagem_url.includes('zsfelllqiwunfftybbjc')) {
        const newUrl = p.imagem_url.replace('zsfelllqiwunfftybbjc', 'ybjlfnnhbusfltxxdqiy');
        await newSupabase.from('produtos').update({ imagem_url: newUrl }).eq('id', p.id);
        updatedUrls++;
      }
    }
    console.log(`✅ URLs atualizadas no banco: ${updatedUrls} produtos apontando para o novo bucket!`);
  }
}

module.exports = { migrate };

if (process.argv[2] && process.argv[3]) {
  migrate(process.argv[2], process.argv[3]).catch(console.error);
}
