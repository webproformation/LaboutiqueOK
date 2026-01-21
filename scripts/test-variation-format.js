const testData1 = {
  "couleurs-principales": { "name": "Blanc", "id": "123" },
  "tailles": { "name": "50", "id": "456" }
};

const testData2 = {"O": "Couleur"};
const testData3 = "Blanc";

const formatVariationLines = (data) => {
    const lines = [];
    if (!data) return lines;

    let obj = data;
    if (typeof data === 'string') {
        try { obj = JSON.parse(data); } catch (e) { return [data]; }
    }

    Object.entries(obj).forEach(([key, val]) => {
        const k = key.toLowerCase();
        if (k.includes('id') || k === 'sku' || !isNaN(Number(key))) return;

        let label = key;
        if (k.includes('couleur')) label = 'Couleur';
        else if (k.includes('taille')) label = 'Taille';
        else label = key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ');

        let displayVal = "";
        if (val && typeof val === 'object') {
            displayVal = val.name || val.value || val.option || val.label || "";
        } else {
            displayVal = String(val);
        }

        if (displayVal && displayVal !== 'undefined' && displayVal.trim() !== "") {
            lines.push(`${label} : ${displayVal.toUpperCase()}`);
        }
    });

    return lines;
};

console.log("Test 1 (objet complet):", formatVariationLines(testData1));
console.log("Test 2 (objet mal formaté):", formatVariationLines(testData2));
console.log("Test 3 (string):", formatVariationLines(testData3));
