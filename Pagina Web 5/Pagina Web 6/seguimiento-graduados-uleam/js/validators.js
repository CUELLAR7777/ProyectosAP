function validateLoginForm() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    let valid = true;

    // Clear previous error messages
    clearErrors();

    if (!validateEmail(email)) {
        showError('login-email', 'Por favor, ingrese un correo electrónico válido.');
        valid = false;
    }

    if (password.length < 6) {
        showError('login-password', 'La contraseña debe tener al menos 6 caracteres.');
        valid = false;
    }

    return valid;
}

function validateRegisterForm() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    let valid = true;

    // Clear previous error messages
    clearErrors();

    if (name.trim() === '') {
        showError('register-name', 'El nombre es obligatorio.');
        valid = false;
    }

    // Cambiado: ahora exige @gmail.com al crear la cuenta
    if (!email.endsWith('@gmail.com')) {
        showError('register-email', 'Debe usar correo @gmail.com.');
        valid = false;
    }

    if (password.length < 6) {
        showError('register-password', 'La contraseña debe tener al menos 6 caracteres.');
        valid = false;
    }

    if (password !== confirmPassword) {
        showError('register-confirm-password', 'Las contraseñas no coinciden.');
        valid = false;
    }

    return valid;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

function showError(inputId, message) {
    const input = document.getElementById(inputId);
    const error = document.createElement('div');
    error.className = 'error-message';
    error.innerText = message;
    input.parentNode.insertBefore(error, input.nextSibling);
}

function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.remove());
}

const validations = {
    cedula: (value) => {
        if (!/^\d{10}$/.test(value)) return false;
        const provincia = parseInt(value.substring(0,2));
        if (provincia < 1 || provincia > 24) return false;
        
        let suma = 0;
        const coeficientes = [2,1,2,1,2,1,2,1,2];
        const verificador = parseInt(value.charAt(9));
        
        for (let i = 0; i < 9; i++) {
            let producto = parseInt(value.charAt(i)) * coeficientes[i];
            if (producto >= 10) producto -= 9;
            suma += producto;
        }
        
        const digitoVerificador = (suma % 10 === 0) ? 0 : 10 - (suma % 10);
        return digitoVerificador === verificador;
    },
    
    // Cambiado: validación específica para @gmail.com
    email: (value) => {
        return /^[a-zA-Z0-9._-]+@gmail\.com$/.test(value);
    },
    
    telefono: (value) => {
        return /^(\+593|0)9\d{8}$/.test(value.replace(/\s/g, ''));
    },
    
    password: (value) => {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(value);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    // Función para mostrar error
    function showError(inputId, message) {
        const input = document.getElementById(inputId);
        const error = document.getElementById(inputId + 'Error');
        if (input) input.classList.add('input-error');
        if (error) error.textContent = message;
    }

    // Función para limpiar error
    function clearError(inputId) {
        const input = document.getElementById(inputId);
        const error = document.getElementById(inputId + 'Error');
        if (input) input.classList.remove('input-error');
        if (error) error.textContent = '';
    }

    // Validaciones en tiempo real
    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            clearError(input.id);
        });
    });

    // Validación al enviar
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        let isValid = true;

        // Validar cédula
        const cedula = document.getElementById('cedula').value;
        if (!/^\d{10}$/.test(cedula)) {
            showError('cedula', 'Cédula debe tener 10 dígitos');
            isValid = false;
        }

        // Cambiado: ahora exige @gmail.com
        const email = document.getElementById('email').value;
        if (!email.endsWith('@gmail.com')) {
            showError('email', 'Debe usar correo @gmail.com');
            isValid = false;
        }

        // Validar contraseña
        const password = document.getElementById('password').value;
        if (password.length < 8) {
            showError('password', 'Mínimo 8 caracteres');
            isValid = false;
        }

        // Validar confirmación
        const confirm = document.getElementById('confirmPassword').value;
        if (password !== confirm) {
            showError('confirmPassword', 'Las contraseñas no coinciden');
            isValid = false;
        }

        // Si hay errores, detener envío
        if (!isValid) {
            const firstError = form.querySelector('.input-error');
            if (firstError) firstError.focus();
            return;
        }

        // Si todo está bien, continuar con el registro
        console.log('Formulario válido, enviando...');
        // Aquí iría tu lógica de registro
    });
});