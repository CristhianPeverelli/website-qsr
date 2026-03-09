<template>
  <q-layout view="hhh lpr fff" class="app-shell">
    <MainHeader />
    <q-page-container class="layout-page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import MainHeader from 'components/MainHeader.vue'
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.layout-page-container {
  padding-top: 0 !important;
}
</style>
