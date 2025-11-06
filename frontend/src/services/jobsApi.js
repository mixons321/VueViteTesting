export const DEFAULT_API_URL = 'https://fastapi-course.onrender.com/api/v1/jobs'

const FALLBACK_JOBS = [
  {
    id: 'remote-python-mentor',
    title: 'Mentor/a Python (100% remoto)',
    company: 'Academia TechLatam',
    location: 'Remoto - LatAm',
    description:
      'Acompaña a estudiantes de Python en sesiones 1:1, planifica actividades y comparte mejores prácticas del ecosistema FastAPI.',
  },
  {
    id: 'fastapi-data-engineer',
    title: 'Data Engineer con FastAPI',
    company: 'DataPipelines.io',
    location: 'Medellín, Colombia (híbrido)',
    description:
      'Construye APIs con FastAPI para exponer pipelines de datos, optimiza consultas SQL y automatiza despliegues con Docker y GitHub Actions.',
  },
  {
    id: 'junior-backend-fastapi',
    title: 'Backend Junior FastAPI',
    company: 'Startup Salud Digital',
    location: 'CDMX, México (presencial)',
    description:
      'Desarrolla microservicios REST con FastAPI y PostgreSQL, integra pruebas automatizadas y colabora con el equipo de producto.',
  },
]

function normaliseArray(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload

  const candidateKeys = ['jobs', 'results', 'data', 'items', 'objects']
  for (const key of candidateKeys) {
    const value = payload?.[key]
    if (Array.isArray(value)) {
      return value
    }
  }

  return []
}

function mapJob(job, index) {
  if (!job || typeof job !== 'object') {
    const fallbackDescription =
      typeof job === 'string' ? job : JSON.stringify(job ?? 'Resultado sin datos', null, 2)

    return {
      id: `unknown-${index}`,
      title: 'Oferta sin título',
      company: '',
      location: '',
      description: fallbackDescription,
      raw: job,
    }
  }

  const title =
    job.title ||
    job.position ||
    job.name ||
    job.job_title ||
    job.role ||
    `Oportunidad #${job.id ?? index + 1}`

  const company =
    job.company ||
    job.employer ||
    job.organization ||
    job.organisation ||
    job.business ||
    job.owner?.name ||
    ''

  const location =
    job.location ||
    job.city ||
    job.country ||
    (Array.isArray(job.locations) ? job.locations.join(', ') : '') ||
    job.address?.city ||
    job.office ||
    ''

  const description =
    job.description ||
    job.summary ||
    job.details ||
    job.content ||
    job.body ||
    job.requirements ||
    ''

  return {
    id: job.id ?? index,
    title,
    company,
    location,
    description,
    raw: job,
  }
}

function createAbortController(timeoutMs = 10000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  return {
    controller,
    dispose: () => clearTimeout(timeoutId),
  }
}

export async function fetchJobs(requestedUrl, { timeoutMs = 10000 } = {}) {
  const url = (requestedUrl && requestedUrl.trim()) || import.meta.env.VITE_FASTAPI_URL || DEFAULT_API_URL
  const { controller, dispose } = createAbortController(timeoutMs)

  try {
    const response = await fetch(url, { signal: controller.signal })

    if (!response.ok) {
      throw new Error(`La API respondió con un estado ${response.status}`)
    }

    const payload = await response.json()
    const jobs = normaliseArray(payload).map(mapJob)

    return { jobs, meta: { source: 'api', url } }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado en responder. Intenta nuevamente.')
    }

    if (error instanceof Error) {
      throw error
    }

    throw new Error('Ocurrió un error inesperado al consultar la API.')
  } finally {
    dispose()
  }
}

export function getFallbackJobs() {
  return {
    jobs: FALLBACK_JOBS.map(mapJob),
    meta: { source: 'fallback', url: 'datos locales' },
  }
}
