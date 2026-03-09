<template>
  <q-page class="game-page">
    <div class="game-shell">
      <q-btn
        flat
        no-caps
        color="primary"
        icon="arrow_back"
        label="Back to portfolio"
        class="back-button"
        @click="goBack"
      />

      <header class="game-header">
        <p class="game-kicker">My Last Work</p>
        <h1 class="game-title">Labyrinthus</h1>
        <p class="game-lead">
          A fantasy top-down dungeon crawler with procedural rooms, lightweight combat AI, loot,
          and run-based progression.
        </p>
      </header>

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
  title: 'My Last Work | Cristhian Peverelli',
  meta: {
    description: {
      name: 'description',
      content:
        'Labyrinthus browser game: a procedural fantasy dungeon crawler built for the Cristhian Peverelli portfolio.',
    },
  },
}))

function goBack() {
  router.push('/')
}
</script>

<style scoped lang="scss">
.game-page {
  min-height: calc(100vh - 76px);
  padding: clamp(20px, 4vw, 48px) clamp(14px, 4vw, 40px) clamp(28px, 4vw, 48px);
  background:
    radial-gradient(circle at 10% 20%, rgba(15, 98, 254, 0.12), transparent 34%),
    radial-gradient(circle at 90% 80%, rgba(10, 132, 255, 0.12), transparent 40%),
    var(--bg-primary);
}

.game-shell {
  max-width: 1080px;
  margin: 0 auto;
}

.back-button {
  margin-bottom: 20px;
  border-radius: 999px;
}

.game-header {
  margin-bottom: 18px;
}

.game-kicker {
  margin: 0;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--text-muted);
}

.game-title {
  margin: 8px 0 10px;
  color: var(--text-primary);
}

.game-lead {
  margin: 0;
  max-width: 720px;
  color: var(--text-secondary);
}

</style>
