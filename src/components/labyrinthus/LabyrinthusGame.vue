<template>
  <section class="labyrinthus surface-card">
    <header class="labyrinthus__header">
      <div>
        <p class="labyrinthus__kicker">Labyrinthus</p>
        <h2 class="labyrinthus__title">Fantasy Dungeon Run</h2>
      </div>
      <q-chip square color="primary" text-color="white" icon="desktop_windows">Desktop focused</q-chip>
    </header>

    <div class="labyrinthus__arena">
      <canvas ref="canvasRef" class="labyrinthus__canvas" />

      <div v-if="gameState.scene === 'menu'" class="labyrinthus__overlay">
        <q-card flat class="overlay-card">
          <q-card-section>
            <h3 class="overlay-title">Begin a New Run</h3>
            <p class="overlay-text">
              Explore procedural rooms, defeat creatures, collect relics, and survive as long as
              possible.
            </p>
            <q-btn
              unelevated
              no-caps
              color="primary"
              icon="play_arrow"
              label="Play"
              class="overlay-action"
              @click="startGame"
            />
          </q-card-section>
        </q-card>
      </div>

      <div v-if="gameState.scene === 'upgrade'" class="labyrinthus__overlay">
        <q-card flat class="overlay-card overlay-card--large">
          <q-card-section>
            <h3 class="overlay-title">Choose Your Upgrade</h3>
            <p class="overlay-text">Every 4 cleared rooms you can improve your build.</p>
            <div class="upgrade-grid">
              <q-card v-for="upgrade in gameState.upgrades" :key="upgrade.id" flat class="upgrade-card">
                <q-card-section>
                  <p class="upgrade-title">{{ upgrade.title }}</p>
                  <p class="upgrade-desc">{{ upgrade.description }}</p>
                  <q-btn
                    unelevated
                    no-caps
                    color="primary"
                    label="Select"
                    @click="selectUpgrade(upgrade.id)"
                  />
                </q-card-section>
              </q-card>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div v-if="gameState.scene === 'gameover'" class="labyrinthus__overlay">
        <q-card flat class="overlay-card">
          <q-card-section>
            <h3 class="overlay-title">Game Over</h3>
            <p class="overlay-text">The labyrinth remembers every run.</p>
            <div class="gameover-grid">
              <p><span>Rooms:</span> {{ gameState.gameOver?.roomsCleared || 0 }}</p>
              <p><span>Kills:</span> {{ gameState.gameOver?.kills || 0 }}</p>
              <p><span>Coins:</span> {{ gameState.gameOver?.coins || 0 }}</p>
              <p><span>Relics:</span> {{ gameState.gameOver?.relics || 0 }}</p>
              <p class="gameover-score">
                <span>Final Score:</span> {{ gameState.gameOver?.score || 0 }}
              </p>
            </div>
            <q-btn
              unelevated
              no-caps
              color="primary"
              icon="refresh"
              label="Restart"
              class="overlay-action"
              @click="restartGame"
            />
          </q-card-section>
        </q-card>
      </div>

      <transition name="fade">
        <div v-if="gameState.message && gameState.scene === 'playing'" class="status-message">
          {{ gameState.message }}
        </div>
      </transition>
    </div>

    <div class="labyrinthus__hud">
      <div class="hud-card">
        <div class="hud-head">
          <p class="hud-title">Health</p>
          <p class="hud-value">{{ roundedHp }} / {{ roundedMaxHp }}</p>
        </div>
        <q-linear-progress
          rounded
          size="10px"
          :value="healthRatio"
          color="positive"
          track-color="grey-7"
        />
      </div>

      <div class="hud-card hud-stats">
        <p><span>Score</span>{{ gameState.stats.totalScore }}</p>
        <p><span>Rooms</span>{{ gameState.stats.roomsCleared }}</p>
        <p><span>Kills</span>{{ gameState.stats.kills }}</p>
        <p><span>Coins</span>{{ gameState.stats.coins }}</p>
        <p><span>Relics</span>{{ gameState.stats.relics }}</p>
      </div>

      <div class="hud-card">
        <p class="hud-title">Room</p>
        <p class="room-label">{{ gameState.room?.typeLabel || 'Waiting' }}</p>
        <p class="room-pos">
          {{ roomPosition }}
        </p>
        <p class="room-doors">Doors: {{ roomDoors }}</p>
      </div>

      <div class="hud-card">
        <p class="hud-title">Controls</p>
        <p class="controls-line">Move: WASD or arrows</p>
        <p class="controls-line">Attack: Left click or Space</p>
        <p class="controls-line">Potion: F or E</p>
        <q-btn
          flat
          no-caps
          color="primary"
          icon="local_drink"
          :disable="!gameState.canUsePotion"
          :label="`Use potion (${gameState.stats.potions})`"
          @click="usePotion"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { WORLD } from 'src/games/labyrinthus/config'
import { createLabyrinthusEngine } from 'src/games/labyrinthus/engine'

const canvasRef = ref(null)
const engine = ref(null)
const gameState = ref(createInitialState())

const healthRatio = computed(() => {
  if (!gameState.value.player) {
    return 1
  }
  return gameState.value.player.hp / gameState.value.player.maxHp
})

const roundedHp = computed(() => Math.round(gameState.value.player?.hp || 0))
const roundedMaxHp = computed(() => Math.round(gameState.value.player?.maxHp || 0))

const roomPosition = computed(() => {
  if (!gameState.value.room) {
    return 'Position: --'
  }
  return `Position: ${gameState.value.room.coords.x}, ${gameState.value.room.coords.y}`
})

const roomDoors = computed(() => {
  const room = gameState.value.room
  if (!room) {
    return '--'
  }
  const labels = []
  if (room.doors.north) labels.push('N')
  if (room.doors.east) labels.push('E')
  if (room.doors.south) labels.push('S')
  if (room.doors.west) labels.push('W')
  return labels.join(' / ') || 'None'
})

onMounted(() => {
  if (!canvasRef.value) {
    return
  }

  canvasRef.value.width = WORLD.width
  canvasRef.value.height = WORLD.height

  engine.value = createLabyrinthusEngine({
    canvas: canvasRef.value,
    onStateChange: (snapshot) => {
      gameState.value = snapshot
    },
  })

  engine.value.start()
})

onBeforeUnmount(() => {
  engine.value?.destroy()
})

function createInitialState() {
  return {
    scene: 'menu',
    message: '',
    player: null,
    stats: {
      roomsCleared: 0,
      kills: 0,
      coins: 0,
      potions: 1,
      relics: 0,
      score: 0,
      totalScore: 0,
    },
    room: null,
    upgrades: [],
    gameOver: null,
    canUsePotion: false,
  }
}

function startGame() {
  engine.value?.startRun()
}

function restartGame() {
  engine.value?.restartRun()
}

function selectUpgrade(upgradeId) {
  engine.value?.selectUpgrade(upgradeId)
}

function usePotion() {
  engine.value?.usePotion()
}
</script>

<style scoped lang="scss">
.labyrinthus {
  border-radius: 22px;
  border: 1px solid var(--border-soft);
  overflow: hidden;
}

.labyrinthus__header {
  padding: 18px 18px 14px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.labyrinthus__kicker {
  margin: 0;
  color: var(--text-muted);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.78rem;
}

.labyrinthus__title {
  margin: 6px 0 0;
  font-size: clamp(1.2rem, 2.6vw, 1.7rem);
  color: var(--text-primary);
}

.labyrinthus__arena {
  position: relative;
  border-top: 1px solid var(--border-soft);
  border-bottom: 1px solid var(--border-soft);
  background: #071528;
}

.labyrinthus__canvas {
  display: block;
  width: 100%;
  max-width: 100%;
  aspect-ratio: 1200 / 720;
}

.labyrinthus__overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(6, 18, 34, 0.54);
  backdrop-filter: blur(4px);
}

.overlay-card {
  width: min(520px, 94%);
  border-radius: 16px;
  border: 1px solid var(--border-soft);
  background: var(--surface-card);
}

.overlay-card--large {
  width: min(760px, 96%);
}

.overlay-title {
  margin: 0 0 8px;
  color: var(--text-primary);
}

.overlay-text {
  margin: 0;
  color: var(--text-secondary);
}

.overlay-action {
  margin-top: 14px;
  border-radius: 999px;
}

.upgrade-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.upgrade-card {
  border-radius: 12px;
  border: 1px solid var(--border-soft);
  background: var(--surface-soft);
}

.upgrade-title {
  margin: 0 0 5px;
  font-weight: 700;
  color: var(--text-primary);
}

.upgrade-desc {
  margin: 0 0 10px;
  color: var(--text-secondary);
  min-height: 44px;
}

.gameover-grid {
  margin-top: 12px;
  display: grid;
  gap: 4px;
  color: var(--text-secondary);
}

.gameover-grid p {
  margin: 0;
  display: flex;
  justify-content: space-between;
}

.gameover-grid span {
  color: var(--text-muted);
}

.gameover-score {
  margin-top: 6px !important;
  font-weight: 700;
  color: var(--text-primary) !important;
}

.status-message {
  position: absolute;
  left: 50%;
  top: 16px;
  transform: translateX(-50%);
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(164, 196, 241, 0.34);
  color: #ecf4ff;
  background: rgba(6, 20, 39, 0.78);
  font-weight: 600;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.labyrinthus__hud {
  padding: 14px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.hud-card {
  border-radius: 12px;
  border: 1px solid var(--border-soft);
  background: var(--surface-soft);
  padding: 10px 12px;
}

.hud-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.hud-title {
  margin: 0;
  font-weight: 700;
  color: var(--text-primary);
}

.hud-value {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.84rem;
}

.hud-stats {
  display: grid;
  gap: 4px;
}

.hud-stats p {
  margin: 0;
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  color: var(--text-primary);
}

.hud-stats p span {
  color: var(--text-muted);
  font-weight: 600;
}

.room-label,
.room-pos,
.room-doors,
.controls-line {
  margin: 2px 0;
  color: var(--text-secondary);
}

@media (max-width: 1024px) {
  .labyrinthus__hud {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .upgrade-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .labyrinthus__header {
    flex-direction: column;
  }

  .labyrinthus__hud {
    grid-template-columns: 1fr;
  }

  .status-message {
    width: calc(100% - 20px);
    text-align: center;
  }
}
</style>
