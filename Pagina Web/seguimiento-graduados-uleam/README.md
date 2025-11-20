# Seguimiento Graduados ULEAM

Este proyecto es una aplicación web diseñada para el seguimiento de graduados de la Universidad Laica Eloy Alfaro de Manabí (ULEAM). La aplicación permite a los graduados registrarse, iniciar sesión y acceder a un panel de control donde pueden ver información relevante.

## Estructura del Proyecto

El proyecto está organizado de la siguiente manera:

```
seguimiento-graduados-uleam
├── public
│   ├── index.html          # Página principal de la aplicación
│   ├── login.html          # Página de inicio de sesión
│   ├── register.html       # Página de registro de nuevos usuarios
│   ├── dashboard.html      # Página del panel de control
│   └── components
│       ├── header.html     # Encabezado de la aplicación
│       └── footer.html     # Pie de página de la aplicación
├── css
│   ├── variables.css       # Variables de estilo
│   ├── main.css            # Estilos principales
│   └── auth.css            # Estilos para páginas de autenticación
├── js
│   ├── app.js              # Script principal de la aplicación
│   ├── auth.js             # Funciones de autenticación
│   ├── validators.js       # Funciones de validación de formularios
│   └── storage.js          # Manejo de almacenamiento local
├── .gitignore              # Archivos y carpetas a ignorar por Git
└── README.md               # Documentación del proyecto
```

## Instalación

1. Clona el repositorio en tu máquina local.
2. Abre el archivo `index.html` en un navegador web para ver la aplicación en acción.

## Uso

- **Registro**: Los nuevos usuarios pueden registrarse en la página `register.html`.
- **Inicio de Sesión**: Los usuarios existentes pueden iniciar sesión en `login.html`.
- **Panel de Control**: Después de iniciar sesión, los usuarios serán redirigidos a `dashboard.html`, donde podrán ver información relevante.

## Contribuciones

Las contribuciones son bienvenidas. Si deseas contribuir, por favor abre un issue o envía un pull request.

## Licencia

Este proyecto está bajo la Licencia MIT.