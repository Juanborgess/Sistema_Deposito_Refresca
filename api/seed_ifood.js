const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const dataToSeed = [
  {
    categoria: "Cervejas em Garrafa (600ml / 550ml)",
    produtos: [
      { nome: "Cerveja Heineken 600ml (Gelada)", preco: 16.99 },
      { nome: "Cerveja Spaten 600ml", preco: 13.99 },
      { nome: "Cerveja Amstel Garrafa 600ml", preco: 13.99 },
      { nome: "Cerveja Stella Artois 550ml", preco: 13.99 },
      { nome: "Cerveja Original 600ml", preco: 14.90 },
      { nome: "Cerveja Beck's 600ml", preco: 14.99 },
      { nome: "Cerveja Corona Extra 600ml", preco: 17.99 },
      { nome: "Cerveja Eisenbahn Pilsen 600ml", preco: 13.99 },
      { nome: "Cerveja Antarctica Boa Garrafa 600ml (Gelada)", preco: 11.99 },
      { nome: "Cerveja Brahma Chopp 600ml (Gelada)", preco: 12.99 },
      { nome: "Cerveja Império Gold Garrafa 600ml", preco: 11.99 }
    ]
  },
  {
    categoria: "Cervejas Long Neck & Latas (Individuais)",
    produtos: [
      { nome: "Cerveja Heineken Zero Álcool 330ml (Gelada)", preco: 11.99 },
      { nome: "Cerveja Stella Artois Long Neck 330ml (Gelado)", preco: 10.80 },
      { nome: "Heineken 330ml Long Neck (Gelado)", preco: 11.99 },
      { nome: "Cerveja Spaten Munich Helles Puro Malte Long Neck 330ml (Gelado)", preco: 8.99 },
      { nome: "Cerveja Corona Extra Long Neck 330ml (Gelado)", preco: 11.99 },
      { nome: "Cerveja Império Gold 210ml (Gelado)", preco: 8.99 },
      { nome: "Cerveja Império Lager Puro Malte Long Neck (Gelado)", preco: 9.50 },
      { nome: "Heineken Latão 473ml (Gelado)", preco: 11.99 },
      { nome: "Cerveja Amstel Latão 473ml (Gelado)", preco: 9.99 },
      { nome: "Cerveja Império Puro Malte Latão 473ml (Gelado)", preco: 7.99 },
      { nome: "Cerveja Original Latão 473ml (Gelado)", preco: 11.50 },
      { nome: "Cerveja Brasileira Antarctica Pilsen Latão 473ml (Gelado)", preco: 8.99 },
      { nome: "Cerveja Brahma Chopp Latão 473ml (Gelado)", preco: 8.99 }
    ]
  },
  {
    categoria: "Packs e Malas de Cerveja",
    produtos: [
      { nome: "Mala Cerveja Stella Artois Long Neck 330ml (24 Garrafas Geladas)", preco: 180.00 },
      { nome: "Mala Cerveja Corona Gelada 330ml (24 Garrafas)", preco: 195.00 },
      { nome: "Mala Cerveja Heineken Long Neck 330ml (24 Garrafas Geladas)", preco: 195.00 },
      { nome: "Pack Cerveja Antarctica Latão (12 Unidades Geladas)", preco: 70.00 },
      { nome: "Pack Cerveja Brahma Latão (12 Unidades Geladas)", preco: 75.00 },
      { nome: "Pack Cerveja Heineken Latão (12 Unidades Geladas)", preco: 120.00 },
      { nome: "Pack Cerveja Original Latão (12 Unidades Geladas)", preco: 95.00 },
      { nome: "Pack Cerveja Amstel Lager Latão (12 Unidades Geladas)", preco: 80.00 }
    ]
  },
  {
    categoria: "Whisky & Combos",
    produtos: [
      { nome: "Whisky Red Label 1 Litro", preco: 130.00 },
      { nome: "Whisky Black Label 1 Litro", preco: 230.00 },
      { nome: "Whisky Jack Daniel's Tennessee 1 Litro", preco: 230.00 },
      { nome: "Whisky Jack Daniel's Apple (Maçã Verde) 1 Litro", preco: 250.00 },
      { nome: "Whisky Chivas Regal Extra 13 Anos 750ml", preco: 185.00 },
      { nome: "Whisky Chivas Regal 12 Anos 1 Litro", preco: 145.00 },
      { nome: "Whisky Ballantine's Finest 1 Litro", preco: 110.00 },
      { nome: "Whisky White Horse 1 Litro", preco: 95.00 },
      { nome: "Whisky Passport Scotch 1 Litro", preco: 65.00 },
      { nome: "Combo Black Label 1L + 4 Red Bull + 4 Gelo de Coco (Gelado)", preco: 370.00 },
      { nome: "Combo Red Label 1L + 4 Red Bull + 4 Gelo de Coco (Gelado)", preco: 250.00 },
      { nome: "Combo Whisky Ballantine's 1L + 4 Red Bull + 4 Gelo de Coco", preco: 190.00 }
    ]
  },
  {
    categoria: "Gin & Combos de Gin",
    produtos: [
      { nome: "Bombay Gin London Dry Sapphire 750ml", preco: 150.00 },
      { nome: "Gin Blackberry London Beefeater 700ml", preco: 150.00 },
      { nome: "Gin London Dry Bulldog 750ml", preco: 259.90 },
      { nome: "Gin Tanqueray Bossa 700ml", preco: 149.99 },
      { nome: "Gin Tanqueray Tradicional 750ml", preco: 149.99 },
      { nome: "Gin Beefeater London 750ml", preco: 160.00 },
      { nome: "Gin Beefeater London Pink Strawberry 750ml", preco: 180.00 },
      { nome: "Rock's Gin Green Apple 1L", preco: 59.90 },
      { nome: "Rock's Gin Strawberry 1L", preco: 59.90 },
      { nome: "Rock's Gin Watermelon 1L", preco: 59.90 },
      { nome: "Combo Gin Tanqueray + 4 Água Tônica (Gelado)", preco: 180.00 },
      { nome: "Combo Gin Tanqueray + 4 Red Bull (Gelado)", preco: 200.00 },
      { nome: "Combo Gin Tanqueray + 4 Red Bull Tropical (Gelado)", preco: 200.00 }
    ]
  },
  {
    categoria: "Vodkas, Tequilas, Aperitivos & Licores",
    produtos: [
      { nome: "Vodka Smirnoff 998ml", preco: 50.00 },
      { nome: "Vodka Absolut 1L", preco: 100.00 },
      { nome: "Tequila Morango Rosa Tequilero Del Leste 750ml", preco: 140.00 },
      { nome: "Aperol 750ml", preco: 67.00 },
      { nome: "Licor Amarula Cream 750ml", preco: 185.00 },
      { nome: "Licor Espanhol Licor 43 700ml", preco: 230.00 },
      { nome: "Licor El Perro Doce de Leite Be Long 750ml", preco: 85.00 },
      { nome: "Licor Bananinha Carioca 750ml", preco: 85.00 },
      { nome: "Licor Reggiani Bananinha 920ml", preco: 50.00 },
      { nome: "Licor Ballena Morango com Tequila 750ml", preco: 240.00 }
    ]
  },
  {
    categoria: "Vinhos",
    produtos: [
      { nome: "Vinho Chileno Reservado Concha y Toro Cabernet Sauvignon 750ml", preco: 55.00 },
      { nome: "Vinho Periquita Tinto 750ml", preco: 69.90 },
      { nome: "Vinho Casillero del Diablo Cabernet Sauvignon 750ml", preco: 75.00 },
      { nome: "Vinho Piatelli Reserve Malbec 750ml", preco: 110.00 },
      { nome: "Chopp de Vinho Pink Moon 600ml (Gelado)", preco: 16.99 }
    ]
  },
  {
    categoria: "Drinks Prontos, Refrigerantes, Sucos & Energéticos",
    produtos: [
      { nome: "Skol Beats Senses / Caipirinha / Tropical / Gin Tônica Long Neck 269ml", preco: 13.99 },
      { nome: "Refrigerante H2OH! Limoneto 500ml (Gelado)", preco: 10.00 },
      { nome: "Gatorade Morango e Maracujá / Laranja 500ml (Gelado)", preco: 12.00 },
      { nome: "Coca-Cola 2 Litros (Gelada)", preco: 19.50 },
      { nome: "Fanta Laranja / Fanta Uva 2 Litros (Gelada)", preco: 14.90 },
      { nome: "Guaraná Antarctica / Pepsi 2 Litros (Gelada)", preco: 14.99 },
      { nome: "Sukita 2 Litros (Gelada)", preco: 12.99 },
      { nome: "Suco Del Valle 1.5L (Laranja / Limão / Uva Gelado)", preco: 16.50 },
      { nome: "Suco Del Valle Lata 290ml (Manga / Pêssego Gelado)", preco: 9.90 },
      { nome: "Coca-Cola Lata 350ml (Normal / Zero Gelada)", preco: 8.50 },
      { nome: "Guaraná Antarctica Lata 350ml (Gelado)", preco: 7.50 },
      { nome: "Sukita Uva Lata 350ml (Gelada)", preco: 7.99 },
      { nome: "Guaravita 290ml (Gelado)", preco: 4.00 },
      { nome: "Monster Energy / Monster Juice Mango Loco Latão 473ml (Gelado)", preco: 18.00 },
      { nome: "Red Bull 250ml (Tradicional / Zero Açúcar / Melancia / Tropical Gelado)", preco: 18.90 },
      { nome: "Baly Energético 2 Litros (Melancia / Tradicional / Tropical Gelado)", preco: 25.00 }
    ]
  },
  {
    categoria: "Gelo & Carvão",
    produtos: [
      { nome: "Gelo Saborizado Melancia 190g", preco: 4.99 },
      { nome: "Gelo Cubo Filtrado 4kg", preco: 20.00 },
      { nome: "Carvão Dois Irmãos 3kg", preco: 29.99 },
      { nome: "Carvão Dois Irmãos 6kg", preco: 35.00 }
    ]
  },
  {
    categoria: "Tabacaria & Acessórios",
    produtos: [
      { nome: "Seda Bem Bolado Large", preco: 8.90 },
      { nome: "Seda RAW King Size", preco: 14.90 },
      { nome: "Seda Papelito Tradicional", preco: 8.90 },
      { nome: "Filtro Bem Bolado Slim", preco: 12.00 },
      { nome: "Piteira de Vidro", preco: 25.00 },
      { nome: "Isqueiro Bic Grande", preco: 9.90 }
    ]
  },
  {
    categoria: "Eletrônicos & Utilitários",
    produtos: [
      { nome: "Cabo Turbo para iPhone", preco: 44.90 },
      { nome: "Cabo Turbo USB Tipo-C", preco: 44.90 },
      { nome: "Cabo Kaidi Entrada V8", preco: 35.00 },
      { nome: "Mini Balança Digital", preco: 59.99 }
    ]
  }
];

async function seedDatabase() {
  console.log("🚀 Iniciando migração de dados do iFood para o Supabase...");

  try {
    // 1. Limpar banco para evitar duplicados (Opcional, mas seguro pra este teste)
    // Cuidado: Isso apaga todos os produtos. No caso do Refresca, como é a primeira carga, é seguro.
    console.log("Limpando catálogo antigo...");
    await supabase.from('produtos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('categorias').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    let categoriaOrdem = 1;
    let produtoOrdem = 1;

    for (const catData of dataToSeed) {
      console.log(`\n📦 Criando Categoria: ${catData.categoria}`);
      
      // Inserir categoria
      const { data: categoria, error: catError } = await supabase
        .from('categorias')
        .insert([{
          nome: catData.categoria,
          ordem: categoriaOrdem++
        }])
        .select()
        .single();

      if (catError) throw catError;

      // Prepara os produtos para inserção em lote
      const produtosInsert = catData.produtos.map(prod => ({
        nome: prod.nome,
        valor: prod.preco,
        categoria: categoria.nome,
        categoria_id: categoria.id,
        ativo: true,
        ordem: produtoOrdem++,
        variacoes: [],
        imagem_url: "" // Temporariamente sem imagem
      }));

      // Inserir produtos da categoria
      if (produtosInsert.length > 0) {
        const { error: prodError } = await supabase
          .from('produtos')
          .insert(produtosInsert);

        if (prodError) throw prodError;
        console.log(`✅ Inseridos ${produtosInsert.length} produtos em '${categoria.nome}'`);
      }
    }

    console.log("\n🎉 Migração finalizada com sucesso! Todos os dados foram salvos no banco.");

  } catch (error) {
    console.error("❌ ERRO:", error);
  }
}

seedDatabase();
