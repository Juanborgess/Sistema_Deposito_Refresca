require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const supabase = require('../config/supabase');

const produtosIniciais = [
  // Cervejas Geladas
  {
    nome: "Cerveja Heineken 350ml Lata (Gelada)",
    descricao: "Lata 350ml trincando de gelada. Puro malte, sabor marcante e refrescante.",
    valor: 7.50,
    valor_promocional: 6.99,
    categoria: "Cervejas Geladas",
    badge: "Mais Vendida",
    imagem_url: "https://images.unsplash.com/photo-1618886614638-80e3c103d31a?w=500&auto=format&fit=crop&q=80",
    ordem: 0,
    ativo: true
  },
  {
    nome: "Cerveja Corona Extra 330ml Long Neck",
    descricao: "Long neck 330ml estalando de gelada. Acompanha fatia de limão se solicitado.",
    valor: 9.50,
    valor_promocional: 8.90,
    categoria: "Cervejas Geladas",
    badge: "Gelada",
    imagem_url: "https://images.unsplash.com/photo-1584225064785-c62a8b43d148?w=500&auto=format&fit=crop&q=80",
    ordem: 1,
    ativo: true
  },
  {
    nome: "Cerveja Amstel Lager 350ml Lata",
    descricao: "Puro malte nascida em Amsterdã, leve e refrescante.",
    valor: 5.50,
    valor_promocional: 4.99,
    categoria: "Cervejas Geladas",
    badge: "Super Preço",
    imagem_url: "https://images.unsplash.com/photo-1608270191590-b98a0c0e5a1b?w=500&auto=format&fit=crop&q=80",
    ordem: 2,
    ativo: true
  },
  {
    nome: "Cerveja Spaten Munchen 350ml Lata",
    descricao: "Cerveja puro malte tradicional alemã desde 1397.",
    valor: 6.50,
    valor_promocional: null,
    categoria: "Cervejas Geladas",
    badge: "Puro Malte",
    imagem_url: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=500&auto=format&fit=crop&q=80",
    ordem: 3,
    ativo: true
  },

  // Destilados & Doses
  {
    nome: "Gin Tanqueray London Dry 750ml",
    descricao: "Garrafa 750ml original e lacrada. O gin mais premiado do mundo.",
    valor: 119.90,
    valor_promocional: 109.90,
    categoria: "Destilados & Doses",
    badge: "Original",
    imagem_url: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=500&auto=format&fit=crop&q=80",
    ordem: 4,
    ativo: true
  },
  {
    nome: "Whisky Johnnie Walker Red Label 1L",
    descricao: "Garrafa 1 Litro original lacrada com selo IPI. O scotch whisky nº 1 do mundo.",
    valor: 99.90,
    valor_promocional: 89.90,
    categoria: "Destilados & Doses",
    badge: "1 Litro",
    imagem_url: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=500&auto=format&fit=crop&q=80",
    ordem: 5,
    ativo: true
  },
  {
    nome: "Vodka Smirnoff Red 998ml",
    descricao: "Garrafa 998ml destilada 3 vezes e filtrada 10 vezes.",
    valor: 49.90,
    valor_promocional: 44.90,
    categoria: "Destilados & Doses",
    badge: "Promo",
    imagem_url: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=500&auto=format&fit=crop&q=80",
    ordem: 6,
    ativo: true
  },

  // Refrigerantes & Sucos
  {
    nome: "Coca-Cola Original 2L Gelada",
    descricao: "Garrafa 2 Litros bem gelada para acompanhar seu pedido.",
    valor: 12.00,
    valor_promocional: 10.90,
    categoria: "Refrigerantes & Sucos",
    badge: "Gelada",
    imagem_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80",
    ordem: 7,
    ativo: true
  },
  {
    nome: "Energético Red Bull Energy Drink 250ml",
    descricao: "Lata 250ml bem gelada. Te dá asas!",
    valor: 11.00,
    valor_promocional: 9.99,
    categoria: "Refrigerantes & Sucos",
    badge: "Red Bull",
    imagem_url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80",
    ordem: 8,
    ativo: true
  },

  // Gelo & Carvão
  {
    nome: "Saco de Gelo Filtrado em Cubo 5kg",
    descricao: "Gelo potável em cubo de água filtrada, pacote de 5kg.",
    valor: 15.00,
    valor_promocional: null,
    categoria: "Gelo & Carvão",
    badge: "5 Kilos",
    imagem_url: "https://images.unsplash.com/photo-1548685913-fe6678babe8d?w=500&auto=format&fit=crop&q=80",
    ordem: 9,
    ativo: true
  },
  {
    nome: "Saco de Carvão Vegetal Especial 3kg",
    descricao: "Carvão selecionado para churrasco com brasa duradoura e sem fumaça excessiva.",
    valor: 18.00,
    valor_promocional: 16.00,
    categoria: "Gelo & Carvão",
    badge: "Churrasco",
    imagem_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80",
    ordem: 10,
    ativo: true
  },
  {
    nome: "Água Mineral Crystal sem Gás 500ml",
    descricao: "Garrafinha 500ml bem gelada.",
    valor: 3.50,
    valor_promocional: 3.00,
    categoria: "Refrigerantes & Sucos",
    badge: "Água Gelada",
    imagem_url: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80",
    ordem: 11,
    ativo: true
  }
];

async function seedProdutos() {
  console.log('Iniciando seed dos produtos do Refresca Bebidas...');
  
  // Limpa produtos antigos de teste se houver
  const { data: existing } = await supabase.from('produtos').select('id');
  if (existing && existing.length > 0) {
    console.log(`Já existem ${existing.length} produtos cadastrados no banco.`);
    return;
  }

  const { data, error } = await supabase
    .from('produtos')
    .insert(produtosIniciais)
    .select();

  if (error) {
    console.error('Erro ao inserir produtos:', error.message);
  } else {
    console.log(`✅ ${data.length} produtos inseridos com sucesso no Supabase!`);
  }
}

seedProdutos();
