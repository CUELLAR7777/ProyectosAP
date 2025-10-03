

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('client-form');
    
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;

        if (validateForm(name, email, phone)) {
            // Aquí puedes almacenar los datos en localStorage o enviarlos a un servidor
            console.log('Datos del cliente:', { name, email, phone });
            alert('Datos enviados correctamente');
            form.reset();
        } else {
            alert('Por favor, completa todos los campos correctamente.');
        }
    });

    function validateForm(name, email, phone) {
        return name !== '' && validateEmail(email) && phone !== '';
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }
});