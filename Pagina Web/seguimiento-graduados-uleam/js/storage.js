// Este archivo maneja el almacenamiento local del navegador, permitiendo guardar y recuperar información de los usuarios.

const storageKey = 'graduadosUleam';

// Función para guardar un usuario en el almacenamiento local
function saveUser(user) {
    let users = getUsers();
    users.push(user);
    localStorage.setItem(storageKey, JSON.stringify(users));
}

// Función para obtener todos los usuarios del almacenamiento local
function getUsers() {
    const users = localStorage.getItem(storageKey);
    return users ? JSON.parse(users) : [];
}

// Función para buscar un usuario por su correo electrónico
function findUserByEmail(email) {
    const users = getUsers();
    return users.find(user => user.email === email);
}

// Función para eliminar un usuario del almacenamiento local
function removeUser(email) {
    let users = getUsers();
    users = users.filter(user => user.email !== email);
    localStorage.setItem(storageKey, JSON.stringify(users));
}