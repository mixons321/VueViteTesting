<script setup>
const { title, description, variant } = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  variant: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'error', 'empty'].includes(value),
  },
})

const variantClasses = {
  info: 'state-message--info',
  error: 'state-message--error',
  empty: 'state-message--empty',
}
</script>

<template>
  <section class="state-message" :class="variantClasses[variant]">
    <h2 class="state-message__title">{{ title }}</h2>
    <p v-if="description" class="state-message__description">{{ description }}</p>
    <slot />
  </section>
</template>

<style scoped>
.state-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
  padding: 2.5rem 1.5rem;
  border-radius: 1rem;
  border: 1px solid var(--surface-border);
  background: var(--surface-elevated);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.state-message__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.state-message__description {
  margin: 0;
  line-height: 1.6;
}

.state-message--info {
  border-style: dashed;
}

.state-message--error {
  border-color: #f8b4b4;
  background: #fff5f5;
  color: #c81e1e;
}

.state-message--empty {
  border-style: dashed;
  color: var(--text-muted);
}
</style>
