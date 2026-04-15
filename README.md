# SafePlay 

Sistema de control y monitoreo web que permite gestionar dispositivos mediante un panel de administración en línea. El agente se instala desde la web como ejecutable y es controlado remotamente a través de un panel centralizado.

---

##  Tecnologías utilizadas

- **Runtime:** Node.js
- **Framework:** Express.js
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Gráficas:** Chart.js
- **Base de datos:** Configurada en `src/config/database.js`
- **Autenticación:** JWT / Middleware de sesión
- **Correo electrónico:** Nodemailer (servicio en `src/services/email.js`)

---

##  Estructura del proyecto

```
SafePlay_Web/
├── public/                  # Archivos estáticos del frontend
│   ├── css/                 # Hojas de estilo
│   │   ├── download.css
│   │   ├── index.css
│   │   ├── login.css
│   │   └── register.css
│   ├── descargable/         # Ejecutable instalable del agente
│   ├── images/              # Recursos gráficos (íconos, logos)
│   │   ├── icon.ico
│   │   ├── icon.png
│   │   ├── icon.webp
│   │   └── logo1.webp
│   ├── js/                  # Scripts del frontend
│   │   ├── auth.js
│   │   ├── chart.umd.min.js
│   │   ├── dashboard.js
│   │   ├── download.js
│   │   ├── main.js
│   │   └── modal-terms.js
│   └── templates/           # Páginas HTML
│       ├── dashboard.html
│       ├── download.html
│       ├── forgot-password.html
│       ├── index.html
│       ├── login.html
│       ├── register.html
│       └── reset-password.html
├── src/                     # Lógica del servidor (backend)
│   ├── config/
│   │   └── database.js      # Configuración de la base de datos
│   ├── middlewares/
│   │   ├── auth.js          # Middleware de autenticación
│   │   └── authMiddleware.js
│   ├── models/              # Modelos de datos
│   │   ├── activityLog.js
│   │   ├── command.js
│   │   ├── index.js
│   │   └── Supervisor.js
│   ├── routes/              # Rutas de la API
│   │   ├── auth.js
│   │   ├── electron.routes.js
│   │   └── me.js
│   └── services/
│       └── email.js         # Servicio de envío de correos
├── downloads/               # Archivos de descarga generados
├── logs/                    # Registros del sistema
├── app.js                   # Punto de entrada del servidor
├── package.json
├── .gitignore
└── .gitattributes
```

---

##  Instalación y ejecución

### Prerrequisitos

- [Node.js](https://nodejs.org/) v18 o superior
- npm v9 o superior

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/SafePlay_Web.git
   cd SafePlay_Web
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   Crear un archivo `.env` en la raíz con las siguientes variables:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=tu_usuario
   DB_PASS=tu_contraseña
   DB_NAME=safeplay
   JWT_SECRET=tu_clave_secreta
   EMAIL_USER=correo@ejemplo.com
   EMAIL_PASS=contraseña_correo
   ```

4. **Ejecutar el servidor**
   ```bash
   node app.js
   ```

5. Abrir en el navegador: `https://safeeplay.com/`

---

##  Uso del sistema

1. **Registro/Login:** Accede al panel desde `index.html` o `login.html`.
2. **Descarga del agente:** Desde la sección de descarga (`download.html`), obtén el ejecutable instalable para el dispositivo a monitorear.
3. **Panel de control:** Una vez instalado el agente, administra y monitorea los dispositivos desde `dashboard.html`.
4. **Recuperación de contraseña:** Disponible desde `forgot-password.html` y `reset-password.html` mediante correo electrónico.

---

##  Autores

- Juan Oicata
- Luis Vega
- Juan Rodrigues

---

##  Licencia

Este proyecto es de uso académico/privado. Todos los derechos reservados.
