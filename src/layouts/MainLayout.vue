<template>
  <q-layout view="lHh Lpr lFf">
    <main-header />
    <q-page-container>
      <theme-button />
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import themeButton from 'components/ThemeButton.vue'
import MainHeader from 'components/MainHeader.vue'
</script>

<style scoped>
.q-page-container {
  padding-top: 0 !important;
}
</style>
