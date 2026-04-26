const fs = require('fs');
let content = fs.readFileSync('src/data/movies.js', 'utf8');
content = content.replace(/posterUrl: "https:\/\//g, 'posterUrl: "https://wsrv.nl/?url=');
fs.writeFileSync('src/data/movies.js', content);
console.log('Done replacing URLs');
