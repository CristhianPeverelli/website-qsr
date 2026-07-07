<template>
  <div v-if="showBanner" class="ad-consent-banner" role="region" aria-label="Advertising consent">
    <div class="ad-consent-copy">
      <strong>Advertising consent</strong>
      <p>
        Non-personalized Google AdSense is loaded on the timer page only after consent. Essential
        storage keeps theme, timer settings and this choice.
      </p>
    </div>

    <div class="ad-consent-actions">
      <q-btn flat no-caps label="Privacy" :to="{ path: '/privacy' }" />
      <q-btn outline no-caps color="primary" label="Essential only" @click="declineAdvertising" />
      <q-btn
        unelevated
        no-caps
        color="primary"
        label="Accept non-personalized ads"
        @click="acceptAdvertising"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAdConsent } from 'src/composables/useAdConsent'

const { consentChoice, acceptAdvertising, declineAdvertising } = useAdConsent()

const showBanner = computed(() => consentChoice.value === null)
</script>

<style scoped lang="scss">
.ad-consent-banner {
  position: fixed;
  right: 18px;
  bottom: 18px;
  left: 18px;
  z-index: 6000;
  width: min(100% - 36px, 880px);
  margin: 0 auto;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  padding: 14px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  color: var(--text-primary);
  background: rgba(18, 22, 20, 0.94);
  box-shadow: 0 18px 54px rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(18px);
}

body.body--light .ad-consent-banner {
  background: rgba(255, 253, 246, 0.96);
  box-shadow: 0 18px 54px rgba(33, 38, 31, 0.16);
}

.ad-consent-copy {
  display: grid;
  gap: 4px;
}

.ad-consent-copy strong {
  font-family: var(--font-title);
  line-height: 1.1;
}

.ad-consent-copy p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.92rem;
}

.ad-consent-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 760px) {
  .ad-consent-banner {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .ad-consent-actions {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
