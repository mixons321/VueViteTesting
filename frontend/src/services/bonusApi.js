export const DEFAULT_API_URL = 'http://127.0.0.1:8000/api/bonus'

function normaliseUrl(url) {
  if (!url) return DEFAULT_API_URL
  return url.trim().replace(/\/$/, '')
}

export async function calculateBonus(requestedUrl, payload, { timeoutMs = 8000 } = {}) {
  const url = normaliseUrl(requestedUrl) || DEFAULT_API_URL
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!response.ok) {
      const detail = await response.json().catch(() => ({}))
      const message = detail?.detail || `La API respondió con un estado ${response.status}`
      throw new Error(message)
    }

    const data = await response.json()
    return {
      totalBonus: data.total_bonus,
      breakdown: data.breakdown,
      recommendations: data.recommendations,
      calculatedAt: data.calculated_at,
      inputs: data.inputs,
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado en responder. Intenta nuevamente.')
    }

    if (error instanceof Error) {
      throw error
    }

    throw new Error('No fue posible calcular el bono con la API proporcionada.')
  } finally {
    clearTimeout(timeoutId)
  }
}
