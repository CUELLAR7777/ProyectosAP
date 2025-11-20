/*
  Módulo mínimo para crear/mostrar capacitaciones en localStorage.
  Key usada: 'sg_capacitaciones'
  - crearCapacitacion() -> pide título y descripción y guarda.
  - renderCapacitacionesList() -> renderiza en #capacitacionesList si existe.
  - eliminarCapacitacion(id) -> elimina con confirmación.
  - Se sincroniza entre pestañas con el evento 'storage'.
*/

(function () {
  const CAP_KEY = 'sg_capacitaciones';

  function getSessionUser() {
    try {
      const s = sessionStorage.getItem('sg_session');
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  }

  function getCapacitaciones() {
    try {
      return JSON.parse(localStorage.getItem(CAP_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveCapacitaciones(list) {
    localStorage.setItem(CAP_KEY, JSON.stringify(list));
    // trigger render in same tab
    renderCapacitacionesList();
  }

  function crearCapacitacion() {
    const user = getSessionUser();
    // Permitir solo a coordinadores crear capacitaciones
    if (user && user.role && user.role.toLowerCase() !== 'coordinador' && user.role.toLowerCase() !== 'coordinator') {
      return alert('Sólo los coordinadores pueden crear capacitaciones.');
    }
    const titulo = prompt('Título de la capacitación:');
    if (!titulo) return alert('Operación cancelada o título vacío.');
    const descripcion = prompt('Descripción (opcional):') || '';
    const nueva = {
      id: 'cap_' + Date.now(),
      title: titulo.trim(),
      description: descripcion.trim(),
      createdBy: user ? (user.name || user.email || 'coordinador') : 'coordinador',
      createdAt: new Date().toISOString()
    };
    const list = getCapacitaciones();
    list.unshift(nueva);
    saveCapacitaciones(list);
    alert('Capacitación creada correctamente.');
  }

  function eliminarCapacitacion(id) {
    if (!confirm('Eliminar capacitación seleccionada?')) return;
    const list = getCapacitaciones().filter(c => c.id !== id);
    saveCapacitaciones(list);
  }

  function templateCard(cap) {
    const d = new Date(cap.createdAt);
    const fecha = isNaN(d) ? cap.createdAt : d.toLocaleString();
    return `
      <div class="cap-card" data-id="${cap.id}" style="padding:12px;border:1px solid #eee;border-radius:8px;margin-bottom:8px;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <h3 style="margin:0;color:#c62828">${escapeHtml(cap.title)}</h3>
            <div style="font-size:13px;color:#666;margin-top:6px">${escapeHtml(cap.description || '')}</div>
            <div style="font-size:12px;color:#999;margin-top:6px">Creado por: ${escapeHtml(cap.createdBy)} · ${escapeHtml(fecha)}</div>
          </div>
          <div style="margin-left:12px;text-align:right">
            <button class="btn btn-outline" data-action="delete" data-id="${cap.id}" style="background:#fff;border:1px solid #c62828;color:#c62828;padding:6px 10px;border-radius:6px;cursor:pointer">Eliminar</button>
          </div>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  function renderCapacitacionesList() {
    const container = document.getElementById('capacitacionesList');
    if (!container) return;
    const list = getCapacitaciones();
    if (!list.length) {
      container.innerHTML = `<div style="padding:18px;background:#fff;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.04)">No hay capacitaciones. Usa "Nueva Capacitacion" para crear una.</div>`;
      return;
    }
    container.innerHTML = list.map(templateCard).join('');
    // attach delete handlers
    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        eliminarCapacitacion(id);
      });
    });
  }

  // Escucha cambios de localStorage desde otras pestañas
  window.addEventListener('storage', (e) => {
    if (e.key === CAP_KEY) {
      renderCapacitacionesList();
    }
  });

  // Exponer globalmente para el onclick del HTML
  window.crearCapacitacion = crearCapacitacion;
  window.eliminarCapacitacion = eliminarCapacitacion;
  window.renderCapacitacionesList = renderCapacitacionesList;

  // Render inicial al cargar DOM
  document.addEventListener('DOMContentLoaded', () => {
    renderCapacitacionesList();
  });

})();
