const fs = require('fs');
const path = require('path');

const rb = 'C:\\$Recycle.Bin';
console.log('Exists:', fs.existsSync(rb));

if (fs.existsSync(rb)) {
  const sids = fs.readdirSync(rb);
  console.log('SIDs:', sids);
  for (const sid of sids) {
    try {
      const p = path.join(rb, sid);
      const items = fs.readdirSync(p);
      console.log(sid, 'items:', items.length);
      const images = items.filter(i => /\.(png|jpg|jpeg|webp|avif)$/i.test(i) || i.startsWith('$R'));
      console.log(sid, 'images/$R files:', images.length);
      if (images.length > 0) {
        images.slice(0, 10).forEach(img => console.log('  ', img));
      }
    } catch (e) {
      console.log(sid, 'err:', e.message);
    }
  }
}
