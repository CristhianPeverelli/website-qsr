<template>
  <q-page class="error-page flex flex-center q-pa-md">
    <q-card flat class="surface-card error-card">
      <q-card-section>
        <p class="error-code">404</p>
        <h1 class="error-title">Page not found</h1>
        <p class="error-text">The requested route does not exist in this portfolio.</p>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn no-caps unelevated color="primary" to="/" label="Back to portfolio" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
//
</script>

<style scoped>
.error-page {
  min-height: calc(100vh - 78px);
}

.error-card {
  width: min(520px, 100%);
  border-radius: 18px;
}

.error-code {
  margin: 0;
  font-family: var(--font-title);
  font-size: 3.2rem;
  font-weight: 700;
  color: var(--accent-1);
}

.error-title {
  margin: 6px 0 0;
  font-size: 1.7rem;
}

.error-text {
  margin: 12px 0 0;
  color: var(--text-secondary);
}
</style>

