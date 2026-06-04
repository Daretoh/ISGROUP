// Google Sheets URLs
const GSHEET_URL_CATALOGO = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSi7D52eZdz0w_ccHD5MqklIm5r_75rJbLiYAeEaoFXPY3iYwovAvaPeWWlsuk5bh-EUV6-BkioBnhu/pub?output=csv';
const GSHEET_URL_COMPAT = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSi7D52eZdz0w_ccHD5MqklIm5r_75rJbLiYAeEaoFXPY3iYwovAvaPeWWlsuk5bh-EUV6-BkioBnhu/pub?output=csv&gid=1215075867';

const IMG_FOLDER = {
  'Tapas': 'img/tapas/',
  'Pisaderas': 'img/pisaderas/',
  'Barras': 'img/barras/'
};

function urlImagen(categoria, archivo) {
  if (!archivo) return 'https://placehold.co/300x200/1A1A1A/FF6B00?text=Producto';
  const dir = IMG_FOLDER[categoria] || 'img/';
  return dir + archivo;
}

// Datos locales de respaldo
const PRODUCTOS_FALLBACK = [
  {
    id: 1,
    nombre: "Retrax One MX",
    categoria: "Tapas",
    imagen: urlImagen("Tapas", "RETRAX_ONE_MX.jpg"),
    descripcion: "Retráctil manual. Estados Unidos. Policarbonato.",
    tipo: "Retráctil manual",
    procedencia: "Estados Unidos",
    material: "Policarbonato",
    vehiculos: [{ marca: "Toyota", modelo: "Hilux", años: [2018,2019,2020,2021,2022,2023,2024,2025], precio: 0 }]
  },
  {
    id: 2,
    nombre: "Retrax One XR",
    categoria: "Tapas",
    imagen: urlImagen("Tapas", "RETRAX_ONE_XR.jpg"),
    descripcion: "Retráctil manual con rieles. Estados Unidos. Policarbonato.",
    tipo: "Retráctil manual con rieles",
    procedencia: "Estados Unidos",
    material: "Policarbonato",
    vehiculos: [{ marca: "Ford", modelo: "Ranger", años: [2019,2020,2021,2022,2023,2024,2025], precio: 0 }]
  },
  {
    id: 3,
    nombre: "BULX15 2.0 Power",
    categoria: "Tapas",
    imagen: urlImagen("Tapas", "BULX15_2.0_POWER.jpeg"),
    descripcion: "Retráctil eléctrica. China. Aluminio.",
    tipo: "Retráctil eléctrica",
    procedencia: "China",
    material: "Aluminio",
    vehiculos: [{ marca: "Toyota", modelo: "Hilux", años: [2018,2019,2020,2021,2022,2023,2024,2025], precio: 0 }]
  },
  {
    id: 4,
    nombre: "BULX15 2.0",
    categoria: "Tapas",
    imagen: urlImagen("Tapas", "BULX15_2.0.jpeg"),
    descripcion: "Retráctil manual. China. Aluminio.",
    tipo: "Retráctil manual",
    procedencia: "China",
    material: "Aluminio",
    vehiculos: [{ marca: "Ford", modelo: "Ranger", años: [2019,2020,2021,2022,2023,2024,2025], precio: 0 }]
  },
  {
    id: 5,
    nombre: "Solid Fold 2.0",
    categoria: "Tapas",
    imagen: urlImagen("Tapas", "SOLID_FOLD_2.0.jpg"),
    descripcion: "Plegable dura. Estados Unidos. Polipropileno.",
    tipo: "Plegable dura",
    procedencia: "Estados Unidos",
    material: "Polipropileno",
    vehiculos: [{ marca: "Nissan", modelo: "Navara", años: [2020,2021,2022,2023,2024,2025], precio: 0 }]
  },
  {
    id: 6,
    nombre: "Lona Marítima Flex",
    categoria: "Tapas",
    imagen: urlImagen("Tapas", "LONA_MARITIMA_FLEX.jpg"),
    descripcion: "Enrollable manual. Brasil. PVC reforzado.",
    tipo: "Enrollable manual",
    procedencia: "Brasil",
    material: "PVC reforzado",
    vehiculos: [{ marca: "Mitsubishi", modelo: "L200", años: [2020,2021,2022,2023,2024,2025], precio: 0 }]
  },
  {
    id: 7,
    nombre: "Keko K1",
    categoria: "Pisaderas",
    imagen: urlImagen("Pisaderas", "KEKO_K1.jpg"),
    descripcion: "Antideslizante. Brasil. Aluminio.",
    tipo: "Antideslizante",
    procedencia: "Brasil",
    material: "Aluminio",
    vehiculos: [{ marca: "Toyota", modelo: "Hilux", años: [2018,2019,2020,2021,2022,2023,2024,2025], precio: 0 }]
  },
  {
    id: 8,
    nombre: "K2 My Way",
    categoria: "Pisaderas",
    imagen: urlImagen("Pisaderas", "K2_MY_WAY.jpg"),
    descripcion: "Encaje perfecto. Brasil. Aluminio.",
    tipo: "Encaje perfecto",
    procedencia: "Brasil",
    material: "Aluminio",
    vehiculos: [{ marca: "Ford", modelo: "Ranger", años: [2019,2020,2021,2022,2023,2024,2025], precio: 0 }]
  },
  {
    id: 9,
    nombre: "Infinity",
    categoria: "Pisaderas",
    imagen: urlImagen("Pisaderas", "INFINITY.jpg"),
    descripcion: "3 modelos. China. Aluminio/Acero.",
    tipo: "3 modelos",
    procedencia: "China",
    material: "Aluminio/Acero",
    vehiculos: [{ marca: "Nissan", modelo: "Navara", años: [2020,2021,2022,2023,2024,2025], precio: 0 }]
  },
  {
    id: 10,
    nombre: "Keko K1",
    categoria: "Barras",
    imagen: urlImagen("Barras", "KEKO_K1.jpg"),
    descripcion: "Diseño único por vehículo. Brasil. Aluminio.",
    tipo: "Diseño único por vehículo",
    procedencia: "Brasil",
    material: "Aluminio",
    vehiculos: [{ marca: "Toyota", modelo: "Hilux", años: [2018,2019,2020,2021,2022,2023,2024,2025], precio: 0 }]
  },
  {
    id: 11,
    nombre: "Keko K3",
    categoria: "Barras",
    imagen: urlImagen("Barras", "KEKO_K3.jpg"),
    descripcion: "Diseño elegante. Brasil. Aluminio.",
    tipo: "Diseño elegante",
    procedencia: "Brasil",
    material: "Aluminio",
    vehiculos: [{ marca: "Ford", modelo: "Ranger", años: [2019,2020,2021,2022,2023,2024,2025], precio: 0 }]
  },
  {
    id: 12,
    nombre: "Premium",
    categoria: "Barras",
    imagen: urlImagen("Barras", "PREMIUM.jpg"),
    descripcion: "Con tapas laterales. China. Acero inoxidable.",
    tipo: "Con tapas laterales",
    procedencia: "China",
    material: "Acero inoxidable",
    vehiculos: [{ marca: "Chevrolet", modelo: "Colorado", años: [2020,2021,2022,2023,2024], precio: 0 }]
  }
];

// ── Cargador desde Google Sheets (dos hojas) ──

function parseCSV(texto) {
  const lineas = texto.trim().split('\n');
  const headers = lineas[0].split(',').map(h => h.trim());
  return lineas.slice(1).map(linea => {
    const valores = [];
    let campo = '', enComillas = false;
    for (const char of linea) {
      if (char === '"') { enComillas = !enComillas; continue; }
      if (char === ',' && !enComillas) { valores.push(campo); campo = ''; continue; }
      campo += char;
    }
    valores.push(campo);
    const obj = {};
    headers.forEach((h, i) => obj[h] = (valores[i] || '').trim());
    return obj;
  }).filter(r => r.Producto);
}

function combinarDatos(catalogo, compat) {
  const compatPorProducto = {};
  for (const c of compat) {
    const key = c.Categoria + '|' + (c.Producto || '');
    if (!compatPorProducto[key]) compatPorProducto[key] = [];
    compatPorProducto[key].push(c);
  }

  let id = 0;
  return catalogo.map(item => {
    const key = (item.Categoria || '') + '|' + (item.Producto || '');
    const vehiculos = (compatPorProducto[key] || []).map(v => {
      const desde = parseInt(v['Año_desde']) || 0;
      const hasta = parseInt(v['Año_hasta']) || 0;
      const años = [];
      for (let a = desde; a <= hasta; a++) años.push(a);
      return {
        marca: v.Marca || '',
        modelo: v.Modelo || '',
        años,
        precio: parseInt(v.Precio) || 0
      };
    });

    return {
      id: ++id,
      nombre: item.Producto,
      categoria: item.Categoria,
      imagen: urlImagen(item.Categoria, item.Imagen),
      descripcion: item.Descripcion || `${item.Tipo}. ${item.Procedencia ? item.Procedencia + '.' : ''} ${item.Material || ''}`,
      tipo: item.Tipo,
      procedencia: item.Procedencia,
      material: item.Material,
      vehiculos
    };
  });
}

async function cargarProductos() {
  if (!GSHEET_URL_CATALOGO) return PRODUCTOS_FALLBACK;

  try {
    const [resCat, resComp] = await Promise.all([
      fetch(GSHEET_URL_CATALOGO),
      GSHEET_URL_COMPAT ? fetch(GSHEET_URL_COMPAT) : Promise.resolve(null)
    ]);

    if (!resCat.ok) throw new Error('Catálogo: HTTP ' + resCat.status);

    const csvCat = await resCat.text();
    const catalogo = parseCSV(csvCat);
    if (catalogo.length === 0) throw new Error('Catálogo sin datos');

    let compat = [];
    if (resComp && resComp.ok) {
      const csvComp = await resComp.text();
      compat = parseCSV(csvComp);
    }

    return combinarDatos(catalogo, compat);
  } catch (e) {
    console.warn('Google Sheets no disponible, usando datos locales');
    return PRODUCTOS_FALLBACK;
  }
}
