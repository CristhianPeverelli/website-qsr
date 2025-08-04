<template>
  <q-btn flat icon="dark_mode" @click="toggleDarkMode" :label="isDark ? 'Dark' : 'Light'" />
</template>

<script setup>
import { useQuasar } from 'quasar'
import { ref, onMounted } from 'vue'

const $q = useQuasar()
const isDark = ref($q.dark.isActive)

function toggleDarkMode() {
  $q.dark.set(!isDark.value)
  isDark.value = $q.dark.isActive
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  const theme = localStorage.getItem('theme')
  if (theme === 'dark') {
    $q.dark.set(true)
    isDark.value = true
  } else {
    $q.dark.set(false)
    isDark.value = false
  }
})
</script>

<style scoped>
.q-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}
</style>
