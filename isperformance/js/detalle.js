document.addEventListener('DOMContentLoaded', async function () {

  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  if (!id) {
    document.getElementById('detalle-container').innerHTML = '<div class="detalle-error">Producto no especificado.</div>';
    return;
  }

  const productos = await cargarProductos();
  const producto = productos.find(p => p.id === id);
  if (!producto) {
    document.getElementById('detalle-container').innerHTML = '<div class="detalle-error">Producto no encontrado.</div>';
    return;
  }

  document.title = producto.nombre + ' — ISperformance';

  const key = producto.categoria + '|' + producto.nombre;
  const extras = (typeof IMAGENES_ADICIONALES !== 'undefined' ? IMAGENES_ADICIONALES[key] : null) || [];
  const todasImagenes = [producto.imagen, ...extras.map(f => urlImagen(producto.categoria, f))];

  const vehiculos = producto.vehiculos.filter(v => v.marca);

  const maxPrecio = vehiculos.length ? Math.max(...vehiculos.map(v => v.precio)) : 0;
  const precioStr = maxPrecio ? '$' + maxPrecio.toLocaleString('es-CL') : 'Consultar';

  const shopifyHtml = producto.shopifyId
    ? `<a href="https://${producto.shopifyId}" target="_blank" rel="noopener" class="btn btn-primary btn-shopify">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        Comprar en ISperformance
      </a>`
    : `<a href="https://wa.me/56912345678?text=${encodeURIComponent('Hola, quiero cotizar ' + producto.nombre)}" target="_blank" rel="noopener" class="btn btn-primary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Consultar
      </a>`;

  document.getElementById('detalle-container').innerHTML = `
    <div class="detalle-grid">
      <div class="detalle-imagenes">
        <div class="detalle-img-main">
          <img id="detalle-img-principal" src="${todasImagenes[0]}" alt="${producto.nombre}" />
        </div>
        ${todasImagenes.length > 1 ? `
        <div class="detalle-thumbs">
          ${todasImagenes.map((url, i) =>
            `<div class="detalle-thumb${i === 0 ? ' active' : ''}" data-img="${url}">
              <img src="${url}" alt="${producto.nombre}" loading="lazy" />
            </div>`
          ).join('')}
        </div>` : ''}
      </div>
      <div class="detalle-info">
        <span class="detalle-cat">${producto.categoria}</span>
        <h1 class="detalle-title">${producto.nombre}</h1>
        <p class="detalle-desc">${producto.descripcion}</p>

        <div class="detalle-specs">
          ${[
            { label: 'Tipo', value: producto.tipo || '-' },
            { label: 'Procedencia', value: producto.procedencia || '-' },
            { label: 'Material', value: producto.material || '-' }
          ].map(s => `
            <div class="detalle-spec">
              <div class="detalle-spec-label">${s.label}</div>
              <div class="detalle-spec-value">${s.value}</div>
            </div>
          `).join('')}
        </div>

        <div class="detalle-vehiculos">
          <div class="detalle-vehiculos-titulo">Compatibilidad (${vehiculos.length})</div>
          <div class="detalle-vehiculos-lista">
            ${vehiculos.map(v => {
              const rango = v.años.length ? `${Math.min(...v.años)}-${Math.max(...v.años)}` : '';
              return `<span class="compat-tag">${v.marca} ${v.modelo} ${rango}</span>`;
            }).join('')}
          </div>
        </div>

        <div class="detalle-footer">
          <span class="detalle-precio">${precioStr}</span>
          ${shopifyHtml}
        </div>
      </div>
    </div>
  `;

  // Switch main image on thumbnail click
  document.querySelectorAll('.detalle-thumb').forEach(el => {
    el.addEventListener('click', function () {
      document.getElementById('detalle-img-principal').src = this.dataset.img;
      document.querySelector('.detalle-thumb.active')?.classList.remove('active');
      this.classList.add('active');
    });
  });
});
