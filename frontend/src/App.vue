<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { jsPDF } from 'jspdf'

import { DEFAULT_API_URL, calculateBonus } from './services/bonusApi'

const apiUrl = ref(import.meta.env.VITE_FASTAPI_URL || DEFAULT_API_URL)
const isLoading = ref(false)
const errorMessage = ref('')
const lastUpdatedAt = ref('')
const bonusResult = ref(null)

const form = reactive({
  baseSalary: 2500,
  performanceRating: 3.5,
  yearsAtCompany: 2,
  dependents: 0,
  extraAwards: 0,
})

const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 2,
})

const isFormValid = computed(() => {
  return (
    form.baseSalary > 0 &&
    form.performanceRating >= 0 &&
    form.performanceRating <= 5 &&
    form.yearsAtCompany >= 0 &&
    form.dependents >= 0 &&
    Number.isInteger(form.dependents) &&
    form.extraAwards >= 0
  )
})

const formErrors = computed(() => {
  const errors = []
  if (form.baseSalary <= 0) {
    errors.push('El salario base debe ser mayor a 0 USD.')
  }
  if (form.performanceRating < 0 || form.performanceRating > 5) {
    errors.push('La calificación de desempeño debe estar entre 0 y 5.')
  }
  if (form.yearsAtCompany < 0) {
    errors.push('Los años en la empresa no pueden ser negativos.')
  }
  if (form.dependents < 0) {
    errors.push('Los dependientes no pueden ser negativos.')
  }
  if (!Number.isInteger(form.dependents)) {
    errors.push('Los dependientes deben ser un número entero.')
  }
  if (form.extraAwards < 0) {
    errors.push('Las bonificaciones adicionales no pueden ser negativas.')
  }

  return errors
})

const formattedBreakdown = computed(() => {
  if (!bonusResult.value) return []

  const breakdown = bonusResult.value.breakdown

  return [
    { label: 'Bono base (10% del salario)', value: formatCurrency(breakdown.base_bonus) },
    {
      label: 'Ajuste por desempeño',
      value: formatCurrency(breakdown.performance_adjustment),
    },
    { label: 'Reconocimiento por antigüedad', value: formatCurrency(breakdown.loyalty_bonus) },
    {
      label: 'Apoyo familiar',
      value: formatCurrency(breakdown.family_support),
    },
    { label: 'Bonificaciones adicionales', value: formatCurrency(breakdown.extra_awards) },
  ]
})

function formatCurrency(amount) {
  return currencyFormatter.format(Number(amount) || 0)
}

function formatNumber(amount) {
  return numberFormatter.format(Number(amount) || 0)
}

function formatDate(value) {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch (error) {
    console.warn('No fue posible formatear la fecha', error)
    return ''
  }
}

async function requestBonus() {
  if (!isFormValid.value) {
    bonusResult.value = null
    errorMessage.value = 'Completa los datos correctamente antes de calcular.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const payload = {
      base_salary: Number(form.baseSalary),
      performance_rating: Number(form.performanceRating),
      years_at_company: Number(form.yearsAtCompany),
      dependents: Number(form.dependents),
      extra_awards: Number(form.extraAwards),
    }

    const response = await calculateBonus(apiUrl.value, payload)
    bonusResult.value = response
    lastUpdatedAt.value = response.calculatedAt
  } catch (error) {
    bonusResult.value = null
    errorMessage.value = error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    isLoading.value = false
  }
}

function handleSubmit(event) {
  event.preventDefault()
  requestBonus()
}

function downloadPdf() {
  if (!bonusResult.value) return

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const marginX = 56
  let cursorY = 72

  doc.setFontSize(20)
  doc.text('Resumen de cálculo de bono', marginX, cursorY)

  cursorY += 28
  doc.setFontSize(12)
  doc.setTextColor('#4a5568')
  doc.text(`Generado: ${formatDate(bonusResult.value.calculatedAt)}`, marginX, cursorY)

  cursorY += 32
  doc.setFontSize(14)
  doc.setTextColor('#1f2933')
  doc.text('Datos ingresados', marginX, cursorY)

  const inputRows = [
    [`Salario base`, formatCurrency(bonusResult.value.inputs.base_salary)],
    ['Desempeño', formatNumber(bonusResult.value.inputs.performance_rating)],
    ['Años en la empresa', formatNumber(bonusResult.value.inputs.years_at_company)],
    ['Dependientes', String(bonusResult.value.inputs.dependents)],
    ['Bonos adicionales', formatCurrency(bonusResult.value.inputs.extra_awards)],
  ]

  cursorY += 16
  doc.setFontSize(12)
  inputRows.forEach(([label, value]) => {
    doc.text(`${label}: ${value}`, marginX, cursorY)
    cursorY += 18
  })

  cursorY += 10
  doc.setFontSize(14)
  doc.text('Desglose', marginX, cursorY)

  cursorY += 20
  doc.setFontSize(12)
  formattedBreakdown.value.forEach((item) => {
    doc.text(`${item.label}: ${item.value}`, marginX, cursorY)
    cursorY += 18
  })

  cursorY += 14
  doc.setFontSize(16)
  doc.setTextColor('#0b7285')
  doc.text(`Total estimado: ${formatCurrency(bonusResult.value.totalBonus)}`, marginX, cursorY)

  if (bonusResult.value.recommendations?.length) {
    cursorY += 32
    doc.setFontSize(14)
    doc.setTextColor('#1f2933')
    doc.text('Recomendaciones', marginX, cursorY)

    cursorY += 20
    doc.setFontSize(12)
    doc.setTextColor('#4a5568')
    bonusResult.value.recommendations.forEach((message) => {
      const split = doc.splitTextToSize(`• ${message}`, 482)
      doc.text(split, marginX, cursorY)
      cursorY += split.length * 16
    })
  }

  doc.save('resumen-bono.pdf')
}

let debounceHandle
watch(
  () => ({
    baseSalary: form.baseSalary,
    performanceRating: form.performanceRating,
    yearsAtCompany: form.yearsAtCompany,
    dependents: form.dependents,
    extraAwards: form.extraAwards,
    apiUrl: apiUrl.value,
  }),
  (current) => {
    clearTimeout(debounceHandle)

    if (!isFormValid.value) {
      bonusResult.value = null
      return
    }

    debounceHandle = setTimeout(() => {
      if (current.apiUrl === apiUrl.value) {
        requestBonus()
      }
    }, 350)
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <main class="page">
    <header class="page__header">
      <h1 class="page__title">Calculadora de bonos con FastAPI</h1>
      <p class="page__description">
        Ingresa los datos del colaborador para estimar un bono usando un servicio FastAPI local. La calculadora se
        actualiza en tiempo real y puedes exportar un reporte en PDF.
      </p>
    </header>

    <section class="layout">
      <form class="card" @submit="handleSubmit">
        <h2 class="card__title">Datos del colaborador</h2>

        <div class="field">
          <label class="field__label" for="base-salary">Salario base mensual (USD)</label>
          <input
            id="base-salary"
            v-model.number="form.baseSalary"
            type="number"
            min="0"
            step="100"
            class="field__input"
            placeholder="Ej: 2500"
            required
          />
        </div>

        <div class="field">
          <label class="field__label" for="performance">Calificación de desempeño (0 a 5)</label>
          <input
            id="performance"
            v-model.number="form.performanceRating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            class="field__input"
            placeholder="Ej: 3.5"
            required
          />
        </div>

        <div class="field">
          <label class="field__label" for="years">Años en la empresa</label>
          <input
            id="years"
            v-model.number="form.yearsAtCompany"
            type="number"
            min="0"
            step="0.5"
            class="field__input"
            placeholder="Ej: 2"
            required
          />
        </div>

        <div class="field">
          <label class="field__label" for="dependents">Dependientes</label>
          <input
            id="dependents"
            v-model.number="form.dependents"
            type="number"
            min="0"
            step="1"
            class="field__input"
            placeholder="Ej: 1"
            required
          />
        </div>

        <div class="field">
          <label class="field__label" for="extra-awards">Bonos adicionales aprobados (USD)</label>
          <input
            id="extra-awards"
            v-model.number="form.extraAwards"
            type="number"
            min="0"
            step="50"
            class="field__input"
            placeholder="Ej: 300"
          />
        </div>

        <div class="divider" role="presentation"></div>

        <div class="field">
          <label class="field__label" for="api-url">Endpoint de la API</label>
          <input
            id="api-url"
            v-model="apiUrl"
            type="url"
            class="field__input"
            placeholder="http://127.0.0.1:8000/api/bonus"
            required
          />
          <p class="field__help">Puedes modificar la URL si decides desplegar el servicio en otra dirección.</p>
        </div>

        <div v-if="formErrors.length" class="form-errors" role="alert">
          <p>Revisa los siguientes puntos antes de continuar:</p>
          <ul>
            <li v-for="error in formErrors" :key="error">{{ error }}</li>
          </ul>
        </div>

        <div class="actions">
          <button class="button button--primary" type="submit" :disabled="isLoading">
            {{ isLoading ? 'Calculando…' : 'Calcular bono' }}
          </button>
          <button class="button" type="button" :disabled="!bonusResult" @click="downloadPdf">
            Descargar PDF
          </button>
        </div>
      </form>

      <section class="card card--highlight" aria-live="polite">
        <h2 class="card__title">Resumen</h2>

        <p class="status" v-if="errorMessage">
          <span class="status__indicator status__indicator--error" aria-hidden="true"></span>
          {{ errorMessage }}
        </p>

        <div v-else-if="isLoading" class="status">
          <span class="spinner" aria-hidden="true"></span>
          Calculando bono con la API…
        </div>

        <template v-else-if="bonusResult">
          <p class="summary__total">
            Bono estimado:
            <strong>{{ formatCurrency(bonusResult.totalBonus) }}</strong>
          </p>

          <ul class="summary__list">
            <li v-for="item in formattedBreakdown" :key="item.label">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </li>
          </ul>

          <div class="summary__meta">
            <p>
              Última actualización:
              <strong>{{ formatDate(lastUpdatedAt) || '—' }}</strong>
            </p>
            <p>
              API consultada:
              <strong>{{ apiUrl }}</strong>
            </p>
          </div>

          <div v-if="bonusResult.recommendations?.length" class="summary__recommendations">
            <h3>Recomendaciones</h3>
            <ul>
              <li v-for="message in bonusResult.recommendations" :key="message">{{ message }}</li>
            </ul>
          </div>
        </template>

        <p v-else class="status status--muted">
          Ajusta los campos del formulario para estimar el bono del colaborador.
        </p>
      </section>
    </section>
  </main>
</template>

<style scoped>
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.page__header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.page__title {
  margin: 0;
  font-size: clamp(2rem, 3vw, 2.75rem);
  color: var(--text-primary);
}

.page__description {
  margin: 0;
  max-width: 60ch;
  color: var(--text-muted);
}

.layout {
  display: grid;
  gap: 1.75rem;
}

@media (min-width: 960px) {
  .layout {
    grid-template-columns: minmax(320px, 420px) 1fr;
    align-items: start;
  }
}

.card {
  background: white;
  border-radius: 18px;
  padding: 1.75rem;
  box-shadow: 0 20px 50px -35px rgba(15, 23, 42, 0.45);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card--highlight {
  background: var(--surface-elevated);
}

.card__title {
  margin: 0;
  font-size: 1.3rem;
  color: var(--text-primary);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field__label {
  font-weight: 600;
  color: var(--text-primary);
}

.field__input {
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field__input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 4px rgba(11, 114, 133, 0.15);
}

.field__help {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.divider {
  border-bottom: 1px dashed var(--surface-border);
  margin: 0.5rem 0 1rem;
}

.form-errors {
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.35);
  border-radius: 12px;
  padding: 1rem;
  color: #b91c1c;
  font-size: 0.95rem;
}

.form-errors ul {
  margin: 0.5rem 0 0;
  padding-left: 1.2rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.button {
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  background: var(--surface-sunken);
  color: var(--accent-primary);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

.button:not(:disabled):hover,
.button:not(:disabled):focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px -18px rgba(15, 23, 42, 0.7);
}

.button--primary {
  background: var(--accent-primary);
  color: white;
}

.button--primary:not(:disabled):hover,
.button--primary:not(:disabled):focus-visible {
  background: var(--accent-primary-dark);
}

.status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-muted);
}

.status--muted {
  color: var(--text-muted);
}

.status__indicator {
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 50%;
  background: var(--accent-primary);
  box-shadow: 0 0 0 6px rgba(11, 114, 133, 0.15);
}

.status__indicator--error {
  background: #e53e3e;
  box-shadow: 0 0 0 6px rgba(229, 62, 62, 0.15);
}

.spinner {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  border: 4px solid rgba(11, 114, 133, 0.2);
  border-top-color: var(--accent-primary);
  animation: spin 0.9s linear infinite;
}

.summary__total {
  font-size: 1.6rem;
  color: var(--text-primary);
  margin: 0 0 1.25rem;
}

.summary__list {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.summary__list li {
  display: flex;
  justify-content: space-between;
  background: white;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  box-shadow: inset 0 0 0 1px var(--surface-border);
}

.summary__meta {
  display: grid;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: var(--text-muted);
}

.summary__recommendations {
  margin-top: 1.5rem;
  background: white;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  box-shadow: inset 0 0 0 1px var(--surface-border);
}

.summary__recommendations h3 {
  margin: 0 0 0.75rem;
  color: var(--text-primary);
}

.summary__recommendations ul {
  margin: 0;
  padding-left: 1.2rem;
  color: var(--text-muted);
}

@media (max-width: 640px) {
  .card {
    padding: 1.25rem;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
