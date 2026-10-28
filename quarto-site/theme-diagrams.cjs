// Derive themed scientific figures without changing their geometry or text.
const fs = require('node:fs');
const path = require('node:path');
const directory = path.join(__dirname, 'assets', 'research');
const palette = {
  '#257664': '#76dcd2', '#183841': '#e8f1f1', '#fff': '#15262e',
  '#536c70': '#a9bdc5', '#f3f6f3': '#15262e', '#ccdad3': '#2c4149',
  '#b77538': '#e8ad70', '#ccd9d3': '#2c4149', '#a7b9b1': '#718e98',
  '#d7dcd4': '#263b43', '#dce8e1': '#1b3339', '#2576640d': '#76dcd214'
};
const lightPalette = {
  '#fff': '#eeece5', '#f3f6f3': '#e5e3dc', '#183841': '#142d37',
  '#536c70': '#4c626b', '#257664': '#006e76', '#ccdad3': '#c4ccc5',
  '#ccd9d3': '#c4ccc5', '#dce8e1': '#dbe3dd'
};
for (const file of fs.readdirSync(directory).filter(name => /^(access|polar|ris|wireless)(-en)?\.svg$/.test(name))) {
  const source = fs.readFileSync(path.join(directory, file), 'utf8');
  for (const [theme, colors] of [['light', lightPalette], ['dark', palette]]) {
    const themed = source.replace(/#[0-9a-fA-F]{3,8}\b/g, color => colors[color.toLowerCase()] || color);
    const target = path.join(directory, file.replace('.svg', `-${theme}.svg`));
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== themed) fs.writeFileSync(target, themed);
  }
}
