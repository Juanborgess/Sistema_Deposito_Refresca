const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const rawText = `### **Espumante**

* **Espumante** — R$ 79,99

---

### **Whisky 1 Litro**

* **Whisky Ballantines Sunshine Abacaxi 700ml** — R$ 139,99
* **Whisky Grand Old Parr 12 anos 1l** — R$ 190,00
* **Whisky Jack Daniel's Honey Tennessee Whiskey 1litro** — R$ 250,00
* **Whisky Johnnie Walker Double Black 1l** — R$ 350,00
* **Whisky Johnnie Walker Gold label reserve 750 ml** — R$ 380,00
* **Whisky White Horse 1L** — R$ 120,00
* **Whisky Buchanan S Deluxe 1l** — R$ 280,00
* **Whisky Black Label 1l** — R$ 250,00
* **Whisky Ballantines 1l** — R$ 130,00
* **Whisky Johnnie Walker Red Label 1l** — R$ 155,00
* **Whisky Jack Daniels Maçã Verde 1l** — R$ 250,00
* **Chivas Regal Extra 13 anos whisky escocês 750ml** — R$ 185,00
* **Whisky Escocês 12 Anos 1 Litro Chivas Regal** — R$ 145,00
* **Whisky Americano Old No. 7 Jack Daniels 1l** — R$ 230,00

---

### **Wisck combos**

* **Combo Black Label 1 litro + 4 Red Bull + 4 gelo de coco** — R$ 370,00
* **Combo red labell 1 litro + 4 Red Bull gelado 4 gelo de coco** — R$ 250,00
* **Combo wisck Ballantines 1 garrafa 4 redbull 4 gelo de coco** — R$ 190,00

---

### **Gelo Saborizado**

* **Gelo Saborizado Melancia** — R$ 4,99

---

### **Licor**

* **Licor Fino Cream & Marula Fruit Amarula Garrafa 750ml** — R$ 185,00
* **Licor Espanhol 43 tradicional 700ml** — R$ 230,00
* **El Perro Doce De Leite Be Long 750ml** — R$ 85,00
* **Licor Bananinha Carioca 750ml** — R$ 85,00
* **Licor Reggiani Bananinha 920ml** — R$ 50,00
* **Ballena Morango Com Tequila 750ml** — R$ 240,00

---

### **Gyn**

* **Bombay gin london dry sapphire 750ml** — R$ 150,00
* **Gin Blackberry London Beefeater 700ml** — R$ 150,00
* **Gin London Dry Bulldog** — R$ 259,90
* **Gin Tanqueray Bossa 700ml** — R$ 149,99
* **Gyn Tanqueray** — R$ 149,99
* **Gyn Beefeater London 750ml** — R$ 160,00
* **Gyn Beefeater London Pink Strawberry 750ml** — R$ 180,00

---

### **Combo gyn**

* **Combo tanquerai e Tônica (gin tanquerai + 4 água Tônica** — R$ 180,00
* **Combo tanque (Tanqueray + 4 Red Bull )** — R$ 200,00
* **Combo tanque tropical ( Tanqueray + 4 Red Bull tropical** — R$ 200,00

---

### **Gin**

* **Rocks Gin Green Apple** — R$ 59,90
* **Rocks Gin Strawberry** — R$ 59,90
* **Rocks Gin Watermelon** — R$ 59,90

---

### **Vodka**

* **Vodka Smirnoff 998 ml** — R$ 50,00
* **Vodka Absolut 1l** — R$ 100,00

---

### **Tequila**

* **Tequila Morango Rosa Tequilero Del Leste 750ml** — R$ 140,00

---

### **Aperitivo**

* **Aperol 750ml** — R$ 67,00

---

### **Água mineral**

* **Água mineral cristal com gaz** — R$ 8,00

---

### **Drink Pronto**

* **Skol Beats Senses Long Neck** — R$ 13,99
* **Skol Beats Caipirinha Long Neck** — R$ 13,99
* **Skol Beats Tropical Long Neck** — R$ 13,99
* **Skol Beats Gin Tônica Long Neck** — R$ 13,99

---

### **Cervejas Long Neck**

* **Cerveja Heineken zero álcool gelada** — R$ 11,99
* **Cerveja Stella Artois Long Neck 330ml** — R$ 10,80
* **Haineken 330 Ml Long Neck** — R$ 11,99
* **Cerveja Spaten Munich Helles Puro Malte Long Neck 330ml** — R$ 8,99
* **Cerveja Corona Extra Long Neck 330ml** — R$ 11,99
* **Cerveja Império Gold 210ml** — R$ 8,99
* **Cerveja Império Lager Puro Malte Long Neck** — R$ 9,50

---

### **Mala com 24 unidades cervejas gelada**

* **Cerveja Stella Artois Long Neck 330ml (24 garrafas)** — R$ 180,00
* **Mala com 24 unidades cerveja Corona gelada** — R$ 195,00
* **Mala de haineken com 24 unidades long neck gelada** — R$ 195,00

---

### **Packs de cerveja latão gelada**

* **Packs 12 unidades cerveja Antarctica latão** — R$ 70,00
* **Packs com 12 unidades cerveja Brahma latão** — R$ 75,00
* **Packs com 12 unidades cerveja haineken latão** — R$ 120,00
* **Packs com 12 unidades cerveja Original latão** — R$ 95,00
* **Packs 12 unidades cerveja Amstel lager latão** — R$ 80,00

---

### **Cerveja Latas**

* **Heineken Latão 473 Ml** — R$ 11,99
* **Cerveja amestel latão 473 gelado** — R$ 9,99
* **Cerveja Imperio Puro Malte Latão 473ml** — R$ 7,99
* **Cerveja Original Latão 473ml** — R$ 11,50
* **Cerveja Brasileira Antarctica Pilsen Latão 473ml** — R$ 8,99
* **Cerveja Brahma Chopp Latão 473ml** — R$ 8,99

---

### **Chopp de vinho**

* **Chopp de vinho pink moon 600 ml** — R$ 16,99

---

### **H2O**

* **Refrigerante H2oh! Limoneto 500ml** — R$ 10,00

---

### **Gatorade**

* **Gatorad sabor morango e maracujá gelado** — R$ 12,00
* **Gatorade sabor laranja gelado** — R$ 12,00

---

### **Refrigerantes 2 litros**

* **Coca cola 2 litros** — R$ 19,50
* **Fanta laranja 2 litros gelada** — R$ 14,90
* **Fanta uva 2 litros gelada** — R$ 14,90
* **Guaraná Antarctica 2 litros** — R$ 14,99
* **Pepsi 2 litros** — R$ 14,99
* **Sukita 2 litros** — R$ 12,99

---

### **Suco Dell vale 1/5 l**

* **Suco Dell vale laranja 1/5** — R$ 16,50
* **Suco Dell vale limão 1/5 gelado** — R$ 16,50
* **Suco Dell vale uva 1/5 gelado** — R$ 16,50

---

### **Dell valle lata gelado 290 ml**

* **Suco Dell valle lata sabor manga 290 ml gelado** — R$ 9,90
* **Suco Dell valle lata sabor pêssego 290 ml gelado** — R$ 9,90

---

### **Refrigerantes lata**

* **Coca cola lata 350 ml** — R$ 8,50
* **Coca cola lata zero** — R$ 8,50
* **Guaraná Antarctica lata** — R$ 7,50
* **Sukita uva 350 ml** — R$ 7,99

---

### **Guaraná natural**

* **Guaravita 290 ml** — R$ 4,00

---

### **Energético**

* **Energético Monster Energy Juice Mango Loco latão 473ml** — R$ 18,00
* **Energético Red Bull Zero sem Açúcar 250ml** — R$ 18,90
* **Red Bull 250 ml** — R$ 18,90
* **Red Bull Melancia** — R$ 18,90
* **Red Bull tropical gelado** — R$ 18,90
* **Energético Monster Energy latão 473ml** — R$ 18,00

---

### **Energético 2 litros**

* **Baly energético 2 litros sabor melancia** — R$ 25,00
* **Baly energético 2 litros sabor tradicional** — R$ 25,00
* **Baly energético 2 litros tropical** — R$ 25,00

---

### **Gelo**

* **Gelo Cubo Filtrado 4 Kilos** — R$ 20,00

---

### **Carvão**

* **Carvão dois irmão** *(3 kilo)* — R$ 29,99
* **Carvão dois irmãos** *(6 kilo)* — R$ 35,00

---

### **Sedas Blunt Mix**

* **Seda King blunt baunilha** — R$ 9,99
* **Seda King blunt mel** — R$ 9,99
* **Seda King blunt morango** — R$ 9,99
* **Seda King blunt uva** — R$ 9,99
* **Seda King blunt chocolate** — R$ 9,99
* **Seda King blunt melancia** — R$ 9,99
* **Seda King blunt maçã verde** — R$ 9,99

---

### **Sedas King Size**

* **Seda + piteira ocb King size** — R$ 17,90
* **Smoking Delux King Size** — R$ 13,00
* **Seda smoking Brown King Size** — R$ 12,90
* **Smoking Master King Size** — R$ 13,99
* **Lion Rolling Circus Alfalfa King Size** — R$ 12,99
* **Seda Papelito Brown Longa King Size** — R$ 12,99
* **Seda Papelito Tradicional King Size** — R$ 10,99
* **Seda Raw Classic King Size Slim** — R$ 19,99
* **Seda Bem Bolado King Size Brown Slim** — R$ 10,99
* **Seda Bem Bolado King Size Large** — R$ 9,00
* **Seda Bem Bolado Pop King Size Slim** — R$ 9,00
* **Seda Bem Bolado Mc Kevin King Size** — R$ 10,90
* **Seda Zomo Slim Alfalfa** — R$ 8,99
* **Seda Ocb Organic Hemp Slim King Size** — R$ 10,90
* **Seda Ocb Slim Fit King Size** — R$ 10,90
* **Seda Ocb Slim Premium King Size** — R$ 10,90
* **Seda Ocb Virgin Paper Brown Slim King Size** — R$ 10,90

---

### **Seda mini size**

* **Seda Raw Classic 1 1/4** — R$ 16,99
* **Seda Ocb Premium 11/4 Mini Size** — R$ 7,99
* **Seda Ocb Ultimate 11/4 Mini Size** — R$ 7,99
* **Seda Ocb Virgin Paper Brown 11/4 Mini Size** — R$ 7,99
* **Seda Ocb Organic Hemp 11/4 Mini Size** — R$ 7,99
* **Seda Smoking Master Mini Size** — R$ 10,90
* **Seda Smoking Delux Mini Size** — R$ 10,90
* **Seda smoking brown mini size 11/4 mini size** — R$ 10,90
* **Seda Papelito Mini Size** — R$ 9,00
* **Seda Bem Bolado Pop 11 / 4 Large Mini Size** — R$ 8,90
* **Seda Bem Bolado Pop 11 / 4 Slim Mini Size** — R$ 8,90
* **Seda Bem Bolado Brown Large 11 / 4** — R$ 8,90

---

### **Piteira**

* **Piteira de papel Gorilla - Extra longa (display com 30)** — R$ 9,99
* **Piteira Sesh - Tamanho Large** — R$ 9,90
* **Piteira Sesh - Tamanho Small** — R$ 6,90
* **Piteira Sesh - Tamanho Xl** — R$ 10,90
* **Piteira The Og - Tamanho Large** — R$ 8,90
* **Piteira The Og - Tamanho Xl** — R$ 10,90
* **Piteira The Og - Tam Small 70 piteira** — R$ 6,90
* **Piteira Papelito Slim** — R$ 6,99
* **Piteira Longa Papelito** — R$ 9,90
* **Piteira Papelito Tradicional** — R$ 8,99
* **Piteira Bem Bolado Girls In Green Super Large Vergé** — R$ 9,90
* **Piteira Bem Bolado Slim** — R$ 7,99
* **Piteira Bem Bolado Pop Extra Large** — R$ 7,99
* **Piteira Bem Bolado Pop Large** — R$ 7,99
* **Piteira Bem Bolado Brown Large** — R$ 7,99

---

### **Filtros**

* **Filtro aleda biodegradável slim - pacote** — R$ 16,99
* **Filtro aleda slim Classic - pacote** — R$ 15,99
* **Filtro aleda slim longo - pacote** — R$ 15,99
* **Filtro Bem bolado Pop longo slim** — R$ 20,00
* **Filtro papelito tradicional 6mm - pacote** — R$ 20,00
* **Filtro papelito tradicional ultra longos - pacote** — R$ 22,50
* **Filtro Sesh Slim - contém 120 filtros** — R$ 19,90
* **Filtro The Og Slim - contém 130 filtros** — R$ 19,90
* **Filtro Ocb Gammed Slim -Pacote** — R$ 23,90
* **Filtro Papelito Biodegradável Longo** — R$ 22,99
* **Filtro Papelito Slim 5,3 MM** — R$ 22,99

---

### **Isqueiro**

* **Isqueiro maçarico recarregável** — R$ 35,00
* **Isqueiro ocb grande** — R$ 14,99
* **Isqueiro Clipper Grande** — R$ 19,99
* **Isqueiro Bic Max** — R$ 13,50

---

### **Acessorios**

* **Bolador Himalaia Spilff 11/4 mini Size 78mm** — R$ 30,00
* **Bolador Himalaia Spilff King Size 110mm** — R$ 40,00
* **Cinzeiro The Og** — R$ 34,90
* **Cuia de silicone chapogren** — R$ 24,90
* **Slick The Og/ Sesh 10ml** — R$ 39,90
* **Tesoura Dobravel Sadhu** — R$ 25,00
* **Tesoura patchwork** — R$ 13,99
* **Toobeck Sadhu** — R$ 19,99
* **Slick Sadhu 5ml** — R$ 29,90

---

### **Dichavadores**

* **Dichavador 3 partes Fibra De Coco - Cremaria** — R$ 12,99

---

### **Eletrô e eletrônicos**

* **Somente Cabo Turbo Para Iphone 8 Plus Xr 11 12 13 14** — R$ 59,99
* **Somente o cabo turbo Usb - Tipo C** — R$ 44,90
* **Mini balança digital de alta precisão portátil 0,1g a 500 g** — R$ 59,99
* **Somente o cabo Kaidi entrada v8** — R$ 35,00
`;

async function run() {
  console.log('Fetching categorias...');
  const { data: categorias, error: catError } = await supabase.from('categorias').select('*');
  if (catError) { console.error(catError); return; }
  
  const mapping = {
    'Cervejas': ['Cervejas Long Neck', 'Mala com 24 unidades cervejas gelada', 'Packs de cerveja latão gelada', 'Cerveja Latas'],
    'Destilados': ['Espumante', 'Whisky 1 Litro', 'Wisck combos', 'Licor', 'Gyn', 'Combo gyn', 'Gin', 'Vodka', 'Tequila', 'Aperitivo'],
    'Drinks Prontos, Refrigerantes, Sucos & Energéticos': ['Drink Pronto', 'Chopp de vinho', 'H2O', 'Gatorade', 'Refrigerantes 2 litros', 'Suco Dell vale 1/5 l', 'Dell valle lata gelado 290 ml', 'Refrigerantes lata', 'Guaraná natural', 'Energético', 'Energético 2 litros'],
    'Gelo & Carvão': ['Gelo', 'Gelo Saborizado', 'Carvão'],
    'Tabacaria & Acessórios': ['Sedas Blunt Mix', 'Sedas King Size', 'Seda mini size', 'Piteira', 'Filtros', 'Isqueiro', 'Acessorios', 'Dichavadores'],
    'Eletrônicos & Utilitários': ['Eletrô e eletrônicos'],
    'Água & Gelo': ['Água mineral']
  };

  const catDict = {};
  for (const dbCat of categorias) {
    for (const [sysCat, textCats] of Object.entries(mapping)) {
      if (dbCat.nome === sysCat) {
        textCats.forEach(tc => { catDict[tc] = dbCat.id; });
      }
    }
  }

  // Parse items
  const lines = rawText.split('\n');
  const itemsToInsert = [];
  let currentGroup = '';

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('### ')) {
      currentGroup = line.replace('### ', '').replace(/\*\*/g, '').trim();
    } else if (line.startsWith('* **')) {
      const match = line.match(/^\* \*\*(.*?)\*\*(.*?)— R\$ ([0-9,]+)/);
      if (match) {
        let nome = match[1].trim();
        const extra = match[2].trim();
        if (extra) {
            nome += ' ' + extra.replace(/\*/g, '').trim();
        }
        const valor = parseFloat(match[3].replace('.', '').replace(',', '.'));
        const categoria_id = catDict[currentGroup];
        
        let targetCategoryName = Object.keys(mapping).find(key => mapping[key].includes(currentGroup));
        
        // Se a categoria mapeada for "Água & Gelo" mas não existir no DB, joga pro "Gelo & Carvão" ou similar.
        if (!categoria_id) {
           const fallbackCat = categorias.find(c => c.nome.includes('Gelo')) || categorias[0];
           targetCategoryName = fallbackCat.nome;
        }

        itemsToInsert.push({
          nome: nome,
          valor: valor,
          categoria_id: categoria_id || categorias[0].id,
          categoria: targetCategoryName,
          ativo: true,
          ordem: itemsToInsert.length + 1,
          imagem_url: ""
        });
      }
    }
  }

  console.log('Items parsed:', itemsToInsert.length);

  // Clear existing items
  console.log('Deletando produtos existentes...');
  const { error: delError } = await supabase.from('produtos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delError) { console.error('Erro ao deletar:', delError); return; }

  // Insert new items
  console.log('Inserindo novos produtos...');
  const { error: insError } = await supabase.from('produtos').insert(itemsToInsert);
  if (insError) { console.error('Erro ao inserir:', insError); return; }

  console.log('Pronto! Produtos atualizados com sucesso.');
}

run();
