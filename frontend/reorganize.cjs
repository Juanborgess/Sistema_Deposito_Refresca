const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFrontend = fs.readFileSync('.env', 'utf-8');
const url = envFrontend.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();

const envApi = fs.readFileSync('../api/.env', 'utf-8');
const key = envApi.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(url, key);

const newCategories = [
  { nome: 'CERVEJAS (Packs e Fardos)', ordem: 0 },
  { nome: 'CERVEJAS (Latões Individuais)', ordem: 1 },
  { nome: 'CERVEJAS (Long Necks Individuais)', ordem: 2 },
  { nome: 'DRINKS PRONTOS E ICE', ordem: 3 },
  { nome: 'COMBOS (Kits Prontos para Festa)', ordem: 4 },
  { nome: 'DESTILADOS (Whisky)', ordem: 5 },
  { nome: 'DESTILADOS (Gin)', ordem: 6 },
  { nome: 'DESTILADOS (Vodka & Tequila)', ordem: 7 },
  { nome: 'LICORES E APERITIVOS', ordem: 8 },
  { nome: 'VINHOS E ESPUMANTES', ordem: 9 },
  { nome: 'ENERGÉTICOS', ordem: 10 },
  { nome: 'REFRIGERANTES E SUCOS (2L e 1.5L)', ordem: 11 },
  { nome: 'REFRIGERANTES E SUCOS (Latas e Pequenos)', ordem: 12 },
  { nome: 'ÁGUA MINERAL', ordem: 13 },
  { nome: 'GELO E CARVÃO', ordem: 14 },
  { nome: 'TABACARIA (Sedas)', ordem: 15 },
  { nome: 'TABACARIA (Piteiras e Filtros)', ordem: 16 },
  { nome: 'TABACARIA (Acessórios e Isqueiros)', ordem: 17 },
  { nome: 'ELETRÔNICOS E UTILITÁRIOS', ordem: 18 }
];

const assignProductToCategory = (product) => {
  const n = product.nome.toLowerCase();
  
  if (n.includes('pack') || n.includes('mala') || n.includes('24 garrafas')) return 'CERVEJAS (Packs e Fardos)';
  if (n.includes('latão') || n.includes('473 ml') || n.includes('473ml')) return 'CERVEJAS (Latões Individuais)';
  if (n.includes('long neck') || n.includes('330ml') || n.includes('330 ml') || n.includes('210ml') || n.includes('heineken zero')) return 'CERVEJAS (Long Necks Individuais)';
  if (n.includes('skol beats') || n.includes('chopp de vinho')) return 'DRINKS PRONTOS E ICE';
  if (n.includes('combo')) return 'COMBOS (Kits Prontos para Festa)';
  if (n.includes('whisky') || n.includes('chivas') || n.includes('jack daniel') || n.includes('old parr')) return 'DESTILADOS (Whisky)';
  if (n.includes('gin') || n.includes('bombay') || n.includes('tanqueray') || n.includes('beefeater') || n.includes('rocks')) return 'DESTILADOS (Gin)';
  if (n.includes('vodka') || n.includes('smirnoff') || n.includes('absolut') || n.includes('tequila') || n.includes('tequilero')) return 'DESTILADOS (Vodka & Tequila)';
  if (n.includes('licor') || n.includes('amarula') || n.includes('doce de leite') || n.includes('bananinha') || n.includes('ballena') || n.includes('aperol') || n.includes('43')) return 'LICORES E APERITIVOS';
  if (n.includes('espumante') || n.includes('prosecco') || n.includes('moscatel')) return 'VINHOS E ESPUMANTES';
  if (n.includes('energético') || n.includes('red bull') || n.includes('monster') || n.includes('baly')) return 'ENERGÉTICOS';
  
  if ((n.includes('2 litros') || n.includes('2l') || n.includes('1,5l') || n.includes('1.5l') || n.includes('1/5')) && (n.includes('coca') || n.includes('fanta') || n.includes('guaraná') || n.includes('pepsi') || n.includes('sukita') || n.includes('suco') || n.includes('dell vale') || n.includes('del valle'))) return 'REFRIGERANTES E SUCOS (2L e 1.5L)';
  if ((n.includes('lata') || n.includes('500ml') || n.includes('350 ml') || n.includes('290 ml') || n.includes('290ml') || n.includes('guaravita')) && (n.includes('coca') || n.includes('h2oh') || n.includes('gatorad') || n.includes('guaraná') || n.includes('sukita') || n.includes('dell valle') || n.includes('del valle') || n.includes('gatorade'))) return 'REFRIGERANTES E SUCOS (Latas e Pequenos)';
  
  if (n.includes('água') || n.includes('agua')) return 'ÁGUA MINERAL';
  if (n.includes('gelo') || n.includes('carvão')) return 'GELO E CARVÃO';
  if (n.includes('seda') || n.includes('blunt')) return 'TABACARIA (Sedas)';
  if (n.includes('piteira') || n.includes('filtro')) return 'TABACARIA (Piteiras e Filtros)';
  if (n.includes('isqueiro') || n.includes('bolador') || n.includes('cinzeiro') || n.includes('cuia') || n.includes('slick') || n.includes('tesoura') || n.includes('toobeck') || n.includes('dichavador')) return 'TABACARIA (Acessórios e Isqueiros)';
  if (n.includes('cabo') || n.includes('balança')) return 'ELETRÔNICOS E UTILITÁRIOS';

  const oldCat = product.categoria.toLowerCase();
  if (oldCat.includes('cerveja')) return 'CERVEJAS (Long Necks Individuais)';
  if (oldCat.includes('água')) return 'ÁGUA MINERAL';
  if (oldCat.includes('drinks') || oldCat.includes('refrigerante')) return 'REFRIGERANTES E SUCOS (Latas e Pequenos)';
  if (oldCat.includes('whisky')) return 'DESTILADOS (Whisky)';
  if (oldCat.includes('gin')) return 'DESTILADOS (Gin)';
  if (oldCat.includes('vodka')) return 'DESTILADOS (Vodka & Tequila)';
  if (oldCat.includes('licor')) return 'LICORES E APERITIVOS';
  if (oldCat.includes('vinho')) return 'VINHOS E ESPUMANTES';
  if (oldCat.includes('espumante')) return 'VINHOS E ESPUMANTES';
  if (oldCat.includes('gelo')) return 'GELO E CARVÃO';
  if (oldCat.includes('tabacaria')) return 'TABACARIA (Acessórios e Isqueiros)';
  if (oldCat.includes('eletrônico')) return 'ELETRÔNICOS E UTILITÁRIOS';

  return 'ELETRÔNICOS E UTILITÁRIOS';
};

async function run() {
  console.log('1. Fetching current products...');
  const { data: prods, error: prodErr } = await supabase.from('produtos').select('*');
  if (prodErr) throw prodErr;

  console.log('2. Inserting new categories...');
  for (const nc of newCategories) {
    await supabase.from('categorias').insert([{ nome: nc.nome, ordem: nc.ordem }]);
  }

  console.log('3. Fetching updated categories with IDs...');
  const { data: cats, error: catErr } = await supabase.from('categorias').select('*');
  if (catErr) throw catErr;

  console.log('4. Mapping products to new categories...');
  const mappedDePara = [];

  for (const p of prods) {
    const targetCatName = assignProductToCategory(p);
    const targetCat = cats.find(c => c.nome === targetCatName);
    if (!targetCat) {
      console.log('MISSING CATEGORY:', targetCatName);
      continue;
    }
    
    mappedDePara.push(`${p.nome} -> ${targetCatName}`);

    await supabase.from('produtos').update({ 
      categoria: targetCat.nome, 
      categoria_id: targetCat.id 
    }).eq('id', p.id);
  }

  console.log('5. Products mapped. Now deleting old categories...');
  for (const c of cats) {
    if (!newCategories.find(nc => nc.nome === c.nome)) {
      await supabase.from('categorias').delete().eq('id', c.id);
    }
  }

  console.log('DONE!');
  fs.writeFileSync('DE_PARA_PRODUTOS.md', mappedDePara.join('\n'), 'utf-8');
}

run().catch(console.error);
