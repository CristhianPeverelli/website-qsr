<template>
  <q-page class="privacy-page">
    <main class="privacy-shell" aria-labelledby="privacy-title">
      <p class="privacy-kicker">Privacy / Cookies / Advertising</p>
      <h1 id="privacy-title">Privacy &amp; cookies</h1>
      <p class="privacy-updated">Last updated: July 7, 2026</p>

      <section aria-labelledby="privacy-controller">
        <h2 id="privacy-controller">Who runs this website</h2>
        <p>
          This website is the personal portfolio of Cristhian Peverelli. You can contact me at
          <a href="mailto:cristhian.peverelli@gmail.com">cristhian.peverelli@gmail.com</a>.
        </p>
      </section>

      <section aria-labelledby="privacy-data">
        <h2 id="privacy-data">Data handled by this website</h2>
        <p>
          The site does not provide user accounts and does not collect form submissions. If you
          contact me by email or through external profiles, the information you send is handled by
          the service you choose to use.
        </p>
        <p>
          The site stores a few preferences in your browser: theme choice, timer duration and your
          advertising consent choice. These values are used only to keep the interface working as
          expected.
        </p>
      </section>

      <section aria-labelledby="privacy-ads">
        <h2 id="privacy-ads">Google AdSense</h2>
        <p>
          Google AdSense is configured for the timer page. The advertising script is loaded only
          after you accept advertising storage and is requested in non-personalized mode. If you
          choose essential storage only, the timer remains available without loading AdSense.
        </p>
        <p>
          When AdSense is loaded, Google and its partners may use cookies, local storage or similar
          identifiers to provide, measure and protect ads. Google explains its processing in the
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener"
            >Google Privacy Policy</a
          >.
        </p>
      </section>

      <section aria-labelledby="privacy-third-parties">
        <h2 id="privacy-third-parties">Third-party services</h2>
        <p>
          The site loads Google Fonts for typography. Project links may send you to external
          services such as GitHub, LinkedIn or hosted demos; those services apply their own privacy
          policies.
        </p>
      </section>

      <section aria-labelledby="privacy-choices">
        <h2 id="privacy-choices">Your choices</h2>
        <p>
          You can change your advertising choice by resetting it here. You can also clear this
          site's browser storage from your browser settings.
        </p>
        <q-btn
          outline
          no-caps
          color="primary"
          icon="restart_alt"
          label="Reset advertising choice"
          @click="resetAdvertisingConsent"
        />
      </section>
    </main>
  </q-page>
</template>

<script setup>
import { useMeta } from 'quasar'
import { useAdConsent } from 'src/composables/useAdConsent'

const { resetAdvertisingConsent } = useAdConsent()

useMeta(() => ({
  title: 'Privacy & cookies | Cristhian Peverelli',
  meta: {
    description: {
      name: 'description',
      content:
        'Privacy and cookie information for the Cristhian Peverelli portfolio website, including AdSense and local storage choices.',
    },
  },
}))
</script>

<style scoped lang="scss">
.privacy-page {
  min-height: calc(100vh - 76px);
  color: var(--text-primary);
  background:
    linear-gradient(90deg, rgba(104, 213, 207, 0.045) 1px, transparent 1px),
    linear-gradient(rgba(214, 255, 112, 0.035) 1px, transparent 1px),
    var(--bg-primary);
  background-size: 72px 72px;
}

.privacy-shell {
  width: min(100%, 920px);
  margin: 0 auto;
  padding: 44px clamp(18px, 4vw, 42px) 72px;
  display: grid;
  gap: 24px;
}

.privacy-kicker,
.privacy-updated {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 760;
  text-transform: uppercase;
}

.privacy-shell h1 {
  margin: 0;
  font-size: clamp(2.4rem, 7vw, 5rem);
  line-height: 0.98;
}

.privacy-shell section {
  border-top: 1px solid var(--border-soft);
  padding-top: 22px;
  display: grid;
  gap: 10px;
}

.privacy-shell h2 {
  margin: 0;
  font-size: 1.15rem;
}

.privacy-shell p {
  max-width: 74ch;
  margin: 0;
  color: var(--text-secondary);
}

.privacy-shell a {
  color: var(--accent-1);
  text-decoration: none;
}

.privacy-shell a:hover {
  color: var(--text-primary);
}
</style>
