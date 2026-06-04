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
    const hayFiltro = marca || modelo || año;

    const ordenCategorias = ['Tapas', 'Pisaderas', 'Barras'];
    const agrupado = {};
    lista.forEach(p => {
      const cat = p.categoria || 'Otros';
      if (!agrupado[cat]) agrupado[cat] = [];
      agrupado[cat].push(p);
    });

    let html = '';
    ordenCategorias.forEach(cat => {
      const items = agrupado[cat];
      if (!items || !items.length) return;

      html += `<div class="categoria-seccion"><h3 class="categoria-titulo">${cat}</h3><div class="equipos-grid">`;

      items.forEach(p => {
        const vehiculosFiltrados = p.vehiculos.filter(v => {
          if (marca && v.marca !== marca) return false;
          if (modelo && v.modelo !== modelo) return false;
          if (año && !v.años.includes(parseInt(año))) return false;
          return true;
        });

        const vehiculosMostrar = hayFiltro && vehiculosFiltrados.length ? vehiculosFiltrados : p.vehiculos;
        const compatTags = vehiculosMostrar.filter(v => v.marca).map(v => {
          const rango = v.años.length ? `${Math.min(...v.años)}-${Math.max(...v.años)}` : '';
          return `<span class="compat-tag">${v.marca} ${v.modelo} ${rango}</span>`;
        }).join('');

        const precio = vehiculosFiltrados.length ? Math.max(...vehiculosFiltrados.map(v => v.precio)) : 0;

        html += `
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
      });

      html += `</div></div>`;
    });

    resultadosEl.innerHTML = html;
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

  // ── Modal de producto ──
  const overlay = document.getElementById('modal-producto');
  const closeBtn = document.getElementById('modal-close');
  const modalImg = document.getElementById('modal-img');
  const modalThumbs = document.getElementById('modal-thumbs');
  const modalCat = document.getElementById('modal-cat');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalSpecs = document.getElementById('modal-specs');
  const modalVehiculos = document.getElementById('modal-vehiculos');
  const modalPrecio = document.getElementById('modal-precio');

  function abrirModal(producto) {
    const key = producto.categoria + '|' + producto.nombre;
    const extras = IMAGENES_ADICIONALES[key] || [];
    const todasImagenes = [producto.imagen, ...extras.map(f => urlImagen(producto.categoria, f))];

    modalImg.src = todasImagenes[0];
    modalImg.alt = producto.nombre;

    modalThumbs.innerHTML = todasImagenes.map((url, i) =>
      `<div class="modal-thumb${i === 0 ? ' active' : ''}" data-img="${url}">
        <img src="${url}" alt="${producto.nombre}" loading="lazy" />
      </div>`
    ).join('');

    modalThumbs.querySelectorAll('.modal-thumb').forEach(el => {
      el.addEventListener('click', () => {
        modalImg.src = el.dataset.img;
        modalThumbs.querySelector('.active')?.classList.remove('active');
        el.classList.add('active');
      });
    });

    modalCat.textContent = producto.categoria;
    modalTitle.textContent = producto.nombre;
    modalDesc.textContent = producto.descripcion;

    modalSpecs.innerHTML = [
      { label: 'Tipo', value: producto.tipo || '-' },
      { label: 'Procedencia', value: producto.procedencia || '-' },
      { label: 'Material', value: producto.material || '-' }
    ].map(s => `
      <div class="modal-spec">
        <div class="modal-spec-label">${s.label}</div>
        <div class="modal-spec-value">${s.value}</div>
      </div>
    `).join('');

    const vehiculos = producto.vehiculos.filter(v => v.marca);
    modalVehiculos.innerHTML = `
      <div class="modal-vehiculos-titulo">Compatibilidad (${vehiculos.length})</div>
      <div class="modal-vehiculos-lista">
        ${vehiculos.map(v => {
          const rango = v.años.length ? `${Math.min(...v.años)}-${Math.max(...v.años)}` : '';
          return `<span class="compat-tag">${v.marca} ${v.modelo} ${rango}</span>`;
        }).join('')}
      </div>
    `;

    const maxPrecio = vehiculos.length ? Math.max(...vehiculos.map(v => v.precio)) : 0;
    modalPrecio.textContent = maxPrecio ? '$' + maxPrecio.toLocaleString('es-CL') : 'Consultar';

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function cerrarModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  resultadosEl.addEventListener('click', e => {
    const card = e.target.closest('.equipo-card');
    if (!card) return;
    const titleEl = card.querySelector('.equipo-card-title');
    const catEl = card.querySelector('.equipo-card-cat');
    if (!titleEl || !catEl) return;
    const nombre = titleEl.textContent;
    const categoria = catEl.textContent;
    const producto = window.productos.find(p => p.nombre === nombre && p.categoria === categoria);
    if (producto) abrirModal(producto);
  });

  closeBtn.addEventListener('click', cerrarModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) cerrarModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarModal(); });

  poblarMarca();
  limpiarFiltros();
});
