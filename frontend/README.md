# Calculadora de bonos (Frontend)

Esta aplicación en Vue 3 + Vite consume un servicio local de FastAPI para estimar el bono de un
colaborador. Permite ajustar los parámetros en tiempo real, visualizar el desglose del cálculo y
descargar un reporte en PDF.

## Características principales

- **Formulario reactivo**: cualquier cambio en los campos recalcula el bono contra la API sin recargar
  la página.
- **Desglose detallado**: muestra cómo se compone el bono (base, desempeño, antigüedad, apoyo familiar y
  extras).
- **Exportación a PDF**: genera un documento con los datos capturados, el resultado y las
  recomendaciones enviadas por el backend.
- **Endpoint configurable**: permite apuntar a otra instancia de FastAPI simplemente editando la URL en
  la interfaz o mediante variables de entorno.

## Requisitos

- Node.js 18 o superior
- npm 9 o superior
- Un servidor FastAPI en ejecución (consulta las instrucciones de [`../backend`](../backend)).

## Puesta en marcha

1. Instala las dependencias y levanta el servidor de desarrollo:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. Asegúrate de tener el backend activo en `http://127.0.0.1:8000` (o actualiza la URL desde la
   propia interfaz).

La aplicación queda disponible en `http://localhost:5173`. Por defecto consulta el endpoint definido en
la variable `VITE_FASTAPI_URL` y, si no está presente, utilizará `http://127.0.0.1:8000/api/bonus`.

Para cambiar la URL de forma persistente, crea un archivo `.env` dentro de `frontend` con el contenido:

```bash
VITE_FASTAPI_URL="https://mi-servidor-fastapi.com/api/bonus"
```

## Estructura relevante

- `src/App.vue`: formulario, lógica de cálculo y generación de PDF.
- `src/services/bonusApi.js`: encapsula la llamada HTTP al endpoint de FastAPI.
- `src/style.css`: estilos base y variables de color compartidas por toda la app.

## Notas

- El PDF se genera utilizando la librería [`jspdf`](https://github.com/parallax/jsPDF).
- Si tu API requiere autenticación o encabezados adicionales, añade la lógica en
  `src/services/bonusApi.js`.
