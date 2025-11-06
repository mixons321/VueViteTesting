# Explorador de empleos con Vue + Vite + FastAPI

Este proyecto es un ejemplo completo de cómo consumir una API pública construida con
[FastAPI](https://fastapi.tiangolo.com/) desde una aplicación frontend creada con Vue 3 y Vite.
La interfaz consulta un listado de ofertas de trabajo, permite filtrar los resultados, cambiar el
endpoint consumido en tiempo real y utilizar datos locales de respaldo cuando la API no está
disponible.

## Características principales

- **Selección dinámica del endpoint**: modifica la URL del servicio FastAPI directamente desde la
  interfaz.
- **Búsqueda instantánea**: filtra las oportunidades por título, empresa o ubicación.
- **Datos de respaldo locales**: si la API falla o tarda demasiado, la app muestra automáticamente
  un conjunto curado de empleos de ejemplo.
- **Detalles de la respuesta original**: cada tarjeta permite inspeccionar el JSON completo devuelto
  por la API.

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

## Puesta en marcha

Desde la raíz del repositorio, entra primero a la carpeta `frontend` para ejecutar los comandos:

```bash
cd frontend
npm install
npm run dev
```

> 💡 En Windows PowerShell también necesitas posicionarte en la carpeta `frontend` antes de correr
> `npm install`. Por ejemplo: `cd .\frontend`.

El servidor de desarrollo quedará disponible en `http://localhost:5173`. La aplicación ejecuta una
solicitud HTTP a la API configurada en la variable `VITE_FASTAPI_URL` y, en caso de no encontrarla,
utiliza [`https://fastapi-course.onrender.com/api/v1/jobs`](https://fastapi-course.onrender.com/api/v1/jobs)
como valor por defecto.

Si quieres apuntar a otra API de forma persistente, crea un archivo `.env` en la carpeta `frontend`
con el siguiente contenido:

```bash
VITE_FASTAPI_URL="https://tu-api-fastapi.com/ruta"
```

También puedes cambiarla en caliente desde la interfaz: edita la URL en la parte superior y pulsa
«Consultar API» para refrescar los datos.

## Estructura relevante

- `src/services/jobsApi.js`: contiene la lógica de consulta (con timeout configurable) y los datos de
  respaldo locales.
- `src/components/JobCard.vue`: tarjeta reutilizable que muestra la oferta normalizada y el JSON
  original.
- `src/components/StateMessage.vue`: componente genérico para mensajes de carga, error y estados
  vacíos.
- `src/App.vue`: orquesta la carga de datos, los filtros y los controles para interactuar con la API.
- `src/style.css`: define variables de color y estilos base compartidos por toda la aplicación.

## Notas

- El proyecto utiliza `fetch` nativo del navegador; no es necesario instalar librerías adicionales.
- La estructura del JSON puede variar entre APIs públicas. La normalización incluida intenta manejar
  respuestas comunes (`jobs`, `results`, `data`, `items`, `objects`). Puedes ajustar la función en
  `jobsApi.js` según las necesidades de tu servicio.
- Si la API requiere encabezados o autenticación, añade la lógica correspondiente en
  `jobsApi.js`.
