const fs = require('fs');

const productSQL = fs.readFileSync('/tmp/products-import.sql', 'utf8');
const mappingSQL = fs.readFileSync('/tmp/mappings-import.sql', 'utf8');

console.log('=== PRODUCTS SQL ===');
console.log(productSQL.substring(0, 2000));
console.log('\n... (truncated) ...\n');

console.log('=== MAPPINGS SQL ===');
console.log(mappingSQL.substring(0, 1000));
console.log('\n... (truncated) ...\n');

console.log('📏 Tailles:');
console.log(`   Products: ${productSQL.length} caractères`);
console.log(`   Mappings: ${mappingSQL.length} caractères`);
