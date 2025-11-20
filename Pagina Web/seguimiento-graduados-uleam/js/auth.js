// Este archivo contiene funciones relacionadas con la autenticación de usuarios, como el inicio de sesión y el registro.

// Manejo simple de usuarios en localStorage (clave: sg_users)
// Formatos y validaciones básicas en el cliente

(function () {
  const LS_KEY = 'sg_users';
  const SESSION_KEY = 'sg_session';
  const today = new Date();

  /* Utilidades de almacenamiento */
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

  /* Validaciones */
  function isValidEmail(email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
    // exigir correo institucional ULEAM
    return email.toLowerCase().endsWith('@uleam.edu.ec');
  }

  // Validación de cédula ecuatoriana (10 dígitos)
  function isValidCedula(ced) {
    if (!/^\d{10}$/.test(ced)) return false;
    const digits = ced.split('').map(d=>parseInt(d,10));
    const province = parseInt(ced.substring(0,2),10);
    if (province < 1 || province > 24) return false; // provincias válidas en Ecuador
    const third = digits[2];
    if (third >= 6) return false;
    let sum = 0;
    for (let i=0;i<9;i++){
      let val = digits[i];
      if (i % 2 === 0) { // posiciones impares (0-based)
        val = val * 2;
        if (val > 9) val -= 9;
      }
      sum += val;
    }
    const check = (10 - (sum % 10)) % 10;
    return check === digits[9];
  }

  function isValidPhone(p){
    // acepta códigos +593 o 09... y formato con espacios/guiones
    if (!p) return false;
    const cleaned = p.replace(/[\s\-()]/g,'');

    return /^(\+593|0)?9\d{8}$/.test(cleaned);
  }

  function isValidURL(u){ try{ if(!u) return false; new URL(u); return true; }catch(e){return false} }

  function isStrongPassword(p){
    // mínimo 8 caracteres, al menos una letra, un número y una mayúscula
    return typeof p === 'string' && p.length >= 8 &&
      /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p);
  }

  /* Helpers UI */
  function showMsg(el, msg, type = 'error') {
    if (!el) return;
    el.textContent = msg;
    el.className = type === 'error' ? 'form-error' : 'form-success';
  }
  function clearFieldError(input) {
    if(!input) return;
    input.style.borderColor = '';
  }
  function markFieldError(input) {
    if(!input) return;
    input.style.borderColor = '#b00020';
  }
  function attachClearOnInput(form) {
    if (!form) return;
    form.querySelectorAll('input, select').forEach(i => {
      i.addEventListener('input', () => {
        const err = form.querySelector('.form-error');
        const ok = form.querySelector('.form-success');
        if (err) err.textContent = '';
        if (ok) ok.textContent = '';
        clearFieldError(i);
      });
    });
  }

  /* Registro con validaciones robustas */
  const regForm = document.getElementById('registerForm');
  if (regForm) {
    attachClearOnInput(regForm);
    regForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // campos
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

      // validaciones por campo con enfoque al primer error
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
      if (failed) {
        markFieldError(failed.el);
        failed.el?.focus();
        return showMsg(errEl, failed.msg);
      }

      // todo OK -> crear usuario en localStorage con estado pending para Egresado
      const status = (role || '').toLowerCase() === 'coordinador' ? 'approved' : 'pending';
      const users = getUsers();
      users.push({
        name, surname, cedula, telefono, carrera,
        anioGraduacion, fechaNacimiento, genero, linkedin, direccion,
        email, password, role, status, createdAt: new Date().toISOString()
      });
      saveUsers(users);

      if (status === 'pending') {
        showMsg(okEl, 'Registro enviado. Espera la aprobación del Coordinador.', 'success');
      } else {
        showMsg(okEl, 'Registro creado. Puedes iniciar sesión como Coordinador.', 'success');
      }
      setTimeout(() => { location.href = 'login.html'; }, 900);
    });
  }

  /* Login: mantener control de estado (sin cambios sustanciales) */
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
      showMsg(err, '')

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
      location.href = 'dashboard.html';
    });
  }

  /* Dashboard y acciones de Coordinador (mantener lógica existente) */
  const dashboard = document.getElementById('dashboard');
  if (dashboard) {
    const sess = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (!sess) {
      dashboard.innerHTML = `<h3>Acceso no autorizado</h3><p>Debe <a href="login.html">iniciar sesión</a>.</p>`;
      return;
    }
    const { name, role, email } = sess;
    const roleNorm = (role || '').toLowerCase();

    if (roleNorm === 'coordinador' || roleNorm === 'administrador') {
      dashboard.innerHTML = `
        <div>
          <h2>Panel - Coordinador</h2>
          <p>Hola <strong>${name}</strong> (<em>${email}</em>)</p>
          <section style="margin-top:12px">
            <h3>Registros pendientes</h3>
            <div id="pendingList"><p>Cargando...</p></div>
          </section>

          <section style="margin-top:14px">
            <h3>Usuarios aprobados</h3>
            <div id="approvedList"><p>Cargando...</p></div>
          </section>

          <div style="margin-top:14px">
            <button id="logout" class="btn btn-primary">Cerrar sesión</button>
          </div>
        </div>
      `;

      function renderLists(){
        const users = getUsers();
        const pending = users.filter(u => (u.status||'pending') === 'pending');
        const approved = users.filter(u => (u.status||'approved') === 'approved');

        const pendEl = document.getElementById('pendingList');
        const apprEl = document.getElementById('approvedList');

        if(pending.length === 0){
          pendEl.innerHTML = '<p>No hay registros pendientes.</p>';
        } else {
          pendEl.innerHTML = '<table style="width:100%;border-collapse:collapse"><thead><tr style="text-align:left;color:var(--muted)"><th>Nombre</th><th>Email</th><th>Cédula</th><th>Carrera</th><th>Año</th><th>Acciones</th></tr></thead><tbody>' +
            pending.map(u => `<tr>
              <td>${u.name} ${u.surname}</td>
              <td>${u.email}</td>
              <td>${u.cedula}</td>
              <td>${u.carrera}</td>
              <td>${u.anioGraduacion}</td>
              <td>
                <button class="btn btn-primary btn-approve" data-email="${u.email}">Aprobar</button>
                <button class="btn btn-outline btn-reject" data-email="${u.email}">Rechazar</button>
              </td>
            </tr>`).join('') + '</tbody></table>';
        }

        if(approved.length === 0){
          apprEl.innerHTML = '<p>No hay usuarios aprobados.</p>';
        } else {
          apprEl.innerHTML = '<ul style="padding-left:18px">' + approved.map(u=>`<li>${u.name} ${u.surname} — ${u.email} — <strong>${u.role}</strong></li>`).join('') + '</ul>';
        }

        document.querySelectorAll('.btn-approve').forEach(b=>{
          b.addEventListener('click', e=>{
            const em = b.getAttribute('data-email');
            updateUser(em, { status: 'approved' });
            renderLists();
          });
        });
        document.querySelectorAll('.btn-reject').forEach(b=>{
          b.addEventListener('click', e=>{
            const em = b.getAttribute('data-email');
            updateUser(em, { status: 'rejected' });
            renderLists();
          });
        });
      }

      renderLists();

    } else if (roleNorm === 'egresado') {
      const users = getUsers();
      const me = users.find(u => (u.email||'').toLowerCase() === (email||'').toLowerCase());
      const status = (me && me.status) ? me.status : 'approved';
      dashboard.innerHTML = `
        <div>
          <h2>Panel - Egresado</h2>
          <p>Hola <strong>${name}</strong> (<em>${email}</em>)</p>
          <p>Estado de registro: <strong>${status}</strong></p>
          <p>Si tu cuenta está en revisión, espera a que un Coordinador la apruebe.</p>
          <div style="margin-top:14px"><button id="logout" class="btn btn-primary">Cerrar sesión</button></div>
        </div>
      `;
    } else {
      dashboard.innerHTML = `<h2>Panel</h2><p>Hola ${name} (${email})</p><p>Rol: ${role}</p><div style="margin-top:14px"><button id="logout" class="btn btn-primary">Cerrar sesión</button></div>`;
    }

    document.getElementById('logout')?.addEventListener('click', () => {
      sessionStorage.removeItem(SESSION_KEY);
      location.href = 'index.html';
    });
  }

})();