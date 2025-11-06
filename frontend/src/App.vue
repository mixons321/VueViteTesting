<script setup>
import { computed, onMounted, ref } from 'vue'

import JobCard from './components/JobCard.vue'
import StateMessage from './components/StateMessage.vue'
import { DEFAULT_API_URL, fetchJobs, getFallbackJobs } from './services/jobsApi'

const jobs = ref([])
const apiUrl = ref(import.meta.env.VITE_FASTAPI_URL || DEFAULT_API_URL)
const isLoading = ref(false)
const errorMessage = ref('')
const dataSource = ref({ source: 'api', url: apiUrl.value })
const lastUpdatedAt = ref('')
const searchTerm = ref('')

const totalJobs = computed(() => jobs.value.length)

const filteredJobs = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) {
    return jobs.value
  }

  return jobs.value.filter((job) => {
    const haystack = [job.title, job.company, job.location, job.description]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(term)
  })
})

const formattedUpdatedAt = computed(() => {
  if (!lastUpdatedAt.value) return ''

  try {
    const formatter = new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    return formatter.format(new Date(lastUpdatedAt.value))
  } catch (error) {
    console.warn('No fue posible formatear la fecha de actualización', error)
    return ''
  }
})

const sourceLabel = computed(() => {
  if (dataSource.value.source === 'fallback') {
    return 'Datos de ejemplo locales'
  }

  return dataSource.value.url || 'API configurada'
})

async function loadJobs({ useFallback = false } = {}) {
  if (useFallback) {
    const fallback = getFallbackJobs()
    jobs.value = fallback.jobs
    dataSource.value = fallback.meta
    errorMessage.value = ''
    lastUpdatedAt.value = new Date().toISOString()
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await fetchJobs(apiUrl.value)
    jobs.value = response.jobs
    dataSource.value = response.meta
    lastUpdatedAt.value = new Date().toISOString()
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'No fue posible comunicarse con la API pública de FastAPI.'

    const fallback = getFallbackJobs()
    jobs.value = fallback.jobs
    dataSource.value = fallback.meta
    lastUpdatedAt.value = new Date().toISOString()
  } finally {
    isLoading.value = false
  }
}

function handleSubmit(event) {
  event.preventDefault()
  loadJobs()
}

function resetAndReload() {
  apiUrl.value = DEFAULT_API_URL
  loadJobs()
}

onMounted(() => {
  loadJobs()
})
</script>

<template>
  <main class="page">
    <header class="page__header">
      <h1 class="page__title">Explorador de empleos con FastAPI</h1>
      <p class="page__description">
        Esta aplicación construida con Vue 3 + Vite consulta un endpoint público de FastAPI para
        mostrar oportunidades laborales. Puedes cambiar la URL del servicio, filtrar resultados y
        utilizar datos locales de ejemplo en caso de que la API no esté disponible.
      </p>
    </header>

    <form class="controls" @submit="handleSubmit">
      <label class="controls__label" for="api-url">Endpoint de la API</label>
      <div class="controls__row">
        <input
          id="api-url"
          v-model="apiUrl"
          class="controls__input"
          type="url"
          inputmode="url"
          autocomplete="off"
          placeholder="https://tu-api-fastapi.com/api/v1/jobs"
          aria-describedby="api-help"
        />
        <button class="controls__button controls__button--primary" type="submit">
          Consultar API
        </button>
        <button
          class="controls__button"
          type="button"
          @click="loadJobs({ useFallback: true })"
        >
          Usar datos de ejemplo
        </button>
      </div>
      <p id="api-help" class="controls__help">
        Por defecto se utiliza <code>{{ DEFAULT_API_URL }}</code>. Puedes restablecerlo rápidamente.
        <button class="controls__link" type="button" @click="resetAndReload">Restablecer</button>
      </p>
    </form>

    <section class="toolbar" aria-label="Herramientas de filtrado">
      <label class="toolbar__label" for="search">Buscar</label>
      <input
        id="search"
        v-model="searchTerm"
        class="toolbar__search"
        type="search"
        placeholder="Filtra por título, empresa o ubicación"
      />
      <div class="toolbar__meta">
        <span><strong>{{ filteredJobs.length }}</strong> de {{ totalJobs }} resultados</span>
        <span><strong>Fuente:</strong> {{ sourceLabel }}</span>
        <span v-if="formattedUpdatedAt"><strong>Actualizado:</strong> {{ formattedUpdatedAt }}</span>
      </div>
    </section>

    <StateMessage
      v-if="isLoading"
      title="Consultando la API…"
      description="Obteniendo la información de empleos desde FastAPI."
    >
      <span class="loader" aria-hidden="true"></span>
    </StateMessage>

    <template v-else>
      <StateMessage
        v-if="errorMessage"
        variant="error"
        title="No pudimos obtener datos frescos de la API"
        :description="errorMessage"
      >
        <div class="state-actions" role="group">
          <button class="controls__button controls__button--primary" type="button" @click="loadJobs()">
            Reintentar
          </button>
          <button class="controls__button" type="button" @click="loadJobs({ useFallback: true })">
            Mostrar datos de ejemplo
          </button>
        </div>
      </StateMessage>

      <StateMessage
        v-if="!errorMessage && filteredJobs.length === 0"
        variant="empty"
        title="Sin resultados que coincidan con tu búsqueda"
        description="Prueba con otros términos o restablece el filtro."
      >
        <button class="controls__button" type="button" @click="searchTerm = ''">
          Limpiar filtro
        </button>
      </StateMessage>

      <section v-if="filteredJobs.length > 0" class="results" aria-live="polite">
        <JobCard v-for="job in filteredJobs" :key="job.id" :job="job" />
      </section>
    </template>
  </main>
</template>

<style scoped>
.page {
  margin: 0 auto;
  max-width: 1080px;
  padding: 3rem 1.5rem 4rem;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--text-primary);
}

.page__header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.page__title {
  margin: 0;
  font-size: clamp(1.9rem, 2.8vw, 2.8rem);
  font-weight: 800;
  color: var(--accent-primary);
}

.page__description {
  margin: 0;
  line-height: 1.7;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  border-radius: 1.25rem;
  background: var(--surface-elevated);
  border: 1px solid var(--surface-border);
}

.controls__label {
  font-weight: 600;
}

.controls__row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.controls__input {
  border-radius: 0.75rem;
  border: 1px solid var(--surface-border);
  padding: 0.75rem 1rem;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.controls__input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 4px rgba(11, 114, 133, 0.15);
}

.controls__button {
  align-self: flex-start;
  background: transparent;
  border: 1px solid var(--surface-border);
  border-radius: 999px;
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 600;
  padding: 0.6rem 1.4rem;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.controls__button:hover,
.controls__button:focus-visible {
  transform: translateY(-1px);
  border-color: var(--accent-primary);
}

.controls__button--primary {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
}

.controls__button--primary:hover,
.controls__button--primary:focus-visible {
  background: var(--accent-primary-dark);
  border-color: var(--accent-primary-dark);
}

.controls__help {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.controls__link {
  border: none;
  background: none;
  color: var(--accent-primary);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.75rem;
}

.toolbar__label {
  font-weight: 600;
}

.toolbar__search {
  border-radius: 999px;
  border: 1px solid var(--surface-border);
  padding: 0.65rem 1.25rem;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.toolbar__search:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 4px rgba(11, 114, 133, 0.15);
}

.toolbar__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.95rem;
  color: var(--text-muted);
}

.results {
  display: grid;
  gap: 1.5rem;
}

.state-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.loader {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  border: 4px solid rgba(11, 114, 133, 0.2);
  border-top-color: var(--accent-primary);
  animation: spin 1s linear infinite;
}

@media (min-width: 640px) {
  .controls__row {
    flex-direction: row;
    align-items: center;
  }

  .controls__row > *:first-child {
    flex: 1;
  }

  .controls__button {
    align-self: center;
  }

  .state-actions {
    flex-direction: row;
  }
}

@media (min-width: 720px) {
  .results {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
