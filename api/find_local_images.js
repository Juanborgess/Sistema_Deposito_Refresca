const fs = require('fs');
const path = require('path');
const os = require('os');

const recentDir = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Recent');
if (!fs.existsSync(recentDir)) {
  console.log('No recent dir');
  process.exit(0);
}

const files = fs.readdirSync(recentDir);
const results = [];

for (const file of files) {
  if (!file.endsWith('.lnk')) continue;
  try {
    const content = fs.readFileSync(path.join(recentDir, file), 'latin1');
    const match = content.match(/[C-Za-z]:\\[\w\s\-\.\(\)\\]+\.(png|jpg|jpeg|webp|avif)/i);
    if (match) {
      const targetPath = match[0];
      results.push({
        file,
        targetPath,
        exists: fs.existsSync(targetPath)
      });
    }
  } catch (err) {}
}

console.log('Found recent image shortcuts:', results.length);
results.forEach(r => {
  console.log(`${r.exists ? '[FOUND]' : '[LOST]'} ${r.targetPath}`);
});
