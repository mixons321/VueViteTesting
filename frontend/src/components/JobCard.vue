<script setup>
import { computed } from 'vue'

const props = defineProps({
  job: {
    type: Object,
    required: true,
  },
})

const rawJson = computed(() => {
  try {
    return JSON.stringify(props.job.raw ?? props.job, null, 2)
  } catch (error) {
    console.warn('No se pudo formatear el JSON de la oferta:', error)
    return String(props.job.raw ?? '')
  }
})
</script>

<template>
  <article class="job-card">
    <header class="job-card__header">
      <div>
        <p v-if="job.company" class="job-card__company">{{ job.company }}</p>
        <h2 class="job-card__title">{{ job.title }}</h2>
      </div>
      <p v-if="job.location" class="job-card__location" aria-label="Ubicación">
        <span aria-hidden="true">📍</span>
        <span>{{ job.location }}</span>
      </p>
    </header>

    <p v-if="job.description" class="job-card__description">{{ job.description }}</p>

    <footer class="job-card__footer">
      <details class="job-card__details">
        <summary>Ver respuesta completa de la API</summary>
        <pre>{{ rawJson }}</pre>
      </details>
    </footer>
  </article>
</template>

<style scoped>
.job-card {
  border: 1px solid var(--surface-border);
  border-radius: 1rem;
  padding: 1.5rem;
  background: var(--surface-elevated);
  box-shadow: 0 18px 40px -28px rgba(13, 95, 112, 0.45);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.job-card:hover,
.job-card:focus-within {
  transform: translateY(-2px);
  box-shadow: 0 22px 46px -26px rgba(13, 95, 112, 0.55);
}

.job-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.job-card__company {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.95rem;
  font-weight: 600;
}

.job-card__title {
  margin: 0.2rem 0 0;
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.35;
}

.job-card__location {
  margin: 0;
  color: var(--text-muted);
  display: flex;
  gap: 0.4rem;
  align-items: center;
  font-size: 0.95rem;
}

.job-card__description {
  margin: 0;
  line-height: 1.55;
}

.job-card__details {
  margin: 0;
}

.job-card__details summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--accent-primary);
}

.job-card__details pre {
  background: var(--surface-sunken);
  border-radius: 0.75rem;
  padding: 1rem;
  overflow-x: auto;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  line-height: 1.45;
}
</style>
