# Servidor FastAPI de ejemplo

El directorio contiene un servicio FastAPI minimalista que expone el endpoint `/api/bonus` utilizado por
la interfaz construida en Vue. El cálculo aplica una fórmula simple para mostrar cómo estructurar el
flujo completo frontend ➜ backend.

## Requisitos

- Python 3.10 o superior
- Pipenv o `pip`

## Puesta en marcha rápida

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # En Windows usa `.venv\\Scripts\\activate`
pip install -r requirements.txt
uvicorn main:app --reload
```

El servicio quedará disponible en `http://127.0.0.1:8000`. La aplicación frontend apunta por defecto a
`http://127.0.0.1:8000/api/bonus` y puede comenzar a consumirlo inmediatamente.

## Endpoint disponible

- `POST /api/bonus`: recibe un cuerpo JSON con el salario base, calificación de desempeño, años en la
  empresa, número de dependientes y bonos adicionales. Responde con el total estimado, el desglose de
  cada componente y recomendaciones generadas dinámicamente.

También se incluye un `GET /` básico para verificar el estado del servicio.
