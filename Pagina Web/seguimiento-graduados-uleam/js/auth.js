// Este archivo contiene funciones relacionadas con la autenticación de usuarios, como el inicio de sesión y el registro.

// Formatos y validaciones básicas en el cliente

/*
  auth.js — manejo simple de registro/login en localStorage y control de sesión
*/
(function () {
  const LS_KEY = 'sg_users';
  const SESSION_KEY = 'sg_session';
  const today = new Date();

  /* Utilidades de almacenamiento (misma estructura que antes) */
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
    catch (e) { console.error('Error parseando usuarios:', e); return []; }
  }
  function saveUsers(users) { localStorage.setItem(LS_KEY, JSON.stringify(users)); }
  function findUserByEmail(email) { return getUsers().find(u => u.email.toLowerCase() === (email || '').toLowerCase()); }
  function findUserByCedula(ced) { return getUsers().find(u => (u.cedula||'') === (ced||'')); }
  function updateUser(email, patch) {
    const users = getUsers();
    const i = users.findIndex(u => u.email.toLowerCase() === (email||'').toLowerCase());
    if (i === -1) return false;
    users[i] = Object.assign({}, users[i], patch);
    saveUsers(users);
    return true;
  }

  /* Validaciones (sin cambios funcionales) */
  function isValidEmail(email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
    return email.toLowerCase().endsWith('@uleam.edu.ec');
  }
  function isValidCedula(ced) {
    if (!/^\d{10}$/.test(ced)) return false;
    const digits = ced.split('').map(d=>parseInt(d,10));
    const province = parseInt(ced.substring(0,2),10);
    if (province < 1 || province > 24) return false;
    const third = digits[2]; if (third >= 6) return false;
    let sum = 0;
    for (let i=0;i<9;i++){ let val = digits[i]; if (i % 2 === 0) { val = val * 2; if (val > 9) val -= 9; } sum += val; }
    const check = (10 - (sum % 10)) % 10;
    return check === digits[9];
  }
  function isValidPhone(p){ if (!p) return false; const cleaned = p.replace(/[\s\-()]/g,''); return /^(\+593|0)?9\d{8}$/.test(cleaned); }
  function isValidURL(u){ try{ if(!u) return false; new URL(u); return true; }catch(e){return false} }
  function isStrongPassword(p){ return typeof p === 'string' && p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p); }

  /* Helpers UI */
  function showMsg(el, msg, type = 'error') { if (!el) return; el.textContent = msg; el.className = type === 'error' ? 'form-error' : 'form-success'; }
  function clearFieldError(input) { if(!input) return; input.style.borderColor = ''; }
  function markFieldError(input) { if(!input) return; input.style.borderColor = '#b00020'; }
  function attachClearOnInput(form) { if (!form) return; form.querySelectorAll('input, select').forEach(i => { i.addEventListener('input', () => { const err = form.querySelector('.form-error'); const ok = form.querySelector('.form-success'); if (err) err.textContent = ''; if (ok) ok.textContent = ''; clearFieldError(i); }); }); }

  // Navegación del panel (sidebar). Activa secciones por hash y añade clase active a nav items.
  function setupPanelNavigation() {
    try {
      const navItems = document.querySelectorAll('.nav-menu .nav-item');
      if (!navItems || navItems.length === 0) return;
      navItems.forEach(it => {
        // Ignore logout button
        if (it.tagName === 'BUTTON' || it.id === 'logout') return;
        it.addEventListener('click', function (e) {
          e.preventDefault();
          const href = (it.getAttribute('href') || '').trim();
          const target = href.replace('#', '');
          if (!target) return;
          document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
          const section = document.getElementById(target);
          if (section) section.classList.add('active');
          navItems.forEach(n => n.classList.remove('active'));
          it.classList.add('active');
          try { history.replaceState(null, '', '#' + target); } catch (e) { /* noop */ }
        });
      });

      // activar según hash actual
      const applyHash = () => {
        const hash = (location.hash || '').replace('#', '');
        if (!hash) return;
        const section = document.getElementById(hash);
        if (section) {
          document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
          section.classList.add('active');
          const activeNav = document.querySelector(`.nav-menu .nav-item[href="#${hash}"]`);
          if (activeNav) {
            navItems.forEach(n => n.classList.remove('active'));
            activeNav.classList.add('active');
          }
        }
      };
      applyHash();
      window.addEventListener('hashchange', applyHash);
    } catch (e) { console.error('setupPanelNavigation error', e); }
  }

  /* Registro */
  const regForm = document.getElementById('registerForm');
  if (regForm) {
    attachClearOnInput(regForm);
    regForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const q = id => regForm.querySelector('#' + id);
      const name = (q('name')?.value || '').trim();
      const surname = (q('surname')?.value || '').trim();
      const cedula = (q('cedula')?.value || '').trim();
      const telefono = (q('telefono')?.value || '').trim();
      const carrera = (q('carrera')?.value || '').trim();
      const anioGraduacion = parseInt(q('anioGraduacion')?.value || '', 10);
      const fechaNacimiento = (q('fechaNacimiento')?.value || '').trim();
      const genero = (q('genero')?.value || '').trim();
      const linkedin = (q('linkedin')?.value || '').trim();
      const direccion = (q('direccion')?.value || '').trim();
      const email = (q('email')?.value || '').trim();
      const password = (q('password')?.value || '');
      const confirm = (q('confirmPassword')?.value || '');
      const role = (q('role')?.value || '').trim();
      const errEl = document.getElementById('regError');
      const okEl = document.getElementById('regSuccess');
      showMsg(errEl, ''); showMsg(okEl, '', 'success');

      const validators = [
        { ok: !!name, el: q('name'), msg: 'Ingrese su nombre.' },
        { ok: !!surname, el: q('surname'), msg: 'Ingrese su apellido.' },
        { ok: !!cedula && isValidCedula(cedula), el: q('cedula'), msg: 'Cédula inválida. Use 10 dígitos válidos.' },
        { ok: !!telefono && isValidPhone(telefono), el: q('telefono'), msg: 'Teléfono inválido. Formato: 09xxxxxxxx o +5939xxxxxxx.' },
        { ok: !!carrera, el: q('carrera'), msg: 'Ingrese la carrera.' },
        { ok: !!anioGraduacion && anioGraduacion >= 1950 && anioGraduacion <= today.getFullYear(), el: q('anioGraduacion'), msg: 'Año de graduación inválido.' },
        { ok: !!fechaNacimiento, el: q('fechaNacimiento'), msg: 'Ingrese la fecha de nacimiento.' },
        { ok: !fechaNacimiento || (function(){ const nacimiento=new Date(fechaNacimiento); const edad=(today-nacimiento)/(365.25*24*60*60*1000); return !isNaN(edad) && edad >= 15; })(), el: q('fechaNacimiento'), msg: 'Edad mínima 15 años.' },
        { ok: !!email && isValidEmail(email), el: q('email'), msg: 'Correo institucional inválido (debe terminar en @uleam.edu.ec).' },
        { ok: !findUserByEmail(email), el: q('email'), msg: 'Ya existe una cuenta con este correo.' },
        { ok: !!cedula && !findUserByCedula(cedula), el: q('cedula'), msg: 'Cédula ya registrada.' },
        { ok: !!password && isStrongPassword(password), el: q('password'), msg: 'Contraseña débil. Mín 8 caracteres, una mayúscula, una minúscula y un número.' },
        { ok: password === confirm, el: q('confirmPassword'), msg: 'Las contraseñas no coinciden.' },
        { ok: !!role && (role==='Egresado' || role==='Coordinador'), el: q('role'), msg: 'Seleccione un rol válido.' },
        { ok: !linkedin || isValidURL(linkedin), el: q('linkedin'), msg: 'URL de LinkedIn inválida.' }
      ];
      const failed = validators.find(v => !v.ok);
      if (failed) { markFieldError(failed.el); failed.el?.focus(); return showMsg(errEl, failed.msg); }

      const status = (role || '').toLowerCase() === 'coordinador' ? 'approved' : 'pending';
      const users = getUsers();
      users.push({ name, surname, cedula, telefono, carrera, anioGraduacion, fechaNacimiento, genero, linkedin, direccion, email, password, role, status, createdAt: new Date().toISOString() });
      saveUsers(users);
      if (status === 'pending') showMsg(okEl, 'Registro enviado. Espera la aprobación del Coordinador.', 'success'); else showMsg(okEl, 'Registro creado. Puedes iniciar sesión como Coordinador.', 'success');
      setTimeout(() => { location.href = 'login.html'; }, 900);
    });
  }

  /* Login: ahora redirige al dashboard por rol */
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    attachClearOnInput(loginForm);
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const q = id => loginForm.querySelector('#' + id);
      const email = (q('loginEmail')?.value || '').trim();
      const password = (q('loginPassword')?.value || '');
      const role = (q('loginRole')?.value || '').trim();
      const err = document.getElementById('loginError');
      showMsg(err, '');

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showMsg(err, 'Correo no válido.');
      if (!password) return showMsg(err, 'Ingrese la contraseña.');
      if (!role) return showMsg(err, 'Seleccione un rol.');

      const user = findUserByEmail(email);
      if (!user) return showMsg(err, 'No se encontró una cuenta con ese correo.');
      if (user.password !== password) return showMsg(err, 'Contraseña incorrecta.');
      if ((user.role || '').toLowerCase() !== role.toLowerCase()) return showMsg(err, 'Rol incorrecto.');

      const status = (user.status || 'approved');
      if (status !== 'approved') return showMsg(err, 'Cuenta en revisión o rechazada. Espera aprobación del Coordinador.');

      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email, name: user.name, role: user.role }));

      // Redirigir según rol
      const roleNorm = (user.role || '').toLowerCase();
      if (roleNorm === 'coordinador') location.href = 'dashboard-coordinador.html';
      else if (roleNorm === 'egresado') location.href = 'dashboard-egresado.html';
      else location.href = 'dashboard.html';
    });
  }

  /* Utilidades para páginas de dashboard específicas */
  function attachLogoutButton() {
    const logoutBtn = document.getElementById('logout');
    if (!logoutBtn) return;
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem(SESSION_KEY);
      location.href = 'index.html';
    });
  }

  // Inicializar protección y población básica en páginas de panel
  (function initDashPages(){
    const sess = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    const path = location.pathname.split('/').pop();

    // DASHBOARD.GENERIC (dashboard.html) — mantiene la lógica previa en caso de existir #dashboard
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
      if (!sess) { dashboard.innerHTML = `<h3>Acceso no autorizado</h3><p>Debe <a href="login.html">iniciar sesión</a>.</p>`; return; }
      const { name, role, email } = sess;
      const roleNorm = (role || '').toLowerCase();

      if (roleNorm === 'coordinador' || roleNorm === 'administrador') {
        // Reusar la UI existente que muestra listas pendientes y aprobados
        dashboard.innerHTML = `
          <div>
            <h2>Panel - Coordinador</h2>
            <p>Hola <strong>${name}</strong> (<em>${email}</em>)</p>
            <section style="margin-top:12px"><h3>Registros pendientes</h3><div id="pendingList"><p>Cargando...</p></div></section>
            <section style="margin-top:14px"><h3>Usuarios aprobados</h3><div id="approvedList"><p>Cargando...</p></div></section>
            <div style="margin-top:14px"><button id="logout" class="btn btn-primary">Cerrar sesión</button></div>
          </div>
        `;

        function renderLists(){
          const users = getUsers();
          const pending = users.filter(u => (u.status||'pending') === 'pending');
          const approved = users.filter(u => (u.status||'approved') === 'approved');
          const pendEl = document.getElementById('pendingList');
          const apprEl = document.getElementById('approvedList');
          if(pending.length === 0) pendEl.innerHTML = '<p>No hay registros pendientes.</p>'; else pendEl.innerHTML = '<table style="width:100%;border-collapse:collapse"><thead><tr style="text-align:left;color:var(--muted)"><th>Nombre</th><th>Email</th><th>Cédula</th><th>Carrera</th><th>Año</th><th>Acciones</th></tr></thead><tbody>' + pending.map(u=>`<tr><td>${u.name} ${u.surname}</td><td>${u.email}</td><td>${u.cedula}</td><td>${u.carrera}</td><td>${u.anioGraduacion}</td><td><button class="btn btn-primary btn-approve" data-email="${u.email}">Aprobar</button> <button class="btn btn-outline btn-reject" data-email="${u.email}">Rechazar</button></td></tr>`).join('') + '</tbody></table>';
          if(approved.length === 0) apprEl.innerHTML = '<p>No hay usuarios aprobados.</p>'; else apprEl.innerHTML = '<ul style="padding-left:18px">' + approved.map(u=>`<li>${u.name} ${u.surname} — ${u.email} — <strong>${u.role}</strong></li>`).join('') + '</ul>';
          document.querySelectorAll('.btn-approve').forEach(b=>{ b.addEventListener('click', ()=>{ updateUser(b.dataset.email, { status: 'approved' }); renderLists(); }); });
          document.querySelectorAll('.btn-reject').forEach(b=>{ b.addEventListener('click', ()=>{ updateUser(b.dataset.email, { status: 'rejected' }); renderLists(); }); });
        }
        renderLists();
      } else if (roleNorm === 'egresado') {
        const users = getUsers();
        const me = users.find(u => (u.email||'').toLowerCase() === (email||'').toLowerCase());
        const status = (me && me.status) ? me.status : 'approved';
        dashboard.innerHTML = `<div><h2>Panel - Egresado</h2><p>Hola <strong>${name}</strong> (<em>${email}</em>)</p><p>Estado de registro: <strong>${status}</strong></p><p>Si tu cuenta está en revisión, espera a que un Coordinador la apruebe.</p><div style="margin-top:14px"><button id="logout" class="btn btn-primary">Cerrar sesión</button></div></div>`;
      } else {
        dashboard.innerHTML = `<h2>Panel</h2><p>Hola ${name} (${email})</p><p>Rol: ${sess.role}</p><div style="margin-top:14px"><button id="logout" class="btn btn-primary">Cerrar sesión</button></div>`;
      }
      attachLogoutButton();
      return; // fin manejo dashboard.html
    }

    // DASHBOARD-COORDINADOR
    if (path === 'dashboard-coordinador.html') {
      if (!sess) { location.href = 'login.html'; return; }
      if ((sess.role||'').toLowerCase() !== 'coordinador') { location.href = 'index.html'; return; }
  const userNameEl = document.getElementById('userName'); if (userNameEl) userNameEl.textContent = sess.name || sess.email;
      const userRoleEl = document.getElementById('userRole'); if (userRoleEl) userRoleEl.textContent = sess.role || '';
      // avatar: usar inicial del nombre
      try {
        const avatarEl = document.getElementById('userAvatar');
        if (avatarEl) {
          const initials = ((sess.name||'') + ' ' + (sess.surname||'')).split(' ').map(s=>s.trim()).filter(Boolean).map(s=>s[0]).slice(0,2).join('').toUpperCase();
          avatarEl.textContent = initials || (sess.email || '').charAt(0).toUpperCase();
        }
      } catch(e){}
      attachLogoutButton();
      try { setupPanelNavigation(); renderCoordinadorPage(sess); } catch(e){ console.error('renderCoordinadorPage error', e); }
      return;
    }

    // DASHBOARD-EGRESADO
    if (path === 'dashboard-egresado.html') {
      if (!sess) { location.href = 'login.html'; return; }
      if ((sess.role||'').toLowerCase() !== 'egresado') { location.href = 'index.html'; return; }
  const userNameEl = document.getElementById('userName'); if (userNameEl) userNameEl.textContent = sess.name || sess.email;
  const userRoleEl = document.getElementById('userRole'); if (userRoleEl) userRoleEl.textContent = sess.role || '';
      attachLogoutButton();
      // poblar secciones del panel del egresado
      try {
        setupPanelNavigation();
        renderEgresadoPage(sess);
        // Polling fallback: detect changes to sg_surveys and re-render if needed.
        // Esto ayuda en entornos donde el evento 'storage' no alcanza o la pestaña perdió el evento.
        try {
          if (!window.__sg_surveys_poll_id) {
            window.__sg_surveys_last = localStorage.getItem(SURVEYS_KEY) || '';
            window.__sg_surveys_poll_id = setInterval(() => {
              try {
                const cur = localStorage.getItem(SURVEYS_KEY) || '';
                if (cur !== window.__sg_surveys_last) {
                  window.__sg_surveys_last = cur;
                  const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
                  if (window._renderEgresadoPage) window._renderEgresadoPage(s);
                }
              } catch (e) { /* noop */ }
            }, 1200);
            window.addEventListener('beforeunload', () => { try { clearInterval(window.__sg_surveys_poll_id); window.__sg_surveys_poll_id = null; } catch (e) {} });
          }
        } catch (e) { console.error('surveys poll setup error', e); }
      } catch(e){ console.error('renderEgresadoPage error', e); }
      return;
    }
  })();

  /* ------------------ Dashboard helpers ------------------ */
  // encuestas y respuestas en localStorage
  const SURVEYS_KEY = 'sg_surveys';
  const RESPONSES_KEY = 'sg_responses';

  function getSurveys(){ try{ return JSON.parse(localStorage.getItem(SURVEYS_KEY)) || []; }catch(e){return []} }
  function saveSurveys(s){ localStorage.setItem(SURVEYS_KEY, JSON.stringify(s)); }
  function getResponses(){ try{ return JSON.parse(localStorage.getItem(RESPONSES_KEY)) || []; }catch(e){return []} }
  function saveResponses(r){ localStorage.setItem(RESPONSES_KEY, JSON.stringify(r)); }

  // Render para coordinador
  function renderCoordinadorPage(sess){
    console.log('renderCoordinadorPage called', !!sess);
    // Estadísticas (editable por el coordinador). Se guarda como HTML snapshot en localStorage
    try {
      const savedStatsHtml = localStorage.getItem('sg_coordinator_stats_html');
      const statsGrid = document.querySelector('.stats-grid');
      if (statsGrid) {
        if (savedStatsHtml) {
          statsGrid.innerHTML = savedStatsHtml;
        } else {
          // Default ficticio
          statsGrid.innerHTML = `
            <div class="stat-card">
              <h3>Total usuarios</h3>
              <div id="stat_totalUsers" class="stat-value">150</div>
            </div>
            <div class="stat-card">
              <h3>Usuarios aprobados</h3>
              <div id="stat_approved" class="stat-value">120</div>
            </div>
            <div class="stat-card">
              <h3>Registros pendientes</h3>
              <div id="stat_pending" class="stat-value">8</div>
            </div>
            <div class="stat-card">
              <h3>Empleabilidad (%)</h3>
              <div id="stat_employed_pct" class="stat-value">68%</div>
            </div>
          `;
        }
          // render visual charts/bars after stats markup is present
          try { setTimeout(()=>{ renderStatsVisuals(statsGrid); }, 60); } catch(e) { console.error('renderStatsVisuals error', e); }
      }
    } catch(e) { console.error('stats render error', e); }

    // pendientes
    const pendingBody = document.getElementById('pendingTableBody');
    if (pendingBody) {
      const users = getUsers();
      const pending = users.filter(u => (u.status||'pending') === 'pending');
      pendingBody.innerHTML = pending.map(u => `
        <tr>
          <td>${u.name} ${u.surname}</td>
          <td>${u.email}</td>
          <td>${u.carrera || ''}</td>
          <td>${u.createdAt ? (new Date(u.createdAt)).toLocaleDateString() : ''}</td>
          <td>
            <button class="btn btn-primary btn-approve" data-email="${u.email}">Aprobar</button>
            <button class="btn btn-outline btn-reject" data-email="${u.email}">Rechazar</button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="5">No hay pendientes</td></tr>';

      pendingBody.querySelectorAll('.btn-approve').forEach(b=> b.addEventListener('click', ()=>{ updateUser(b.dataset.email,{status:'approved'}); renderCoordinadorPage(sess); }));
      pendingBody.querySelectorAll('.btn-reject').forEach(b=> b.addEventListener('click', ()=>{ updateUser(b.dataset.email,{status:'rejected'}); renderCoordinadorPage(sess); }));
    }

    // egresados list + filtros
    const graduatesContainer = document.querySelector('.graduates-list');
    const filterCarrera = document.getElementById('filterCarrera');
    const filterAnio = document.getElementById('filterAnio');
    const searchInput = document.getElementById('searchEgresados');

    function populateFilters(){
      const users = getUsers().filter(u=> (u.status||'approved') === 'approved');
      const carreras = Array.from(new Set(users.map(u=>u.carrera).filter(Boolean))).sort();
      const anios = Array.from(new Set(users.map(u=>u.anioGraduacion).filter(Boolean))).sort((a,b)=>b-a);
      if(filterCarrera){ filterCarrera.innerHTML = '<option value="">Todas las carreras</option>' + carreras.map(c=>`<option>${c}</option>`).join(''); }
      if(filterAnio){ filterAnio.innerHTML = '<option value="">Todos los años</option>' + anios.map(y=>`<option>${y}</option>`).join(''); }
    }

      function renderGraduates(){
      if(!graduatesContainer) return;
      const q = (searchInput && searchInput.value || '').toLowerCase();
      const carrera = filterCarrera ? filterCarrera.value : '';
      const anio = filterAnio ? filterAnio.value : '';
      let users = getUsers().filter(u=> (u.status||'approved') === 'approved');
      if(carrera) users = users.filter(u=> (u.carrera||'').toLowerCase() === carrera.toLowerCase());
      if(anio) users = users.filter(u=> String(u.anioGraduacion) === String(anio));
      if(q) users = users.filter(u=> ((u.name||'')+' '+(u.surname||'')+' '+(u.email||'')+' '+(u.cedula||'')).toLowerCase().includes(q));
      if(users.length === 0) { graduatesContainer.innerHTML = '<p>No se encontraron egresados.</p>'; return; }
      const gradsHtml = users.map(u=>{
        const emp = u.employment || {};
        const trabaja = (emp.trabaja||'').toLowerCase() === 'si';
        const trabajaText = emp.trabaja ? (emp.trabaja === 'si' ? 'Sí' : 'No') : 'No';
          const empresa = emp.empresa || '-';
          const puesto = emp.puesto || '-';
          // experience summary
          const exp = Array.isArray(emp.experiences) ? (emp.experiences[0] || null) : null;
          const expSummary = exp ? `${exp.company || '-'} — ${exp.role || '-'}` : '';
        const status = (u.status||'approved');
        const statusClass = status === 'approved' ? 'approved' : (status === 'pending' ? 'pending' : 'rejected');
        return `
        <div class="graduate-card">
          <div class="avatar-small">${(u.name||'').charAt(0).toUpperCase() || (u.email||'').charAt(0).toUpperCase()}</div>
          <div class="info">
            <div style="display:flex;align-items:center;gap:8px;">
              <h4 style="margin:0">${u.name} ${u.surname}</h4>
              <span class="badge ${statusClass}" style="margin-left:8px">${status}</span>
            </div>
            <p><span class="field-label">Carrera:</span> ${u.carrera || '-'} <span class="field-label">Año:</span> ${u.anioGraduacion || '-'}</p>
            <p><span class="field-label">Email:</span> <a href="mailto:${u.email}" class="small">${u.email}</a></p>
            <div class="meta-row">
              <div class="employment"><span class="field-label">Trabaja:</span> ${trabajaText}</div>
              ${trabaja ? `<div class="small">Empresa: ${empresa}</div><div class="small">Puesto: ${puesto}</div>` : ''}
              ${expSummary ? `<div class="small" style="margin-left:8px"><span class="field-label">Experiencia:</span> ${expSummary}</div>` : ''}
            </div>
          </div>
        </div>`;
      }).join('');
      graduatesContainer.innerHTML = gradsHtml;
      // Guardar snapshot HTML de egresados para que quede en el panel del Coordinador (sin exponer JSON)
      try { localStorage.setItem('sg_coordinator_graduates_html', graduatesContainer.innerHTML); } catch(e) { /* noop */ }
    }
    // botón para refrescar lista manualmente
    const refreshBtn = document.getElementById('refreshGraduatesBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', ()=>{ renderGraduates(); });

    // Si otra pestaña modifica localStorage, re-renderizar el panel automáticamente
    window.addEventListener('storage', function(e){
      const keys = ['sg_users','sg_surveys','sg_coordinator_responses_html','sg_coordinator_graduates_html','sg_responses_update'];
      if (keys.includes(e.key)) {
        try { renderGraduates(); renderSurveys(); const responsesList = document.getElementById('responsesList'); if (responsesList) responsesList.innerHTML = localStorage.getItem('sg_coordinator_responses_html') || '<p>No hay respuestas recibidas aún.</p>'; } catch(err) {}
      }
    });

    if(searchInput) searchInput.addEventListener('input', renderGraduates);
    if(filterCarrera) filterCarrera.addEventListener('change', renderGraduates);
    if(filterAnio) filterAnio.addEventListener('change', renderGraduates);
    populateFilters(); renderGraduates();

    // encuestas management
    const surveysContainer = document.querySelector('.surveys-management');
    function renderSurveys(){
      if(!surveysContainer) return;
      const surveys = getSurveys();
      if(surveys.length === 0) { surveysContainer.innerHTML = '<p>No hay encuestas.</p>'; return; }
      // mostrar encuestas con listado, botón publicar y botón eliminar
      surveysContainer.innerHTML = '<div class="survey-list">' + surveys.map(s=>{
        const published = s.active !== false && (s.target === 'all' || s.target);
        const status = (!s.active) ? '(inactiva)' : (s.target === 'all' ? '(publicada a todos)' : '(privada)');
        const publishBtn = (s.target === 'all' && s.active !== false) ? '' : ` <button class="btn btn-primary btn-publish" data-id="${s.id}">Publicar</button>`;
        return `<div class="survey-item-row"><strong>${s.title}</strong> <span class="small" style="margin-left:8px;color:var(--muted)">${status}</span>${publishBtn} <button class="btn btn-outline btn-del" data-id="${s.id}">Eliminar</button></div>`;
      }).join('') + '</div>';
      // boton para editar no implementado; eliminación por delegación ya está soportada
      // Guardar snapshot HTML de encuestas en el panel del Coordinador
      try { localStorage.setItem('sg_coordinator_surveys_html', surveysContainer.innerHTML); } catch(e) { /* noop */ }
    }
    renderSurveys();
    // (removed debug helper button)
    // Attach handler for the "Nueva Encuesta" button (avoid relying on inline onclick)
    try {
      const newSurveyBtn = document.querySelector('.btn-new-survey');
      if (newSurveyBtn && !newSurveyBtn.dataset.bound) {
        newSurveyBtn.addEventListener('click', ()=>{ try{ window.crearEncuesta(); }catch(e){ console.error('crearEncuesta error', e); } });
        newSurveyBtn.dataset.bound = '1';
      }
    } catch(e) { /* noop */ }

    // Cargar respuestas guardadas (HTML) que envían los egresados al panel del coordinador
    const responsesList = document.getElementById('responsesList');
    if (responsesList) {
      const saved = localStorage.getItem('sg_coordinator_responses_html') || '';
      responsesList.innerHTML = saved || '<p>No hay respuestas recibidas aún.</p>';
    }

    // botón limpiar respuestas
    const clearBtn = document.getElementById('clearResponsesBtn');
    if (clearBtn) clearBtn.addEventListener('click', ()=>{
      if (!confirm('¿Limpiar todas las respuestas almacenadas en el panel del coordinador?')) return;
      localStorage.removeItem('sg_coordinator_responses_html');
      const rl = document.getElementById('responsesList'); if (rl) rl.innerHTML = '<p>No hay respuestas recibidas aún.</p>';
    });
    // botón exportar respuestas (CSV)
    const exportRespBtn = document.getElementById('exportResponsesBtn');
    if (exportRespBtn) exportRespBtn.addEventListener('click', () => { try { window.exportResponsesCSV(); } catch(e){ console.error(e); alert('Error exportando respuestas'); } });

    // Editar estadísticas: alternar a formulario editable
    const editStatsBtn = document.getElementById('editStatsBtn');
    if (editStatsBtn) {
      editStatsBtn.addEventListener('click', ()=>{
        const statsGrid = document.querySelector('.stats-grid');
        if (!statsGrid) return;
        // crear form con los valores actuales
        const getText = id => (statsGrid.querySelector('#'+id)?.textContent || '').replace('%','').trim();
        const curTotal = getText('stat_totalUsers') || '150';
        const curApproved = getText('stat_approved') || '120';
        const curPending = getText('stat_pending') || '8';
        const curEmp = getText('stat_employed_pct') || '68';
        statsGrid.innerHTML = `
          <div class="stat-card"><h3>Total usuarios</h3><input id="edit_totalUsers" value="${curTotal}"></div>
          <div class="stat-card"><h3>Usuarios aprobados</h3><input id="edit_approved" value="${curApproved}"></div>
          <div class="stat-card"><h3>Registros pendientes</h3><input id="edit_pending" value="${curPending}"></div>
          <div class="stat-card"><h3>Empleabilidad (%)</h3><input id="edit_emp" value="${curEmp}"></div>
          <div style="grid-column:1/-1;margin-top:8px"><button id="saveStatsBtn" class="btn btn-primary">Guardar estadísticas</button> <button id="cancelStatsBtn" class="btn btn-link">Cancelar</button></div>
        `;
        document.getElementById('saveStatsBtn').addEventListener('click', ()=>{
          const t = (document.getElementById('edit_totalUsers')||{}).value || '0';
          const a = (document.getElementById('edit_approved')||{}).value || '0';
          const p = (document.getElementById('edit_pending')||{}).value || '0';
          const e = (document.getElementById('edit_emp')||{}).value || '0';
          const snapshot = `
            <div class="stat-card"><h3>Total usuarios</h3><div id="stat_totalUsers" class="stat-value">${t}</div></div>
            <div class="stat-card"><h3>Usuarios aprobados</h3><div id="stat_approved" class="stat-value">${a}</div></div>
            <div class="stat-card"><h3>Registros pendientes</h3><div id="stat_pending" class="stat-value">${p}</div></div>
            <div class="stat-card"><h3>Empleabilidad (%)</h3><div id="stat_employed_pct" class="stat-value">${e}%</div></div>
          `;
          localStorage.setItem('sg_coordinator_stats_html', snapshot);
          statsGrid.innerHTML = snapshot;
        });
        document.getElementById('cancelStatsBtn').addEventListener('click', ()=>{
          const saved = localStorage.getItem('sg_coordinator_stats_html');
          if (saved) statsGrid.innerHTML = saved; else renderCoordinadorPage(sess);
        });
      });
    }

    // boton exportar CSV
    const exportBtn = document.getElementById('exportStatsBtn');
    if (exportBtn) exportBtn.addEventListener('click', () => { try { window.exportStatsCSV(); } catch(e){ console.error(e); alert('Error exportando CSV'); } });
  }

  /* Render small visual charts for the stats area (no external libs) */
  function renderStatsVisuals(statsGrid) {
    if (!statsGrid) return;
    try {
      // read numeric values
      const readNum = (id) => {
        const el = statsGrid.querySelector('#' + id);
        if (!el) return 0;
        const txt = (el.textContent || '').replace(/%/g,'').trim();
        const num = parseFloat(txt.replace(/[^0-9.\-]/g,''));
        return isNaN(num) ? 0 : num;
      };
      const total = Math.max(0, Math.round(readNum('stat_totalUsers')));
      const approved = Math.max(0, Math.round(readNum('stat_approved')));
      const pending = Math.max(0, Math.round(readNum('stat_pending')));
      const employedPct = Math.max(0, Math.min(100, readNum('stat_employed_pct')));

      // small progress bars for approved and pending relative to total
      ['stat_approved','stat_pending'].forEach(id => {
        const el = statsGrid.querySelector('#' + id);
        if (!el) return;
        let card = el.closest('.stat-card');
        if (!card) card = el.parentElement;
        let bar = card.querySelector('.stat-bar');
        if (!bar) {
          bar = document.createElement('div'); bar.className = 'stat-bar';
          const inner = document.createElement('i'); inner.style.width = '0%'; bar.appendChild(inner);
          card.appendChild(bar);
        }
        const inner = bar.querySelector('i');
        let pct = 0;
        if (total > 0) {
          const val = parseFloat((el.textContent||'').replace(/[^0-9.\-]/g,'')) || 0;
          pct = Math.round((val / total) * 100);
        }
        inner.style.width = pct + '%';
      });

      // donut for employability
      const empEl = statsGrid.querySelector('#stat_employed_pct');
      if (empEl) {
        let card = empEl.closest('.stat-card') || empEl.parentElement;
        let canvas = card.querySelector('canvas.donut-chart');
        if (!canvas) {
          canvas = document.createElement('canvas');
          canvas.className = 'donut-chart';
          // provide an explicit drawing size (CSS handles visual size)
          canvas.width = 160; canvas.height = 160;
          card.appendChild(canvas);
        }
        drawDonut(canvas, employedPct);
      }
    } catch (e) { console.error('renderStatsVisuals failed', e); }
  }

  function drawDonut(canvas, percent) {
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width; const h = canvas.height; const size = Math.min(w,h);
    const cx = w/2; const cy = h/2; const lineWidth = Math.max(10, Math.floor(size * 0.12));
    const radius = (size/2) - lineWidth - 2;
    ctx.clearRect(0,0,w,h);
    // background ring
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2); ctx.strokeStyle = '#eef2ff'; ctx.lineWidth = lineWidth; ctx.stroke();
    // foreground arc
    const start = -Math.PI/2;
    const end = start + (Math.PI*2) * (Math.max(0, Math.min(100, percent)) / 100);
    // gradient
    const grad = ctx.createLinearGradient(0,0,w,h); grad.addColorStop(0, '#6366f1'); grad.addColorStop(1, '#06b6d4');
    ctx.beginPath(); ctx.arc(cx, cy, radius, start, end, false); ctx.strokeStyle = grad; ctx.lineWidth = lineWidth; ctx.lineCap = 'round'; ctx.stroke();
    // center text
    ctx.fillStyle = '#0f172a'; ctx.font = Math.max(12, Math.floor(size*0.12)) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(percent) + '%', cx, cy);
  }

  // Generar y descargar CSVs: usuarios, encuestas y respuestas
  window.exportStatsCSV = function exportStatsCSV(){
    const users = getUsers();
    const surveys = getSurveys();
    const responses = getResponses();

    function escapeCell(v){ if (v === null || v === undefined) return ''; return String(v).replace(/"/g,'""'); }
    function rowsToCSV(rows){ return rows.map(r => r.map(c => '"'+escapeCell(c)+'"').join(',')).join('\n'); }

    // users.csv
    const userHeader = ['name','surname','email','role','status','cedula','carrera','anioGraduacion','telefono','createdAt','trabaja','empresa','puesto'];
    const userRows = users.map(u => [u.name||'', u.surname||'', u.email||'', u.role||'', u.status||'', u.cedula||'', u.carrera||'', u.anioGraduacion||'', u.telefono||'', u.createdAt||'', (u.employment && u.employment.trabaja) || '', (u.employment && u.employment.empresa) || '', (u.employment && u.employment.puesto) || '']);
    const usersCsv = rowsToCSV([userHeader].concat(userRows));

    // surveys.csv
    const surveyHeader = ['id','title','createdAt','active'];
    const surveyRows = surveys.map(s => [s.id||'', s.title||'', s.createdAt||'', s.active===false ? 'false' : 'true']);
    const surveysCsv = rowsToCSV([surveyHeader].concat(surveyRows));

    // responses.csv
    const respHeader = ['surveyId','surveyTitle','email','answer','submittedAt'];
    const respRows = responses.map(r => {
      const s = surveys.find(x=>x.id==r.surveyId);
      return [r.surveyId||'', s ? s.title : '', r.email||'', r.answer||'', r.submittedAt||''];
    });
    const responsesCsv = rowsToCSV([respHeader].concat(respRows));

    // pequeño resumen de estadísticas
    const all = users.length;
    const approved = users.filter(u=> (u.status||'approved')==='approved').length;
    const pending = users.filter(u=> (u.status||'pending')==='pending').length;
    const employed = users.filter(u=> u.employment && u.employment.trabaja === 'si').length;
    const summaryCsv = rowsToCSV([['metric','value'], ['total_users', all], ['approved', approved], ['pending', pending], ['employed', employed]]);

    // Intentar crear ZIP con JSZip (si no está, cargar desde CDN)
    function doZipAndDownload(){
      try{
        const zip = new JSZip();
        zip.file('summary_stats.csv', summaryCsv);
        zip.file('users.csv', usersCsv);
        zip.file('surveys.csv', surveysCsv);
        zip.file('responses.csv', responsesCsv);
        zip.generateAsync({type:'blob'}).then(blob=>{
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = 'reports.zip'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        }).catch(e=>{ console.error('zip generate error', e); fallback(); });
      } catch(e){ console.error('zip error', e); fallback(); }
    }

    function fallback(){
      // descarga separada si no hay ZIP
      function download(filename, content){ const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
      try{ download('summary_stats.csv', summaryCsv); download('users.csv', usersCsv); download('surveys.csv', surveysCsv); download('responses.csv', responsesCsv); } catch(e){ console.error('download error', e); alert('Error al generar CSVs'); }
    }

    if (window.JSZip) { doZipAndDownload(); return; }
    // Intentar cargar versión local primero (./js/jszip.min.js). Si falla, intentar CDN.
    const localScript = document.createElement('script');
    localScript.src = './js/jszip.min.js';
    localScript.onload = () => { setTimeout(doZipAndDownload, 50); };
    localScript.onerror = () => {
      console.warn('No se pudo cargar JSZip local; intentando CDN...');
      const cdnScript = document.createElement('script');
      cdnScript.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
      cdnScript.onload = () => { setTimeout(doZipAndDownload, 50); };
      cdnScript.onerror = () => { console.warn('No se pudo cargar JSZip desde CDN, usando descarga separada'); fallback(); };
      document.head.appendChild(cdnScript);
    };
    document.head.appendChild(localScript);
  };

  // Exportar solo las respuestas (CSV simple)
  window.exportResponsesCSV = function exportResponsesCSV(){
    try {
      const responses = getResponses();
      if (!responses || responses.length === 0) return alert('No hay respuestas para exportar.');
      function escapeCell(v){ if (v === null || v === undefined) return ''; return String(v).replace(/"/g,'""'); }
      const header = ['surveyId','surveyTitle','email','answers','submittedAt'];
      const rows = responses.map(r => [r.surveyId||'', r.surveyTitle||'', r.email||'', (Array.isArray(r.answers) ? r.answers.join(' | ') : (r.answer||'')), r.submittedAt||'']);
      const csv = [header].concat(rows).map(r => r.map(c => '"'+escapeCell(c)+'"').join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'responses.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch(e) { console.error('exportResponsesCSV error', e); alert('Error exportando respuestas'); }
  };

  // Safety: ensure the "Nueva Encuesta" button always triggers crearEncuesta regardless of timing
  try {
    setTimeout(() => {
      const btn = document.querySelector('.btn-new-survey');
      if (!btn) return;
      // add a listener only if not already present
      if (!btn.dataset.listenerBound) {
        btn.addEventListener('click', (ev) => {
          try {
            if (window.crearEncuesta) {
              window.crearEncuesta();
            } else {
              alert('Función crearEncuesta no disponible en este momento. Revise la consola para más detalles.');
              console.warn('crearEncuesta no definida');
            }
          } catch (e) { console.error('Error ejecutando crearEncuesta desde bound listener', e); alert('Error al abrir formulario. Ver consola.'); }
        });
        btn.dataset.listenerBound = '1';
      }
    }, 100);
  } catch (e) { console.error('bind new-survey button error', e); }

  // Render para egresado
  function renderEgresadoPage(sess){
    console.log('renderEgresadoPage called', !!sess);
    const email = sess.email;
    const users = getUsers();
    const me = users.find(u=> (u.email||'').toLowerCase() === (email||'').toLowerCase());

    // perfil
    const profileEl = document.querySelector('.profile-info');
    if(profileEl){
      profileEl.innerHTML = `
        <p><strong>Nombre:</strong> ${me.name || ''} ${me.surname || ''}</p>
        <p><strong>Cédula:</strong> ${me.cedula || ''}</p>
        <p><strong>Carrera:</strong> ${me.carrera || ''}</p>
        <p><strong>Año graduación:</strong> ${me.anioGraduacion || ''}</p>
        <p><strong>Email:</strong> ${me.email || ''}</p>
      `;
      try { localStorage.setItem('sg_egresado_profile_html', profileEl.innerHTML); } catch(e) { /* noop */ }
    }

    // encuestas pendientes (formularios con preguntas)
    const surveysList = document.querySelector('.surveys-list');
    if(surveysList){
  const surveys = getSurveys().filter(s=> s.active !== false && (s.target === 'all' || !s.target));
      if (surveys.length === 0) { surveysList.innerHTML = '<p>No hay encuestas disponibles.</p>'; }
      else {
        surveysList.innerHTML = surveys.map(s=>{
          // No se consultan JSON de respuestas: el egresado siempre ve el formulario (o mensaje si ya envió)
          // renderizar formulario de encuesta
          const inputs = (s.questions||[]).map((q,idx)=>`<div class="form-group"><label>${q}</label><input class="survey-q-input" data-idx="${idx}" name="q-${idx}" type="text"></div>`).join('');
          return `<div class="survey-item"><h4>${s.title}</h4><form data-id="${s.id}" class="survey-form">${inputs}<div style="margin-top:8px"><button type="button" class="btn btn-primary btn-respond" data-id="${s.id}">Enviar respuestas</button></div></form></div>`;
        }).join('');
        try { localStorage.setItem('sg_egresado_surveys_html', surveysList.innerHTML); } catch(e) { /* noop */ }
      }
    }

    // empleabilidad form
    const empForm = document.getElementById('empleabilidadForm');
    if(empForm){
      // Employment form now supports multiple experiences
      empForm.innerHTML = `
        <label>¿Actualmente trabaja?</label>
        <select id="emp_trabaja"><option value="">Selecciona</option><option value="si">Sí</option><option value="no">No</option></select>
        <label>Empresa (actual)</label>
        <input id="emp_empresa" type="text">
        <label>Puesto (actual)</label>
        <input id="emp_puesto" type="text">
        <div style="margin-top:12px">
          <h4>Experiencias laborales</h4>
          <div id="expList"></div>
          <div style="margin-top:8px">
            <button id="addExperienceBtn" type="button" class="btn btn-outline">Añadir experiencia</button>
          </div>
        </div>
        <div style="margin-top:12px"><button id="empSave" class="btn btn-primary">Guardar</button></div>
      `;
      // helper to create experience item UI
      function addExperienceItem(data){
        const list = empForm.querySelector('#expList');
        const idx = list.children.length;
        const div = document.createElement('div'); div.className = 'exp-item';
        div.style = 'border:1px solid rgba(0,0,0,0.04);padding:8px;border-radius:6px;margin-bottom:8px;';
        div.innerHTML = `
          <label>Empresa</label>
          <input class="exp_company" data-idx="${idx}" type="text" value="${(data && data.company) ? data.company.replace(/"/g,'&quot;') : ''}">
          <label>Puesto</label>
          <input class="exp_role" data-idx="${idx}" type="text" value="${(data && data.role) ? data.role.replace(/"/g,'&quot;') : ''}">
          <label>Desde</label>
          <input class="exp_from" data-idx="${idx}" type="month" value="${(data && data.from) ? data.from : ''}">
          <label>Hasta</label>
          <input class="exp_to" data-idx="${idx}" type="month" value="${(data && data.to) ? data.to : ''}">
          <label>Descripción</label>
          <textarea class="exp_desc" data-idx="${idx}" rows="2">${(data && data.description) ? data.description : ''}</textarea>
          <div style="margin-top:6px"><button type="button" class="btn btn-outline btn-remove-exp">Eliminar</button></div>
        `;
        list.appendChild(div);
        // attach remove handler
        div.querySelector('.btn-remove-exp').addEventListener('click', ()=>{ div.remove(); });
      }

      // precargar existing employment info
      const emp = me.employment || {};
      document.getElementById('emp_trabaja').value = emp.trabaja || '';
      document.getElementById('emp_empresa').value = emp.empresa || '';
      document.getElementById('emp_puesto').value = emp.puesto || '';
      const experiences = Array.isArray(emp.experiences) ? emp.experiences : [];
      if (experiences.length === 0) addExperienceItem(); else experiences.forEach(e=> addExperienceItem(e));

      empForm.querySelector('#addExperienceBtn').addEventListener('click', ()=> addExperienceItem());

      document.getElementById('empSave').addEventListener('click', ()=>{
        const nueva = { trabaja: (document.getElementById('emp_trabaja')||{}).value || '', empresa: (document.getElementById('emp_empresa')||{}).value || '', puesto: (document.getElementById('emp_puesto')||{}).value || '' };
        // collect experiences
        const expNodes = Array.from(empForm.querySelectorAll('.exp-item'));
        const exps = expNodes.map(n => ({
          company: (n.querySelector('.exp_company')||{}).value || '',
          role: (n.querySelector('.exp_role')||{}).value || '',
          from: (n.querySelector('.exp_from')||{}).value || '',
          to: (n.querySelector('.exp_to')||{}).value || '',
          description: (n.querySelector('.exp_desc')||{}).value || ''
        })).filter(x=> x.company || x.role || x.description);
        if (exps.length) nueva.experiences = exps;
        updateUser(email, { employment: nueva });
        alert('Información laboral guardada.');
        try { localStorage.setItem('sg_egresado_employment_html', empForm.innerHTML); } catch(e) {}
        try{ renderEgresadoPage(JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null')); }catch(e){}
      });
    }

    // capacitaciones
    const trainingList = document.querySelector('.training-list');
    if(trainingList){
      const trainings = (me.trainings || []);
      trainingList.innerHTML = trainings.length === 0 ? '<p>No tienes capacitaciones registradas.</p>' : '<ul>' + trainings.map(t=>`<li>${t}</li>`).join('') + '</ul>';
      try { localStorage.setItem('sg_egresado_trainings_html', trainingList.innerHTML); } catch(e) {}
    }
  }

  // permitir que el coordinador cree encuestas desde la UI — modal overlay (más robusto)
  window.crearEncuesta = function crearEncuesta(){
    try {
      // remove existing overlay if any
      const prev = document.getElementById('surveyOverlay'); if (prev) prev.remove();

      // create overlay
      const overlay = document.createElement('div');
      overlay.id = 'surveyOverlay';
      overlay.style = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;';

      const card = document.createElement('div');
      card.className = 'survey-create-modal card';
      card.style = 'width:100%;max-width:720px;background:#fff;border-radius:8px;padding:18px;box-shadow:0 12px 40px rgba(2,6,23,0.3);max-height:90vh;overflow:auto;';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <h3 style="margin:0">Nueva Encuesta</h3>
          <button id="closeSurveyOverlay" class="btn btn-link">Cerrar</button>
        </div>
        <label>Título</label>
        <input id="newSurveyTitle" type="text" placeholder="Título de la encuesta" style="width:100%;margin-bottom:8px;padding:8px;border:1px solid #ddd;border-radius:6px;">
        <div style="margin-bottom:8px"><label><input id="surveyTargetAll" type="checkbox" checked> Mostrar a todos los egresados</label></div>
        <div id="newQuestions"></div>
        <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end">
          <button id="addQuestionBtn" class="btn btn-outline">Añadir pregunta</button>
          <button id="saveSurveyBtn" class="btn btn-primary">Guardar encuesta</button>
        </div>
      `;

      overlay.appendChild(card);
      document.body.appendChild(overlay);

      const questionsEl = card.querySelector('#newQuestions');
      function addQuestion(value){ const idx = questionsEl.childElementCount + 1; const q = document.createElement('div'); q.className='form-group'; q.style='margin-top:8px'; q.innerHTML = `<label>Pregunta ${idx}</label><input class="new-q" type="text" value="${(value||'').replace(/"/g,'&quot;')}" placeholder="Texto de la pregunta" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px">`; questionsEl.appendChild(q); }
      addQuestion('');

      card.querySelector('#addQuestionBtn').addEventListener('click', ()=> addQuestion(''));
      card.querySelector('#closeSurveyOverlay').addEventListener('click', ()=> { overlay.remove(); try { const sessNow = JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null'); if (window._renderCoordinadorPage) window._renderCoordinadorPage(sessNow); } catch(e){} });

      card.querySelector('#saveSurveyBtn').addEventListener('click', ()=>{
        try {
          const title = (card.querySelector('#newSurveyTitle')||{}).value || '';
          if (!title.trim()) return alert('Título requerido');
          const qs = Array.from(card.querySelectorAll('.new-q')).map(i=> (i.value||'').trim()).filter(Boolean);
          if (qs.length === 0) return alert('Añada al menos una pregunta');
          const surveys = getSurveys();
          const id = String(Date.now()) + '-' + Math.random().toString(36).slice(2,8);
          const targetAll = !!card.querySelector('#surveyTargetAll') && !!card.querySelector('#surveyTargetAll').checked;
          surveys.push({ id:id, title:title.trim(), questions: qs, createdAt: new Date().toISOString(), active:true, target: targetAll ? 'all' : undefined });
          saveSurveys(surveys);
          // Immediately update the coordinator's management section (if present)
          try {
            const mgr = document.querySelector('.surveys-management');
            const mgrHtml = (surveys.length === 0) ? '<p>No hay encuestas.</p>' : '<div class="survey-list">' + surveys.map(s=>`<div class="survey-item-row"><strong>${s.title}</strong> <button class="btn btn-outline btn-del" data-id="${s.id}">Eliminar</button></div>`).join('') + '</div>';
            if (mgr) {
              mgr.innerHTML = mgrHtml;
            }
            try { localStorage.setItem('sg_coordinator_surveys_html', mgrHtml); } catch(e) { /* noop */ }
          } catch(e) { console.error('failed to update coordinator surveys management DOM', e); }
          // build rendered HTML for the new survey exactly as shown to egresados
          try {
            const renderedForEgresado = (function buildSurveyHtml(s){
              const inputs = (s.questions||[]).map((q,idx)=>`<div class="form-group"><label>${q}</label><input class="survey-q-input" data-idx="${idx}" name="q-${idx}" type="text"></div>`).join('');
              return `<div class="survey-item"><h4>${s.title}</h4><form data-id="${s.id}" class="survey-form">${inputs}<div style="margin-top:8px"><button type="button" class="btn btn-primary btn-respond" data-id="${s.id}">Enviar respuestas</button></div></form></div>`;
            })({ id, title: title.trim(), questions: qs });

            // If this tab currently has an .surveys-list (egresado view), inject the new survey markup so it appears immediately
            try {
              const surveysListEl = document.querySelector('.surveys-list');
              if (surveysListEl) {
                // avoid duplicates: if a form with this data-id already exists, skip insertion
                const exists = !!surveysListEl.querySelector(`form[data-id="${id}"]`);
                if (!exists) {
                  // If the list previously said "No hay encuestas disponibles.", replace it
                  const emptyMsg = surveysListEl.textContent && surveysListEl.textContent.trim().toLowerCase().includes('no hay encuestas');
                  if (emptyMsg || !surveysListEl.innerHTML.trim()) {
                    surveysListEl.innerHTML = renderedForEgresado;
                  } else {
                    // prepend the new survey so it appears first
                    surveysListEl.innerHTML = renderedForEgresado + surveysListEl.innerHTML;
                  }
                  // persist egresado snapshot as the rest of sync logic expects
                  try { localStorage.setItem('sg_egresado_surveys_html', surveysListEl.innerHTML); } catch(e) { /* noop */ }
                }
              }
            } catch(e) { console.error('inject new survey into current surveys-list failed', e); }
          } catch(e) { console.error('build/render new survey failed', e); }
          // Force a small update key so other tabs reliably receive a storage event
          try { localStorage.setItem('sg_surveys_update', new Date().toISOString()); } catch(e) { console.error('failed to set sg_surveys_update', e); }
          // persist coordinator snapshot
          try { localStorage.setItem('sg_coordinator_surveys_html', document.querySelector('.surveys-management')?.innerHTML || ''); } catch(e){}
          overlay.remove();
          alert('Encuesta creada');
          try {
            const sessNow = JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');
            const path = location.pathname.split('/').pop();
            if (path === 'dashboard-coordinador.html') {
              if (window._renderCoordinadorPage) window._renderCoordinadorPage(sessNow);
            }
            // do NOT call renderEgresadoPage here with the coordinator session (that can break rendering in this tab)
            // other tabs with egresado will receive the storage event and re-render themselves
          } catch(e){ console.error(e); }
        } catch(e) { console.error('save survey modal error', e); alert('Error guardando encuesta. Revisa la consola.'); }
      });

      // focus title
      try { const t = card.querySelector('#newSurveyTitle'); if (t) t.focus(); } catch(e){}
    } catch (e) { console.error('crearEncuesta modal error', e); alert('Error al abrir formulario de encuesta. Revisa la consola.'); }
  };

  // permitir editar perfil desde el panel del egresado (simple prompt-based)
  window.editarPerfil = function editarPerfil(){
    const sess = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if(!sess) return alert('No hay sesión');
    const email = sess.email;
    const users = getUsers();
    const me = users.find(u=> (u.email||'').toLowerCase() === (email||'').toLowerCase());
    if(!me) return alert('Usuario no encontrado');
    const name = prompt('Nombre', me.name || '') || me.name;
    const surname = prompt('Apellido', me.surname || '') || me.surname;
    const telefono = prompt('Teléfono', me.telefono || '') || me.telefono;
    const carrera = prompt('Carrera', me.carrera || '') || me.carrera;
    updateUser(email, { name:name, surname:surname, telefono:telefono, carrera:carrera });
    // actualizar UI
    try{ const newSess = JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null'); renderEgresadoPage(newSess); if(document.getElementById('userName')) document.getElementById('userName').textContent = name; }catch(e){}
    alert('Perfil actualizado');
  };

    // Inicializadores públicos para header/footer (llamados tras fetch de los componentes)
    window.initHeader = function initHeader() {
      try {
        const sess = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
        const nav = document.getElementById('navActions');
        const headerUser = document.getElementById('headerUser');
        const headerUserName = document.getElementById('headerUserName');
        const headerProfileLink = document.getElementById('headerProfileLink');
        const headerLogout = document.getElementById('headerLogout');

        if (sess) {
          if (nav) nav.style.display = 'none';
          if (headerUser) {
            headerUser.style.display = 'inline-flex';
            if (headerUserName) headerUserName.textContent = sess.name || sess.email;
            if (headerProfileLink) {
              headerProfileLink.href = (sess.role||'').toLowerCase() === 'coordinador' ? 'dashboard-coordinador.html' : 'dashboard-egresado.html';
            }
            if (headerLogout) headerLogout.addEventListener('click', () => { sessionStorage.removeItem(SESSION_KEY); location.href = 'index.html'; });
          }
        } else {
          if (nav) nav.style.display = 'block';
          if (headerUser) headerUser.style.display = 'none';
        }
      } catch (e) { console.error('initHeader error', e); }
    };

    window.initFooter = function initFooter() {
      try { const yearEl = document.getElementById('year'); if (yearEl) yearEl.textContent = new Date().getFullYear(); }
      catch (e) { console.error('initFooter error', e); }
    };

  // Exponer funciones de render para depuración y pruebas manuales
  try { window._renderCoordinadorPage = renderCoordinadorPage; window._renderEgresadoPage = renderEgresadoPage; } catch(e) { /* noop */ }

  // Global storage handler: if surveys change, re-render current dashboard view so changes appear across tabs
  try {
    window.addEventListener('storage', function(e){
      try {
        if (!e.key) return;
        if (e.key === SURVEYS_KEY || e.key === 'sg_surveys' || e.key === 'sg_surveys_update') {
          const sessNow = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
          const path = location.pathname.split('/').pop();
          if (path === 'dashboard-egresado.html') {
            if (window._renderEgresadoPage) window._renderEgresadoPage(sessNow);
          }
          if (path === 'dashboard-coordinador.html') {
            if (window._renderCoordinadorPage) window._renderCoordinadorPage(sessNow);
          }
        }
      } catch(err) { console.error('global storage handler error', err); }
    });
  } catch(e) { /* noop */ }

  // (removed development helper: forceSeedSurveys)

    // Delegación de eventos para acciones dinámicas en la app (egresado y coordinador)
    document.body.addEventListener('click', function delegatedAppActions(e){
      try {
        // RESPONDER ENCUESTA (egresado) - multi-question form
          // Nueva encuesta (coordinador)
          const newSurveyBtn = e.target.closest && e.target.closest('.btn-new-survey');
          if (newSurveyBtn) {
            // make sure the encuestas section is visible/active before opening the form
            try {
              document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
              const sec = document.getElementById('encuestas'); if (sec) sec.classList.add('active');
              const navItems = document.querySelectorAll('.nav-menu .nav-item'); navItems.forEach(n=>n.classList.remove('active'));
              const targetNav = document.querySelector('.nav-menu .nav-item[href="#encuestas"]'); if (targetNav) targetNav.classList.add('active');
              try { history.replaceState(null,'','#encuestas'); } catch(e) { /* noop */ }
            } catch(e) { console.error('activate encuestas section error', e); }
            try { if (window.crearEncuesta) window.crearEncuesta(); else console.warn('crearEncuesta no definida'); } catch(err){ console.error('crearEncuesta error', err); }
            return;
          }

          const respondBtn = e.target.closest && e.target.closest('.btn-respond');
        if (respondBtn) {
          const sess = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
          if (!sess) return alert('Debe iniciar sesión');
          const surveyId = respondBtn.dataset.id;
          // encontrar el form asociado
          const form = respondBtn.closest('.survey-item')?.querySelector('.survey-form');
          if (!form) return alert('Formulario no encontrado');
          const inputs = Array.from(form.querySelectorAll('.survey-q-input'));
          const answers = inputs.map(i => (i.value||'').trim());
          // Enviar la respuesta al panel del Coordinador como HTML (no JSON). No guardamos JSON de respuestas.
          try {
            const surveys = getSurveys();
            const s = surveys.find(x=>x.id == surveyId) || {};
            const submittedAt = new Date().toLocaleString();
            const respHtml = `
              <div class="response-item" data-survey-id="${surveyId}" style="border:1px solid #ddd;padding:10px;margin-bottom:8px;border-radius:4px;background:#fff;">
                <h4 style="margin:0 0 6px">${s.title || 'Encuesta'}</h4>
                <div style="font-size:0.9em;color:#333;margin-bottom:6px"><strong>Remitente:</strong> ${sess.email || ''} — <small>${submittedAt}</small></div>
                <ul style="margin:0;padding-left:18px">${answers.map((a,i)=>`<li><strong>Q${i+1}:</strong> ${a || '<em>Sin respuesta</em>'}</li>`).join('')}</ul>
              </div>
            `;
            const existing = localStorage.getItem('sg_coordinator_responses_html') || '';
            const combined = respHtml + existing; // poner lo más reciente arriba
            localStorage.setItem('sg_coordinator_responses_html', combined);
            // Also save a structured response for exports and analytics (kept out of coordinator UI as JSON)
            try {
              const struct = getResponses();
              struct.unshift({ surveyId: surveyId, surveyTitle: s.title || '', email: sess.email || '', answer: answers.join(' | '), answers: answers, submittedAt: new Date().toISOString() });
              saveResponses(struct);
              // notify other tabs that responses changed
              try { localStorage.setItem('sg_responses_update', new Date().toISOString()); } catch(e) {}
            } catch(e) { console.error('failed to save structured response', e); }
            // si el coordinador está en la página, refrescar la vista
            const sessNow = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
            if (sessNow && (sessNow.role||'').toLowerCase() === 'coordinador') {
              try { renderCoordinadorPage(sessNow); } catch(e) { /* noop */ }
            }
          } catch(e) { console.error('failed to send response to coordinator panel', e); }
          // Mostrar mensaje al egresado: enviado (no se guarda JSON en su lado)
          try{
            const formEl = form;
            if (formEl) formEl.outerHTML = '<div class="survey-sent" style="padding:8px;background:#eef; border-radius:4px;">Respuesta enviada. Gracias.</div>';
          }catch(e){}
          try{ renderEgresadoPage(sess); }catch(err){}
          return;
        }

        // GUARDAR EMPLEABILIDAD (egresado)
        const empSave = e.target.closest && e.target.closest('#empSave');
        if (empSave) {
          const sess = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
          if (!sess) return alert('Debe iniciar sesión');
          const email = sess.email;
          const nueva = { trabaja: (document.getElementById('emp_trabaja')||{}).value || '', empresa: (document.getElementById('emp_empresa')||{}).value || '', puesto: (document.getElementById('emp_puesto')||{}).value || '' };
          updateUser(email, { employment: nueva });
          alert('Información laboral guardada.');
          try{ renderEgresadoPage(sess); }catch(err){}
          return;
        }

        // APROBAR usuario (coordinador)
        const approveBtn = e.target.closest && e.target.closest('.btn-approve');
        if (approveBtn) {
          const sess = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
          if (!sess) return alert('Debe iniciar sesión como Coordinador');
          updateUser(approveBtn.dataset.email, { status: 'approved' });
          try{ renderCoordinadorPage(sess); }catch(err){}
          return;
        }

        // RECHAZAR usuario (coordinador)
        const rejectBtn = e.target.closest && e.target.closest('.btn-reject');
        if (rejectBtn) {
          const sess = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
          if (!sess) return alert('Debe iniciar sesión como Coordinador');
          updateUser(rejectBtn.dataset.email, { status: 'rejected' });
          try{ renderCoordinadorPage(sess); }catch(err){}
          return;
        }

        // PUBLICAR encuesta (coordinador) - enviar manualmente a todos los egresados
        const publishBtn = e.target.closest && e.target.closest('.btn-publish');
        if (publishBtn) {
          const sess = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
          if (!sess || (sess.role||'').toLowerCase() !== 'coordinador') return alert('Debe iniciar sesión como Coordinador');
          try {
            const id = publishBtn.dataset.id;
            const surveys = getSurveys();
            const s = surveys.find(x=> x.id == id);
            if (!s) return alert('Encuesta no encontrada');
            s.active = true;
            s.target = 'all';
            saveSurveys(surveys);
            // update coordinator management DOM quickly
            try {
              const mgr = document.querySelector('.surveys-management');
              const mgrHtml = (surveys.length === 0) ? '<p>No hay encuestas.</p>' : '<div class="survey-list">' + surveys.map(s=>`<div class="survey-item-row"><strong>${s.title}</strong> <button class="btn btn-primary btn-publish" data-id="${s.id}">Publicar</button> <button class="btn btn-outline btn-del" data-id="${s.id}">Eliminar</button></div>`).join('') + '</div>';
              if (mgr) mgr.innerHTML = mgrHtml;
              try { localStorage.setItem('sg_coordinator_surveys_html', mgrHtml); } catch(e) {}
            } catch(e) { console.error('failed to update coordinator DOM after publish', e); }

            // Inject into current egresado view if present (avoid duplicates)
            try {
              const rendered = (function build(s){ const inputs = (s.questions||[]).map((q,idx)=>`<div class="form-group"><label>${q}</label><input class="survey-q-input" data-idx="${idx}" name="q-${idx}" type="text"></div>`).join(''); return `<div class="survey-item"><h4>${s.title}</h4><form data-id="${s.id}" class="survey-form">${inputs}<div style="margin-top:8px"><button type="button" class="btn btn-primary btn-respond" data-id="${s.id}">Enviar respuestas</button></div></form></div>`; })(s);
              const surveysListEl = document.querySelector('.surveys-list');
              if (surveysListEl) {
                const exists = !!surveysListEl.querySelector(`form[data-id="${s.id}"]`);
                if (!exists) {
                  const emptyMsg = surveysListEl.textContent && surveysListEl.textContent.trim().toLowerCase().includes('no hay encuestas');
                  if (emptyMsg || !surveysListEl.innerHTML.trim()) surveysListEl.innerHTML = rendered; else surveysListEl.innerHTML = rendered + surveysListEl.innerHTML;
                  try { localStorage.setItem('sg_egresado_surveys_html', surveysListEl.innerHTML); } catch(e){}
                }
              }
            } catch(e) { console.error('inject after publish failed', e); }

            // Trigger storage event for other tabs
            try { localStorage.setItem('sg_surveys_update', new Date().toISOString()); } catch(e) { console.error(e); }
            try{ renderCoordinadorPage(sess); }catch(err){}
          } catch(e) { console.error('publish button error', e); alert('Error publicando encuesta'); }
          return;
        }

        // ELIMINAR encuesta (coordinador)
        const delBtn = e.target.closest && e.target.closest('.btn-del');
        if (delBtn) {
          const sess = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
          if (!sess) return alert('Debe iniciar sesión como Coordinador');
          const id = delBtn.dataset.id;
          const all = getSurveys().filter(x=>x.id != id);
          saveSurveys(all);
          try{ renderCoordinadorPage(sess); }catch(err){}
          return;
        }

        // EXPORTAR CSV/ZIP
        const exportBtn = e.target.closest && e.target.closest('#exportStatsBtn');
        if (exportBtn) { try{ window.exportStatsCSV(); }catch(err){ console.error(err); alert('Error exportando'); } return; }

      } catch (e) { console.error('delegatedAppActions error', e); }
    });

})();