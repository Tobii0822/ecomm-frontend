<script setup lang="ts">
/** − [ qty ] + control. Emits the requested new quantity; the parent decides if it's allowed. */
const props = defineProps<{ quantity: number, max: number, disabled?: boolean }>()
const emit = defineEmits<{ (e: 'update', value: number): void }>()

const draft = ref(String(props.quantity))
watch(() => props.quantity, (q) => { draft.value = String(q) })

function commit() {
  const n = Number.parseInt(draft.value, 10)
  emit('update', Number.isFinite(n) ? n : props.quantity)
  draft.value = String(props.quantity)
}
</script>

<template>
  <div class="stepper d-inline-flex align-center">
    <v-btn
      icon="mdi-minus"
      size="x-small"
      variant="tonal"
      :disabled="disabled || quantity <= 1"
      aria-label="Decrease quantity"
      @click="emit('update', quantity - 1)"
    />
    <input
      v-model="draft"
      class="qty-input"
      type="number"
      inputmode="numeric"
      min="1"
      :max="max"
      :disabled="disabled"
      aria-label="Quantity"
      @change="commit"
      @keyup.enter="commit"
    >
    <v-btn
      icon="mdi-plus"
      size="x-small"
      variant="tonal"
      :disabled="disabled || quantity >= max"
      aria-label="Increase quantity"
      @click="emit('update', quantity + 1)"
    />
  </div>
</template>

<style scoped>
.qty-input {
  width: 46px;
  text-align: center;
  font-weight: 600;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  margin: 0 6px;
  padding: 3px 0;
  -moz-appearance: textfield;
  appearance: textfield;
}
.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
