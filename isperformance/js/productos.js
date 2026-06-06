// Fuente de datos: Shopify (productos.json) + compatibilidad.csv
const CAT_MAP = {
  'Tapas y Lonas':   'Tapas',
  'Pisaderas':       'Pisaderas',
  'Barras Antivuelco': 'Barras'
};

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = [];
    let field = '', quoted = false;
    for (const ch of line) {
      if (ch === '"') { quoted = !quoted; continue; }
      if (ch === ',' && !quoted) { vals.push(field); field = ''; continue; }
      field += ch;
    }
    vals.push(field);
    const obj = {};
    headers.forEach((h, i) => obj[h] = (vals[i] || '').trim());
    return obj;
  }).filter(r => Object.values(r).some(v => v));
}

function buildCompatMap(rows) {
  const map = {};
  for (const r of rows) {
    const key = r['Producto'];
    if (!key) continue;
    if (!map[key]) map[key] = [];
    const desde = parseInt(r['Año Desde']) || 0;
    const hasta = parseInt(r['Año Hasta']) || 0;
    const años = [];
    for (let a = desde; a <= hasta; a++) años.push(a);
    map[key].push({
      marca:  r['Marca Vehículo']  || '',
      modelo: r['Modelo Vehículo'] || '',
      años
    });
  }
  return map;
}

async function cargarProductos() {
  try {
    const [resP, resC] = await Promise.all([
      fetch('productos.json'),
      fetch('compatibilidad.csv')
    ]);

    const shopify  = await resP.json();
    const csvText  = await resC.text();
    const compat   = buildCompatMap(parseCSV(csvText));

    let id = 0;
    return shopify.map(p => {
      const cat     = CAT_MAP[p.type] || p.type;
      const imagen  = p.images && p.images[0] ? p.images[0] : 'https://placehold.co/400x280/1A1A1A/FF6B00?text=' + encodeURIComponent(p.title);
      const imgs    = p.images || [];
      const vehiculos = (compat[p.title] || []);

      return {
        id:          ++id,
        shopifyId:   p.id,
        handle:      p.handle,
        nombre:      p.title,
        categoria:   cat,
        vendor:      p.vendor,
        tags:        p.tags || [],
        imagen,
        imagenes:    imgs,
        descripcion: p.description
          ? p.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
          : '',
        descripcionHTML: p.description || '',
        shopifyUrl:  p.shopify_url || '',
        vehiculos
      };
    });
  } catch (e) {
    console.error('Error cargando productos:', e);
    return [];
  }
}
