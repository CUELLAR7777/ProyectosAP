// Archivo de script principal para la aplicación de seguimiento a graduados de la ULEAM

document.addEventListener('DOMContentLoaded', function() {
    // Aquí se pueden inicializar funciones o eventos al cargar la página
});

// Función para redirigir al usuario al dashboard después de iniciar sesión
function redirectToDashboard() {
    window.location.href = 'dashboard.html';
}

// Función para mostrar mensajes de error
function showError(message) {
    const errorContainer = document.getElementById('error-container');
    errorContainer.innerText = message;
    errorContainer.style.display = 'block';
}

// Función para ocultar mensajes de error
function hideError() {
    const errorContainer = document.getElementById('error-container');
    errorContainer.style.display = 'none';
}