<template>
  <q-layout view="hhh lpr fff" class="app-shell">
    <MainHeader />
    <q-page-container class="layout-page-container">
      <router-view v-slot="{ Component, route }">
        <transition name="shell-flow" mode="out-in" appear>
          <component :is="Component" :key="route.fullPath" />
        </transition>
      </router-view>
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
  position: relative;
  padding-top: 0 !important;
  overflow-x: clip;
}

:deep(.shell-flow-enter-active),
:deep(.shell-flow-leave-active) {
  transition:
    opacity 0.24s ease,
    transform 0.24s ease,
    filter 0.24s ease;
}

:deep(.shell-flow-enter-from),
:deep(.shell-flow-leave-to) {
  opacity: 0;
  transform: translateY(16px);
  filter: blur(8px);
}
</style>
