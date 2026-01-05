const fs = require('fs');
const content = fs.readFileSync('/tmp/cc-agent/62170990/project/import-commands.txt', 'utf8');

// Extraire tous les blocs SQL INSERT
const lines = content.split('\n');
let currentSQL = '';
const sqlBatches = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.startsWith('INSERT INTO products')) {
    if (currentSQL) {
      sqlBatches.push(currentSQL);
    }
    currentSQL = line + '\n';
  } else if (currentSQL && !line.startsWith('--') && line.trim() !== '') {
    currentSQL += line + '\n';
    if (line.includes('ON CONFLICT')) {
      sqlBatches.push(currentSQL);
      currentSQL = '';
    }
  }
}

console.log(`📦 ${sqlBatches.length} lots SQL extraits\n`);

// Sauvegarder pour l'import
fs.writeFileSync('/tmp/cc-agent/62170990/project/sql-batch-1.sql', sqlBatches.slice(0, 3).join('\n\n'));
fs.writeFileSync('/tmp/cc-agent/62170990/project/sql-batch-2.sql', sqlBatches.slice(3, 6).join('\n\n'));
fs.writeFileSync('/tmp/cc-agent/62170990/project/sql-batch-3.sql', sqlBatches.slice(6, 9).join('\n\n'));
fs.writeFileSync('/tmp/cc-agent/62170990/project/sql-batch-4.sql', sqlBatches.slice(9, 13).join('\n\n'));

console.log('✅ Fichiers SQL créés:');
console.log('   - sql-batch-1.sql (lots 1-3)');
console.log('   - sql-batch-2.sql (lots 4-6)');
console.log('   - sql-batch-3.sql (lots 7-9)');
console.log('   - sql-batch-4.sql (lots 10-13)');
console.log('\nExécutez-les un par un via MCP\n');
