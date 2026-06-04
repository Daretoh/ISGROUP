document.addEventListener('DOMContentLoaded', async function () {

  window.productos = await cargarProductos();

  const marcaEl = document.getElementById('filtro-marca');
  const modeloEl = document.getElementById('filtro-modelo');
  const añoEl = document.getElementById('filtro-ano');
  const buscarBtn = document.getElementById('filtro-buscar');
  const limpiarBtn = document.getElementById('filtro-limpiar');
  const resultadosEl = document.getElementById('equipos-resultados');
  const totalEl = document.getElementById('equipos-total');

  function uniqueSorted(arr) {
    return [...new Set(arr)].sort();
  }

  function getMarcas() {
    const marcas = new Set();
    productos.forEach(p => p.vehiculos.forEach(v => { if (v.marca) marcas.add(v.marca); }));
    return [...marcas].sort();
  }

  function getModelos(marca) {
    const modelos = new Set();
    productos.forEach(p => p.vehiculos.forEach(v => {
      if (v.marca === marca && v.modelo) modelos.add(v.modelo);
    }));
    return [...modelos].sort();
  }

  function getAños(marca, modelo) {
    const añosSet = new Set();
    productos.forEach(p => p.vehiculos.forEach(v => {
      if (v.marca === marca && v.modelo === modelo) {
        v.años.forEach(a => añosSet.add(a));
      }
    }));
    return [...añosSet].sort((a, b) => b - a);
  }

  function poblarMarca() {
    marcaEl.innerHTML = '<option value="">Selecciona una marca</option>';
    getMarcas().forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      marcaEl.appendChild(opt);
    });
    marcaEl.disabled = false;
  }

  function poblarModelo(marca) {
    modeloEl.innerHTML = '<option value="">Selecciona un modelo</option>';
    if (!marca) {
      modeloEl.disabled = true;
      añoEl.innerHTML = '<option value="">Selecciona un año</option>';
      añoEl.disabled = true;
      return;
    }
    const modelos = getModelos(marca);
    modelos.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      modeloEl.appendChild(opt);
    });
    modeloEl.disabled = false;
  }

  function poblarAño(marca, modelo) {
    añoEl.innerHTML = '<option value="">Selecciona un año</option>';
    if (!marca || !modelo) {
      añoEl.disabled = true;
      return;
    }
    const años = getAños(marca, modelo);
    años.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a;
      opt.textContent = a;
      añoEl.appendChild(opt);
    });
    añoEl.disabled = false;
  }

  function renderProductos(lista) {
    if (!lista || lista.length === 0) {
      resultadosEl.innerHTML = `
        <div class="equipos-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <p>No se encontraron productos para esta combinación.</p>
        </div>`;
      totalEl.textContent = '0 productos';
      return;
    }

    totalEl.textContent = lista.length + ' producto' + (lista.length !== 1 ? 's' : '');

    const marca = marcaEl.value;
    const modelo = modeloEl.value;
    const año = añoEl.value;

    resultadosEl.innerHTML = lista.map(p => {
      const vehiculosFiltrados = p.vehiculos.filter(v => {
        if (marca && v.marca !== marca) return false;
        if (modelo && v.modelo !== modelo) return false;
        if (año && !v.años.includes(parseInt(año))) return false;
        return true;
      });

      const compatTags = (vehiculosFiltrados.length ? vehiculosFiltrados : p.vehiculos).map(v => {
        const rango = v.años.length ? `${Math.min(...v.años)}-${Math.max(...v.años)}` : '';
        return `<span class="compat-tag">${v.marca} ${v.modelo} ${rango}</span>`;
      }).join('');

      const precio = vehiculosFiltrados.length ? Math.max(...vehiculosFiltrados.map(v => v.precio)) : 0;

      return `
      <article class="equipo-card">
        <div class="equipo-card-img">
          <img src="${p.imagen}" alt="${p.nombre}" loading="lazy" />
        </div>
        <div class="equipo-card-body">
          <span class="equipo-card-cat">${p.categoria}</span>
          <h3 class="equipo-card-title">${p.nombre}</h3>
          <p class="equipo-card-desc">${p.descripcion}</p>
          <div class="equipo-card-compat">${compatTags}</div>
          <div class="equipo-card-footer">
            <span class="equipo-card-precio">${precio ? '$' + precio.toLocaleString('es-CL') : 'Consultar'}</span>
          </div>
        </div>
      </article>`;
    }).join('');
  }

  function aplicarFiltros() {
    const marca = marcaEl.value;
    const modelo = modeloEl.value;
    const año = añoEl.value;

    if (!marca && !modelo && !año) {
      renderProductos(productos);
      return;
    }

    const filtrados = productos.filter(p =>
      p.vehiculos.some(v => {
        if (marca && v.marca !== marca) return false;
        if (modelo && v.modelo !== modelo) return false;
        if (año && !v.años.includes(parseInt(año))) return false;
        return true;
      })
    );

    renderProductos(filtrados);
  }

  function limpiarFiltros() {
    marcaEl.value = '';
    poblarModelo('');
    poblarAño('', '');
    aplicarFiltros();
  }

  marcaEl.addEventListener('change', function () {
    poblarModelo(this.value);
    poblarAño(this.value, '');
    aplicarFiltros();
  });

  modeloEl.addEventListener('change', function () {
    poblarAño(marcaEl.value, this.value);
    aplicarFiltros();
  });

  añoEl.addEventListener('change', aplicarFiltros);

  buscarBtn.addEventListener('click', aplicarFiltros);
  limpiarBtn.addEventListener('click', limpiarFiltros);

  poblarMarca();
  limpiarFiltros();
});
