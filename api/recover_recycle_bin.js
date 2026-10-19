const fs = require('fs');
const path = require('path');

const sidDir = 'C:\\$Recycle.Bin\\S-1-5-21-2801709239-3917248200-1858500989-1001';
const files = fs.readdirSync(sidDir);

const iFiles = files.filter(f => f.startsWith('$I'));
const images = [];

for (const ifile of iFiles) {
  try {
    const id = ifile.slice(2);
    const rfile = '$R' + id;
    const rpath = path.join(sidDir, rfile);
    if (!fs.existsSync(rpath)) continue;

    const rstat = fs.statSync(rpath);
    if (rstat.size < 500) continue;

    const ibuf = fs.readFileSync(path.join(sidDir, ifile));
    const headerVer = ibuf.readBigInt64LE ? Number(ibuf.readBigInt64LE(0)) : 2;
    const pathOffset = headerVer === 2 ? 28 : 24;
    const originalPath = ibuf.slice(pathOffset).toString('utf16le').replace(/\0.*$/, '');
    const name = path.basename(originalPath);

    if (/\.(png|jpg|jpeg|webp|avif)$/i.test(name)) {
      images.push({
        name,
        rfile,
        rpath,
        size: rstat.size
      });
    }
  } catch (e) {}
}

console.log('Total images found in Recycle Bin:', images.length);
images.forEach(img => {
  console.log(`- ${img.name} (${(img.size / 1024).toFixed(1)} KB)`);
});
