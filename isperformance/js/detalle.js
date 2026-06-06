// ── Carrito (localStorage) ──────────────────────────────────────────
const Carrito = {
  get() {
    try { return JSON.parse(localStorage.getItem('isp_cart') || '[]'); } catch { return []; }
  },
  save(items) {
    localStorage.setItem('isp_cart', JSON.stringify(items));
    Carrito.updateBadge();
  },
  add(producto) {
    const items = Carrito.get();
    const existe = items.find(i => i.shopifyId === producto.shopifyId);
    if (existe) {
      existe.qty = (existe.qty || 1) + 1;
    } else {
      items.push({ shopifyId: producto.shopifyId, nombre: producto.nombre,
                   imagen: producto.imagen, precio: producto.precio,
                   variantId: producto.variantId, qty: 1 });
    }
    Carrito.save(items);
  },
  remove(shopifyId) {
    Carrito.save(Carrito.get().filter(i => i.shopifyId !== shopifyId));
  },
  clear() { Carrito.save([]); },
  count() { return Carrito.get().reduce((n, i) => n + (i.qty || 1), 0); },
  updateBadge() {
    const c = Carrito.count();
    document.querySelectorAll('.cart-badge').forEach(el => {
      el.textContent = c;
      el.style.display = c > 0 ? 'flex' : 'none';
    });
  }
};

// ── Extraer specs desde HTML de descripción ─────────────────────────
function extraerSpecs(html) {
  if (!html) return {};
  const txt = html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
  const get = (key) => {
    const m = txt.match(new RegExp(key + '[:\\s]+([^·\\n<]+)', 'i'));
    return m ? m[1].trim() : null;
  };
  // Tipo: primera línea en negrita (entre ** o al inicio)
  const tipoMatch = html.match(/<b>([^<]+)<\/b>/i);
  return {
    tipo:        tipoMatch ? tipoMatch[1].replace(/\.$/, '').trim() : null,
    material:    get('Material'),
    procedencia: get('Procedencia'),
  };
}

// ── Modal carrito ────────────────────────────────────────────────────
function formatCLP(n) {
  return '$' + Math.round(n).toLocaleString('es-CL');
}

function checkoutUrl(items) {
  const lineas = items
    .filter(i => i.variantId)
    .map(i => `${i.variantId}:${i.qty || 1}`)
    .join(',');
  return lineas ? `https://is-perfomance.myshopify.com/cart/${lineas}` : null;
}

function abrirModalCarrito() {
  document.getElementById('cart-overlay')?.remove();

  const items = Carrito.get();
  const url   = checkoutUrl(items);
  const total = items.reduce((s, i) => s + (i.precio || 0) * (i.qty || 1), 0);

  const overlay = document.createElement('div');
  overlay.id = 'cart-overlay';
  overlay.innerHTML = `
    <div class="cart-modal">
      <div class="cart-modal-header">
        <h3>Carrito</h3>
        <button class="cart-close" id="cart-close">✕</button>
      </div>
      <div class="cart-modal-items">
        ${items.length === 0
          ? '<p class="cart-empty">Tu carrito está vacío.</p>'
          : items.map(i => `
            <div class="cart-item">
              <img src="${i.imagen}" alt="${i.nombre}"
                   onerror="this.style.display='none'" />
              <div class="cart-item-info">
                <span class="cart-item-name">${i.nombre}</span>
                <span class="cart-item-qty">Cant: ${i.qty}${i.precio ? ' · ' + formatCLP(i.precio * i.qty) : ''}</span>
              </div>
              <button class="cart-item-remove" data-id="${i.shopifyId}">✕</button>
            </div>`).join('')}
      </div>
      ${items.length > 0 ? `
      ${total > 0 ? `<div class="cart-total">Total: <strong>${formatCLP(total)}</strong></div>` : ''}
      <div class="cart-modal-footer">
        <button class="btn btn-secondary" id="cart-seguir">← Seguir comprando</button>
        ${url
          ? `<a class="btn btn-primary" href="${url}" target="_blank" rel="noopener" id="cart-pagar">
               Ir a pagar →
             </a>`
          : `<button class="btn btn-primary" id="cart-pagar-wa">Cotizar por WhatsApp</button>`
        }
      </div>` : ''}
    </div>`;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));

  document.getElementById('cart-close')?.addEventListener('click', cerrarCarrito);
  document.getElementById('cart-seguir')?.addEventListener('click', cerrarCarrito);
  overlay.addEventListener('click', e => { if (e.target === overlay) cerrarCarrito(); });
  overlay.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      Carrito.remove(parseInt(btn.dataset.id));
      abrirModalCarrito();
    });
  });
  document.getElementById('cart-pagar-wa')?.addEventListener('click', () => {
    const its = Carrito.get();
    const txt = its.map(i => `• ${i.nombre} x${i.qty}${i.precio ? ' (' + formatCLP(i.precio * i.qty) + ')' : ''}`).join('\n');
    const msg = encodeURIComponent(`Hola ISPerformance, quiero comprar:\n\n${txt}\n\n¿Cómo procedo con el pago?`);
    window.open(`https://wa.me/56985615636?text=${msg}`, '_blank');
  });
}

function cerrarCarrito() {
  const overlay = document.getElementById('cart-overlay');
  if (!overlay) return;
  overlay.classList.remove('visible');
  setTimeout(() => overlay.remove(), 250);
}

// ── Toast "agregado al carrito" ──────────────────────────────────────
function mostrarToast(nombre) {
  document.getElementById('isp-toast')?.remove();
  const toast = document.createElement('div');
  toast.id = 'isp-toast';
  toast.innerHTML = `
    <span>✓ <strong>${nombre}</strong> agregado</span>
    <div class="toast-btns">
      <button id="toast-seguir">Seguir comprando</button>
      <button id="toast-carrito" class="toast-primary">Ver carrito</button>
    </div>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));

  const hide = () => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 300); };
  document.getElementById('toast-seguir').addEventListener('click', hide);
  document.getElementById('toast-carrito').addEventListener('click', () => { hide(); abrirModalCarrito(); });
  setTimeout(hide, 5000);
}

// ── Página de detalle ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {
  Carrito.updateBadge();

  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  const container = document.getElementById('detalle-container');

  if (!id) { container.innerHTML = '<div class="detalle-error">Producto no especificado.</div>'; return; }

  const productos = await cargarProductos();
  const producto = productos.find(p => p.id === id);
  if (!producto) { container.innerHTML = '<div class="detalle-error">Producto no encontrado.</div>'; return; }

  document.title = producto.nombre + ' — ISperformance';

  const specs   = extraerSpecs(producto.descripcionHTML);
  const imgs    = producto.imagenes?.length ? producto.imagenes : [producto.imagen];
  const vehiculos = (producto.vehiculos || []).filter(v => v.marca);

  container.innerHTML = `
    <div class="detalle-grid">

      <!-- IMÁGENES -->
      <div class="detalle-imagenes">
        <div class="detalle-img-main">
          <img id="detalle-img-principal"
               src="${imgs[0]}"
               alt="${producto.nombre}"
               onerror="this.src='https://placehold.co/600x420/1A1A1A/FF6B00?text=${encodeURIComponent(producto.nombre)}'" />
        </div>
        ${imgs.length > 1 ? `
        <div class="detalle-thumbs">
          ${imgs.map((url, i) => `
            <div class="detalle-thumb${i === 0 ? ' active' : ''}" data-img="${url}">
              <img src="${url}" alt="${producto.nombre}" loading="lazy"
                   onerror="this.parentElement.style.display='none'" />
            </div>`).join('')}
        </div>` : ''}
      </div>

      <!-- INFO -->
      <div class="detalle-info">
        <div class="detalle-breadcrumb">
          <a href="index.html">ISperformance</a>
          <span>›</span>
          <span>${producto.categoria}</span>
        </div>

        <span class="detalle-cat">${producto.categoria}</span>
        <h1 class="detalle-title">${producto.nombre}</h1>
        <p class="detalle-vendor">Marca: <strong>${producto.vendor || 'ISPerformance'}</strong></p>

        <!-- Descripción completa -->
        <div class="detalle-desc-html">${producto.descripcionHTML || producto.descripcion}</div>

        <!-- Specs técnicas -->
        <div class="detalle-specs">
          ${specs.tipo ? `
          <div class="detalle-spec">
            <div class="detalle-spec-label">Tipo</div>
            <div class="detalle-spec-value">${specs.tipo}</div>
          </div>` : ''}
          ${specs.material ? `
          <div class="detalle-spec">
            <div class="detalle-spec-label">Material</div>
            <div class="detalle-spec-value">${specs.material}</div>
          </div>` : ''}
          ${specs.procedencia ? `
          <div class="detalle-spec">
            <div class="detalle-spec-label">Procedencia</div>
            <div class="detalle-spec-value">${specs.procedencia}</div>
          </div>` : ''}
        </div>

        <!-- Compatibilidad -->
        ${vehiculos.length ? `
        <div class="detalle-vehiculos">
          <div class="detalle-vehiculos-titulo">Compatible con (${vehiculos.length})</div>
          <div class="detalle-vehiculos-lista">
            ${vehiculos.map(v => {
              const rango = v.años.length ? `${Math.min(...v.años)}–${Math.max(...v.años)}` : '';
              return `<span class="compat-tag">${v.marca} ${v.modelo}${rango ? ' ' + rango : ''}</span>`;
            }).join('')}
          </div>
        </div>` : ''}

        <!-- Footer / acciones -->
        <div class="detalle-footer">
          <span class="detalle-precio">${producto.precio ? formatCLP(producto.precio) : 'Consultar precio'}</span>
          <button class="btn btn-primary btn-carrito" id="btn-agregar-carrito">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>`;

  // Galería: click en thumbnail
  document.querySelectorAll('.detalle-thumb').forEach(el => {
    el.addEventListener('click', function () {
      document.getElementById('detalle-img-principal').src = this.dataset.img;
      document.querySelector('.detalle-thumb.active')?.classList.remove('active');
      this.classList.add('active');
    });
  });

  // Agregar al carrito
  document.getElementById('btn-agregar-carrito')?.addEventListener('click', () => {
    Carrito.add(producto);
    mostrarToast(producto.nombre);
  });
});
