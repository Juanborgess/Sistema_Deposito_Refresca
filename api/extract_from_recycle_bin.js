const fs = require('fs');
const path = require('path');

const sidDir = 'C:\\$Recycle.Bin\\S-1-5-21-2801709239-3917248200-1858500989-1001';
const outDir = path.resolve(__dirname, 'fotos_resgatadas');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const files = fs.readdirSync(sidDir).filter(f => f.startsWith('$I'));
let count = 0;

for (const ifile of files) {
  try {
    const id = ifile.slice(2);
    const rfile = '$R' + id;
    const rpath = path.join(sidDir, rfile);
    if (!fs.existsSync(rpath)) continue;

    const ibuf = fs.readFileSync(path.join(sidDir, ifile));
    const headerVer = ibuf.readBigInt64LE ? Number(ibuf.readBigInt64LE(0)) : 2;
    const pathOffset = headerVer === 2 ? 28 : 24;
    const originalPath = ibuf.slice(pathOffset).toString('utf16le').replace(/\0.*$/, '');
    const name = path.basename(originalPath);

    if (/\.(png|jpg|jpeg|webp|avif)$/i.test(name)) {
      const destPath = path.join(outDir, name);
      fs.copyFileSync(rpath, destPath);
      count++;
      console.log(`[RESGATADO] ${name} -> fotos_resgatadas/`);
    }
  } catch (err) {
    console.error(`Erro ao resgatar ${ifile}:`, err.message);
  }
}

console.log(`\n🎉 SUCESSO ABSOLUTO! ${count} fotos originais foram resgatadas da lixeira para ${outDir}`);
