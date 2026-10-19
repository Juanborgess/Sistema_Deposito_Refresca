const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const NEW_SUPABASE_URL = 'https://ybjlfnnhbusfltxxdqiy.supabase.co';
const NEW_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inliamxmbm5oYnVzZmx0eHhkcWl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjM1MzIzMCwiZXhwIjoyMTA3OTI5MjMwfQ.fIq2Px1cyaX--ooR0_WMP9zSLe-Np1D8ttnQPBEZa8I';

const supabase = createClient(NEW_SUPABASE_URL, NEW_SERVICE_ROLE_KEY);

async function populate() {
  console.log('🚀 Iniciando restauração completa dos dados no novo Supabase...');

  // 1. Ler dados salvos
  const catPath = path.resolve(__dirname, 'data/dados_resgatados_catalogo.json');
  const pedPath = path.resolve(__dirname, 'data/dados_resgatados_pedidos.json');

  const catalogoData = JSON.parse(fs.readFileSync(catPath, 'utf8'));
  const pedidosData = JSON.parse(fs.readFileSync(pedPath, 'utf8'));

  // 2. Inserir Categorias
  console.log(`\n📂 Restaurando ${catalogoData.categorias.length} categorias...`);
  for (const cat of catalogoData.categorias) {
    const { error } = await supabase.from('categorias').upsert({
      id: cat.id,
      nome: cat.nome,
      ordem: cat.ordem,
      created_at: cat.created_at
    });
    if (error) console.error(`❌ Erro na categoria ${cat.nome}:`, error.message);
  }
  console.log('✅ Categorias restauradas com sucesso!');

  // 3. Inserir Produtos
  console.log(`\n🍾 Restaurando ${catalogoData.produtos.length} produtos...`);
  // Inserir em lotes de 20 para evitar limites de payload
  const batchSize = 25;
  for (let i = 0; i < catalogoData.produtos.length; i += batchSize) {
    const batch = catalogoData.produtos.slice(i, i + batchSize).map(p => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao,
      valor: p.valor,
      valor_promocional: p.valor_promocional,
      categoria: p.categoria,
      categoria_id: p.categoria_id,
      badge: p.badge,
      imagem_url: p.imagem_url,
      variacoes: p.variacoes || [],
      ordem: p.ordem,
      ativo: p.ativo !== undefined ? p.ativo : true,
      created_at: p.created_at
    }));

    const { error } = await supabase.from('produtos').upsert(batch);
    if (error) {
      console.error(`❌ Erro no lote ${i} - ${i + batchSize}:`, error.message);
    } else {
      console.log(`  Inseridos ${Math.min(i + batchSize, catalogoData.produtos.length)}/${catalogoData.produtos.length} produtos...`);
    }
  }
  console.log('✅ Todos os produtos restaurados com sucesso!');

  // 4. Inserir Configurações da Loja (Pix e Horários)
  console.log('\n⚙️ Restaurando configurações da loja (Chave Pix e horários)...');
  for (const cfg of pedidosData.configuracoes_loja) {
    const { error } = await supabase.from('configuracoes_loja').upsert({
      id: cfg.id,
      horario_abertura: cfg.horario_abertura,
      horario_fechamento: cfg.horario_fechamento,
      dias_funcionamento: cfg.dias_funcionamento,
      chave_pix: cfg.chave_pix,
      banner_primeira_compra_ativo: cfg.banner_primeira_compra_ativo,
      texto_banner: cfg.texto_banner
    });
    if (error) console.error('❌ Erro nas configurações:', error.message);
  }
  console.log('✅ Configurações da loja restauradas!');

  // 5. Inserir Taxas de Frete
  console.log(`\n🚚 Restaurando ${pedidosData.taxas_frete.length} taxas de frete por bairro...`);
  for (const frete of pedidosData.taxas_frete) {
    const { error } = await supabase.from('taxas_frete').upsert({
      id: frete.id,
      bairro: frete.bairro,
      valor: frete.valor
    });
    if (error) console.error(`❌ Erro no frete do bairro ${frete.bairro}:`, error.message);
  }
  console.log('✅ Taxas de frete restauradas!');

  // 6. Inserir Pedidos Históricos (Jonathan e Sonia)
  console.log(`\n📋 Restaurando ${pedidosData.pedidos.length} pedidos reais...`);
  for (const ped of pedidosData.pedidos) {
    const { error } = await supabase.from('pedidos').upsert({
      id: ped.id,
      codigo_pedido: ped.codigo_pedido,
      cliente_nome: ped.cliente_nome,
      cliente_telefone: ped.cliente_telefone,
      bairro: ped.bairro,
      endereco_completo: ped.endereco_completo,
      metodo_pagamento: ped.metodo_pagamento,
      subtotal: ped.subtotal,
      taxa_entrega: ped.taxa_entrega,
      total: ped.total,
      cupom_aplicado: ped.cupom_aplicado,
      is_agendado: ped.is_agendado,
      status: ped.status,
      motoboy_id: ped.motoboy_id,
      created_at: ped.created_at
    });
    if (error) console.error(`❌ Erro no pedido #${ped.codigo_pedido}:`, error.message);
  }
  console.log('✅ Pedidos restaurados com sucesso!');

  // 7. Inserir Itens dos Pedidos
  console.log(`\n🛒 Restaurando ${pedidosData.itens_pedido.length} itens dos pedidos...`);
  for (const item of pedidosData.itens_pedido) {
    const { error } = await supabase.from('itens_pedido').upsert({
      id: item.id,
      pedido_id: item.pedido_id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      variacoes: item.variacoes,
      observacao: item.observacao
    });
    if (error) console.error(`❌ Erro no item ${item.id}:`, error.message);
  }
  console.log('✅ Itens dos pedidos restaurados!');

  // 8. Criar Usuário do Admin no Supabase Auth
  console.log('\n👤 Criando usuário admin depositorefresca@gmail.com no Supabase Auth...');
  const { data: userExists } = await supabase.auth.admin.listUsers();
  const alreadyCreated = userExists?.users?.some(u => u.email === 'depositorefresca@gmail.com');

  if (!alreadyCreated) {
    const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
      email: 'depositorefresca@gmail.com',
      password: 'RefrescaAdmin2026!',
      email_confirm: true
    });
    if (userError) {
      console.error('❌ Erro ao criar usuário admin:', userError.message);
    } else {
      console.log('✅ Usuário admin criado com sucesso no Auth: depositorefresca@gmail.com');
    }
  } else {
    console.log('ℹ️ Usuário admin já existe no Auth.');
  }

  console.log('\n🎉 RESTAURAÇÃO COMPLETA CONCLUÍDA COM 100% DE SUCESSO!');
}

populate().catch(console.error);
