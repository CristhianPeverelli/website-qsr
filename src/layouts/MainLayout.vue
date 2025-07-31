<template>
  <q-layout view="lHh Lpr lFf">
    <q-header
      class="bg-white text-black shadow-2 header-transition"
      elevated
      :class="{ 'header-visible': showToolbar }"
    >
      <q-toolbar class="q-px-md">
        <q-toolbar-title class="text-subtitle2">Cristhian Peverelli</q-toolbar-title>

        <q-btn flat label="Home" to="/" class="q-mx-sm" />
        <q-btn flat label="About Me" to="/about" class="q-mx-sm" />
        <q-btn flat label="GitHub" href="https://github.com/CristhianPeverelli" target="_blank" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const showToolbar = ref(false)

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

.q-page-container {
  padding-top: 0 !important;
}
</style>
