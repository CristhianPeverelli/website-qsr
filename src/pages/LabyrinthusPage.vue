<template>
  <q-page class="labyrinthus-page">
    <div class="page-aura page-aura--left" />
    <div class="page-aura page-aura--right" />

    <div class="page-shell">
      <q-btn
        flat
        no-caps
        color="primary"
        icon="arrow_back"
        label="Back to portfolio"
        class="back-button"
        @click="goBack"
      />

      <section class="surface-card intro-card">
        <div class="intro-copy">
          <h1 class="intro-title">Labyrinthus</h1>
          <p class="intro-lead">
            A handcrafted top-down roguelite where every room is generated on the fly. Fight, loot
            and push your score run after run.
          </p>
        </div>

        <div class="intro-panel">
          <p class="intro-panel__title">Core loop</p>
          <ul>
            <li>Clear rooms to unlock exits.</li>
            <li>Every 4 rooms, pick one upgrade.</li>
            <li>Manage potions, relics, and score multipliers.</li>
          </ul>

          <a
            class="asset-credit"
            href="https://kenney.nl/assets/tiny-dungeon"
            target="_blank"
            rel="noopener"
          >
            Pixel art pack: Kenney Tiny Dungeon (CC0)
          </a>
        </div>
      </section>

      <LabyrinthusGame />
    </div>
  </q-page>
</template>

<script setup>
import { useMeta } from 'quasar'
import { useRouter } from 'vue-router'
import LabyrinthusGame from 'src/components/labyrinthus/LabyrinthusGame.vue'

const router = useRouter()

useMeta(() => ({
  title: 'Labyrinthus | Cristhian Peverelli',
  meta: {
    description: {
      name: 'description',
      content:
        'Play Labyrinthus: a browser-based fantasy dungeon crawler with procedural rooms, upgrades, and run-based progression.',
    },
  },
}))

function goBack() {
  router.push('/')
}
</script>

<style scoped lang="scss">
.labyrinthus-page {
  position: relative;
  overflow: hidden;
  min-height: calc(100vh - 76px);
  padding: clamp(20px, 4vw, 48px) clamp(14px, 4vw, 42px) clamp(30px, 4vw, 52px);
  background:
    radial-gradient(circle at 6% 10%, rgba(255, 175, 109, 0.16), transparent 36%),
    radial-gradient(circle at 92% 82%, rgba(118, 239, 197, 0.12), transparent 34%),
    radial-gradient(circle at 50% 100%, rgba(255, 220, 127, 0.11), transparent 48%),
    linear-gradient(180deg, rgba(28, 17, 27, 0.98), rgba(14, 10, 20, 0.98));
}

.page-aura {
  position: absolute;
  width: min(36vw, 430px);
  aspect-ratio: 1;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(8px);
  opacity: 0.45;
}

.page-aura--left {
  left: -120px;
  top: -70px;
  background: radial-gradient(circle, rgba(88, 160, 255, 0.55), rgba(88, 160, 255, 0));
}

.page-aura--right {
  right: -130px;
  bottom: -130px;
  background: radial-gradient(circle, rgba(47, 217, 168, 0.44), rgba(47, 217, 168, 0));
}

.page-shell {
  position: relative;
  z-index: 1;
  max-width: 1160px;
  margin: 0 auto;
  display: grid;
  gap: 18px;
}

.back-button {
  width: fit-content;
  border: 1px solid rgba(255, 223, 170, 0.28);
  border-radius: 8px;
  background: rgba(19, 12, 24, 0.82);
  color: #f5e4c9;
  font-family: var(--font-pixel);
  letter-spacing: 0.02em;
}

.intro-card {
  border-radius: 14px;
  padding: clamp(16px, 2.7vw, 24px);
  display: grid;
  grid-template-columns: 1.45fr 1fr;
  gap: 16px;
  align-items: stretch;
  border-color: rgba(255, 217, 163, 0.16);
  background:
    linear-gradient(180deg, rgba(35, 22, 31, 0.95), rgba(18, 12, 24, 0.95)), var(--surface-card);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.3);
}

.intro-copy {
  display: grid;
  gap: 10px;
}

.intro-kicker {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #dfc0a2;
  font-family: var(--font-pixel);
}

.intro-title {
  margin: 0;
  font-size: clamp(1.65rem, 4vw, 2.45rem);
  color: #fff3de;
  font-family: var(--font-pixel);
  line-height: 1.25;
  text-shadow: 0 3px 0 rgba(91, 54, 33, 0.42);
}

.intro-lead {
  margin: 0;
  color: rgba(244, 228, 205, 0.86);
  max-width: 62ch;
}

.intro-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.intro-panel {
  border-radius: 10px;
  border: 1px solid rgba(255, 213, 153, 0.2);
  background: linear-gradient(180deg, rgba(71, 45, 35, 0.46), rgba(32, 21, 26, 0.52));
  padding: 14px;
}

.intro-panel__title {
  margin: 0 0 8px;
  font-weight: 700;
  color: #ffe8bf;
  font-family: var(--font-pixel);
  font-size: 0.82rem;
}

.intro-panel ul {
  margin: 0;
  padding-left: 18px;
  color: rgba(244, 228, 205, 0.82);
  display: grid;
  gap: 5px;
}

.asset-credit {
  display: inline-flex;
  margin-top: 14px;
  color: #8ff0d1;
  text-decoration: none;
  font-family: var(--font-pixel);
  font-size: 0.72rem;
}

@media (max-width: 920px) {
  .intro-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .page-shell {
    gap: 12px;
  }

  .intro-chips :deep(.q-chip) {
    font-size: 0.72rem;
  }
}
</style>
