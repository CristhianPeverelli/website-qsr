<template>
  <q-header
    class="shadow-2 header-transition"
    elevated
    :class="[headerClass, { 'header-visible': showToolbar }]"
  >
    <q-toolbar class="q-px-md">
      <q-toolbar-title class="text-subtitle2">Cristhian Peverelli</q-toolbar-title>

      <q-btn flat label="Up" to="/" class="q-mx-sm" />
    </q-toolbar>
  </q-header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'

const showToolbar = ref(false)
const $q = useQuasar()

const headerClass = computed(() =>
  $q.dark.isActive ? 'bg-grey-1 text-dark' : 'bg-dark text-white',
)

function handleScroll() {
  showToolbar.value = window.scrollY > 600
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.header-transition {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-100%);
}

.header-visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}
</style>
