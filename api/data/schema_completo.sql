-- ==============================================================================
-- SISTEMA DEPÓSITO REFRESCA - SCHEMA COMPLETO DO BANCO DE DADOS (SUPABASE POSTGRES)
-- ==============================================================================

-- 1. Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Categorias
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL UNIQUE,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  descricao TEXT,
  valor NUMERIC NOT NULL DEFAULT 0,
  valor_promocional NUMERIC,
  categoria TEXT,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  badge TEXT,
  imagem_url TEXT,
  variacoes JSONB DEFAULT '[]'::jsonb,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Motoboys
CREATE TABLE IF NOT EXISTS motoboys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  telefone TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_pedido SERIAL,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT DEFAULT 'Não informado',
  bairro TEXT NOT NULL,
  endereco_completo TEXT NOT NULL,
  metodo_pagamento TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  taxa_entrega NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  cupom_aplicado TEXT,
  is_agendado BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'RECEBIDO',
  motoboy_id UUID REFERENCES motoboys(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id UUID,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC NOT NULL DEFAULT 0,
  variacoes JSONB,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela de Cupons de Desconto
CREATE TABLE IF NOT EXISTS cupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT NOT NULL UNIQUE,
  porcentagem_desconto NUMERIC NOT NULL DEFAULT 0,
  validade TIMESTAMP WITH TIME ZONE,
  limite_uso INTEGER,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela de Taxas de Frete por Bairro
CREATE TABLE IF NOT EXISTS taxas_frete (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bairro TEXT NOT NULL UNIQUE,
  valor NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Tabela de Configurações da Loja (Expediente, Pix e Banner)
CREATE TABLE IF NOT EXISTS configuracoes_loja (
  id SERIAL PRIMARY KEY,
  horario_abertura TEXT,
  horario_fechamento TEXT,
  dias_funcionamento JSONB DEFAULT '[]'::jsonb,
  chave_pix TEXT,
  banner_primeira_compra_ativo BOOLEAN DEFAULT TRUE,
  texto_banner TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. View de CRM e Inteligência de Clientes
CREATE OR REPLACE VIEW clientes_view AS
SELECT 
  cliente_telefone,
  cliente_nome,
  bairro,
  endereco_completo,
  COUNT(id) AS total_pedidos,
  SUM(total) AS total_gasto,
  MAX(created_at) AS ultimo_pedido
FROM pedidos
GROUP BY cliente_telefone, cliente_nome, bairro, endereco_completo;

-- 11. Bucket de Storage para Fotos de Produtos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('produtos', 'produtos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de acesso público às fotos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Produtos' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public Access Produtos" ON storage.objects FOR SELECT USING (bucket_id = 'produtos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public Upload Produtos' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public Upload Produtos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'produtos');
  END IF;
END $$;
