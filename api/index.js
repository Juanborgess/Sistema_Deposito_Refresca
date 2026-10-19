const express = require('express');
const cors = require('cors');
const multer = require('multer');
const supabase = require('./config/supabase');
const authMiddleware = require('./middlewares/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Setup multer for memory storage (file uploads)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ==========================================
// --- ROTAS PÚBLICAS (CLIENTES) ---
// ==========================================

// 1. Health Check (Keep-Alive / Uptime)
app.get('/api/health', async (req, res) => {
  try {
    // Fazemos um select super leve apenas para acordar o Supabase e evitar a pausa de 7 dias
    const { data, error } = await supabase.from('configuracoes_loja').select('id').limit(1);
    if (error) throw error;
    res.json({ status: 'online', app: 'Refresca Bebidas API', db: 'connected', timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 2. Obter Produtos (Catálogo Público)
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Obter Categorias
app.get('/api/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('ordem', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Validar Cupom de Desconto
app.get('/api/coupons/validate', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Código do cupom não informado.' });

  try {
    const { data, error } = await supabase
      .from('cupons')
      .select('*')
      .eq('codigo', code.toUpperCase())
      .eq('ativo', true)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Cupom inválido ou expirado.' });
    }

    if (data.validade && new Date(data.validade) < new Date()) {
      return res.status(400).json({ error: 'Cupom expirado.' });
    }

    // Verifica limite de uso se houver
    if (data.limite_uso) {
      const { count, error: countError } = await supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true })
        .eq('cupom_aplicado', data.codigo)
        .neq('status', 'CANCELADO');
        
      if (!countError && count >= data.limite_uso) {
        return res.status(400).json({ error: 'Limite de usos deste cupom foi atingido.' });
      }
    }

    res.json({ codigo: data.codigo, porcentagem_desconto: data.porcentagem_desconto });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Criar Pedido (Checkout)
app.post('/api/orders', async (req, res) => {
  const { 
    cliente_nome, cliente_telefone, bairro, endereco_completo, 
    metodo_pagamento, subtotal, taxa_entrega, total, cupom_aplicado, itens,
    is_agendado
  } = req.body;

  if (!cliente_nome || !bairro || !endereco_completo || !itens || itens.length === 0) {
    return res.status(400).json({ error: 'Dados incompletos para criação do pedido.' });
  }

  // FASE 6: Sanitização de valores para evitar compras com valores negativos ou manipulados
  const numSubtotal = parseFloat(subtotal || 0);
  const numTaxaEntrega = parseFloat(taxa_entrega || 0);
  const numTotal = parseFloat(total || 0);

  if (numSubtotal < 0 || numTaxaEntrega < 0 || numTotal < 0) {
    return res.status(400).json({ error: 'Valores não podem ser negativos.' });
  }

  try {
    // 1. Insere o pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([{
        cliente_nome, 
        cliente_telefone: cliente_telefone || 'Não informado', 
        bairro, 
        endereco_completo, 
        metodo_pagamento, 
        subtotal: parseFloat(subtotal || 0), 
        taxa_entrega: parseFloat(taxa_entrega || 0), 
        total: parseFloat(total || 0), 
        cupom_aplicado: cupom_aplicado || null,
        is_agendado: is_agendado || false,
        status: 'RECEBIDO'
      }])
      .select()
      .single();

    if (pedidoError) throw pedidoError;

    // 2. Insere os itens vinculados ao pedido
    if (itens && itens.length > 0) {
      const itensData = itens.map(item => ({
        pedido_id: pedido.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        variacoes: item.variacoes || null,
        observacao: item.observacao || null
      }));

      const { error: itensError } = await supabase
        .from('itens_pedido')
        .insert(itensData);

      if (itensError) throw itensError;
    }

    res.status(201).json({ codigo_pedido: pedido.codigo_pedido, id: pedido.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Rastreio Público de Pedidos
app.get('/api/track/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    if (!codigo) return res.status(400).json({ error: 'Código de pedido não informado.' });

    const isNumeric = /^\d+$/.test(codigo.trim());
    let query = supabase
      .from('pedidos')
      .select('*, motoboys(nome, telefone)');

    if (isNumeric) {
      query = query.eq('codigo_pedido', parseInt(codigo.trim(), 10));
    } else {
      query = query.eq('id', codigo.trim());
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Listar Taxas de Frete (Público)
app.get('/api/fretes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('taxas_frete')
      .select('*')
      .order('bairro', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Obter Configurações da Loja (Expediente e Pix)
app.get('/api/config', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('configuracoes_loja')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.json(data || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// --- ROTAS PROTEGIDAS (ADMINISTRATIVO) ---
// ==========================================

// 9. Criar Produto com Upload de Imagem
app.post('/api/products', authMiddleware, upload.single('imagem'), async (req, res) => {
  try {
    const file = req.file;
    const body = req.body;

    let imagem_url = body.imagem_url || '';

    if (file) {
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
      const fileName = `${Date.now()}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from('produtos')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('produtos')
        .getPublicUrl(fileName);
        
      imagem_url = urlData.publicUrl;
    }

    const { data: produto, error: insertError } = await supabase
      .from('produtos')
      .insert([{
        nome: body.nome,
        descricao: body.descricao || null,
        valor: parseFloat(body.valor),
        valor_promocional: body.valor_promocional ? parseFloat(body.valor_promocional) : null,
        categoria: body.categoria,
        categoria_id: body.categoria_id || null,
        badge: body.badge || null,
        imagem_url: imagem_url,
        variacoes: body.variacoes ? JSON.parse(body.variacoes) : []
      }])
      .select()
      .single();

    if (insertError) throw insertError;
    res.status(201).json(produto);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Editar Produto
app.put('/api/products/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  try {
    const { data, error } = await supabase
      .from('produtos')
      .update({
        nome: body.nome,
        descricao: body.descricao,
        valor: body.valor !== undefined ? parseFloat(body.valor) : undefined,
        valor_promocional: body.valor_promocional !== undefined ? (body.valor_promocional ? parseFloat(body.valor_promocional) : null) : undefined,
        categoria: body.categoria,
        categoria_id: body.categoria_id,
        badge: body.badge,
        variacoes: body.variacoes,
        ativo: body.ativo
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Soft Delete de Produto
app.delete('/api/products/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('produtos')
      .update({ ativo: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 12. Listar Pedidos no Admin
app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        motoboys ( nome, telefone )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 13. Despachar Pedido (Vincular Motoboy e Status SAIU_ENTREGA)
app.patch('/api/orders/:id/dispatch', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { motoboy_id } = req.body;

  try {
    const { data, error } = await supabase
      .from('pedidos')
      .update({
        motoboy_id: motoboy_id || null,
        status: 'SAIU_ENTREGA'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 13.1 Atualizar Status do Pedido (Protegido)
app.put('/api/orders/:id/status', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status, motoboy_id } = req.body;

  try {
    const updateData = {};
    if (status) updateData.status = status;
    if (motoboy_id !== undefined) updateData.motoboy_id = motoboy_id || null;

    const { data, error } = await supabase
      .from('pedidos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 14. Relatórios Financeiros
app.get('/api/reports/financial', authMiddleware, async (req, res) => {
  const { period } = req.query; // 'day', 'week', 'month'
  
  let dateFilter = new Date();
  if (period === 'week') {
    dateFilter.setDate(dateFilter.getDate() - 7);
  } else if (period === 'month') {
    dateFilter.setDate(dateFilter.getDate() - 30);
  } else {
    dateFilter.setHours(0, 0, 0, 0);
  }

  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('metodo_pagamento, total, status')
      .gte('created_at', dateFilter.toISOString())
      .in('status', ['PREPARANDO', 'SAIU_ENTREGA', 'ENTREGUE']);

    if (error) throw error;

    let faturamento = 0;
    let totalPix = 0;
    let totalDebito = 0;
    let totalCredito = 0;
    let totalDinheiro = 0;

    data.forEach(pedido => {
      const valor = parseFloat(pedido.total || 0);
      faturamento += valor;
      
      if (pedido.metodo_pagamento === 'PIX') totalPix += valor;
      else if (pedido.metodo_pagamento === 'DEBITO') totalDebito += valor;
      else if (pedido.metodo_pagamento === 'CREDITO') totalCredito += valor;
      else if (pedido.metodo_pagamento === 'DINHEIRO') totalDinheiro += valor;
    });

    res.json({
      faturamento_total: faturamento.toFixed(2),
      quantidade_pedidos: data.length,
      quebra: {
        total_pix: totalPix.toFixed(2),
        total_debito: totalDebito.toFixed(2),
        total_credito: totalCredito.toFixed(2),
        total_dinheiro: totalDinheiro.toFixed(2)
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 15. CRUD de Fretes
app.post('/api/fretes', authMiddleware, async (req, res) => {
  const { bairro, valor } = req.body;
  try {
    const { data, error } = await supabase
      .from('taxas_frete')
      .insert([{ bairro, valor: parseFloat(valor) }])
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/fretes/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { bairro, valor } = req.body;
  try {
    const { data, error } = await supabase
      .from('taxas_frete')
      .update({ bairro, valor: parseFloat(valor) })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/fretes/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('taxas_frete')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 16. CRM Clientes
app.get('/api/customers', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clientes_view')
      .select('*')
      .order('ultimo_pedido', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 17. Atualizar Configurações da Loja
app.put('/api/config', authMiddleware, async (req, res) => {
  const { horario_abertura, horario_fechamento, dias_funcionamento, chave_pix, texto_banner, pedido_minimo } = req.body;
  try {
    const { data: current } = await supabase.from('configuracoes_loja').select('id').limit(1).single();
    
    const payload = {};
    if (horario_abertura !== undefined) payload.horario_abertura = horario_abertura;
    if (horario_fechamento !== undefined) payload.horario_fechamento = horario_fechamento;
    if (dias_funcionamento !== undefined) payload.dias_funcionamento = dias_funcionamento;
    if (chave_pix !== undefined) payload.chave_pix = chave_pix;
    if (texto_banner !== undefined) payload.texto_banner = texto_banner;
    if (pedido_minimo !== undefined) payload.pedido_minimo = Math.max(0, parseFloat(pedido_minimo) || 0);

    let result;
    if (current) {
      result = await supabase
        .from('configuracoes_loja')
        .update(payload)
        .eq('id', current.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('configuracoes_loja')
        .insert([payload])
        .select()
        .single();
    }
    
    if (result.error) throw result.error;
    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 18. CRUD de Motoboys
app.get('/api/motoboys', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('motoboys')
      .select('*')
      .order('nome', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/motoboys', authMiddleware, async (req, res) => {
  const { nome, telefone } = req.body;
  try {
    const { data, error } = await supabase
      .from('motoboys')
      .insert([{ nome, telefone, ativo: true }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/motoboys/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nome, telefone, ativo } = req.body;
  try {
    const updateData = {};
    if (nome !== undefined) updateData.nome = nome;
    if (telefone !== undefined) updateData.telefone = telefone;
    if (ativo !== undefined) updateData.ativo = ativo;

    const { data, error } = await supabase
      .from('motoboys')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/motoboys/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('motoboys').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 19. CRUD de Cupons (Admin)
app.get('/api/coupons', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cupons')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/coupons', authMiddleware, async (req, res) => {
  const { codigo, porcentagem_desconto, validade } = req.body;
  try {
    const { data, error } = await supabase
      .from('cupons')
      .insert([{
        codigo: codigo.toUpperCase().trim(),
        porcentagem_desconto: parseFloat(porcentagem_desconto),
        validade: validade || null,
        ativo: true
      }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/coupons/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { codigo, porcentagem_desconto, validade, ativo } = req.body;
  try {
    const updateData = {};
    if (codigo !== undefined) updateData.codigo = codigo.toUpperCase().trim();
    if (porcentagem_desconto !== undefined) updateData.porcentagem_desconto = parseFloat(porcentagem_desconto);
    if (validade !== undefined) updateData.validade = validade;
    if (ativo !== undefined) updateData.ativo = ativo;

    const { data, error } = await supabase
      .from('cupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/coupons/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('cupons').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exporta o App Express para Vercel Serverless
module.exports = app;

// Suporte para rodar localmente
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 API Refresca Bebidas rodando na porta ${PORT}`));
}
