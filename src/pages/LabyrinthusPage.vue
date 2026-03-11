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
          <p class="intro-kicker">Playable Game Project</p>
          <h1 class="intro-title">Labyrinthus</h1>
          <p class="intro-lead">
            A handcrafted top-down roguelite where every room is generated on the fly. Fight, loot,
            adapt your build, and push your score run after run.
          </p>

          <div class="intro-chips">
            <q-chip square color="primary" text-color="white" icon="grid_view">Procedural map</q-chip>
            <q-chip square color="secondary" text-color="white" icon="bolt">Fast combat</q-chip>
            <q-chip square color="positive" text-color="white" icon="diamond">Relic system</q-chip>
          </div>
        </div>

        <div class="intro-panel">
          <p class="intro-panel__title">Core loop</p>
          <ul>
            <li>Clear rooms to unlock exits.</li>
            <li>Every 4 rooms, pick one upgrade.</li>
            <li>Manage potions, relics, and score multipliers.</li>
          </ul>
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
    radial-gradient(circle at 6% 10%, rgba(83, 167, 255, 0.16), transparent 36%),
    radial-gradient(circle at 92% 82%, rgba(39, 232, 185, 0.12), transparent 34%),
    radial-gradient(circle at 50% 100%, rgba(15, 98, 254, 0.11), transparent 48%),
    var(--bg-primary);
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
  border-radius: 999px;
}

.intro-card {
  border-radius: 22px;
  padding: clamp(16px, 2.7vw, 24px);
  display: grid;
  grid-template-columns: 1.45fr 1fr;
  gap: 16px;
  align-items: stretch;
}

.intro-copy {
  display: grid;
  gap: 10px;
}

.intro-kicker {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.intro-title {
  margin: 0;
  font-size: clamp(1.65rem, 4vw, 2.45rem);
  color: var(--text-primary);
}

.intro-lead {
  margin: 0;
  color: var(--text-secondary);
  max-width: 62ch;
}

.intro-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.intro-panel {
  border-radius: 16px;
  border: 1px solid var(--border-soft);
  background: linear-gradient(180deg, rgba(18, 42, 70, 0.08), rgba(18, 42, 70, 0.03));
  padding: 14px;
}

.intro-panel__title {
  margin: 0 0 8px;
  font-weight: 700;
  color: var(--text-primary);
}

.intro-panel ul {
  margin: 0;
  padding-left: 18px;
  color: var(--text-secondary);
  display: grid;
  gap: 5px;
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
