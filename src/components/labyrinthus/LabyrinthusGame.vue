<template>
  <section class="labyrinthus surface-card">
    <div
      ref="stageRef"
      class="labyrinthus__stage"
      :class="{ 'labyrinthus__stage--fullscreen': isFullscreen }"
    >
      <div class="stage-toolbar">
        <p class="stage-pill">Seed: {{ runSeedLabel }}</p>
        <p class="stage-pill">Run Time: {{ formattedRunTime }}</p>
        <p class="stage-pill">Best Score: {{ bestScore }}</p>

        <q-space />

        <q-btn
          flat
          dense
          no-caps
          color="positive"
          icon="local_drink"
          :disable="!gameState.canUsePotion"
          :label="`Potion (${gameState.stats.potions})`"
          @click="usePotion"
        />

        <q-btn
          flat
          dense
          no-caps
          color="primary"
          :icon="isFullscreen ? 'fullscreen_exit' : 'fullscreen'"
          :label="isFullscreen ? 'Exit' : 'Fullscreen'"
          :disable="!fullscreenAvailable"
          @click="toggleFullscreen"
        />
      </div>

      <div class="labyrinthus__arena">
        <canvas ref="canvasRef" class="labyrinthus__canvas" />

        <div v-if="gameState.scene === 'menu'" class="labyrinthus__overlay">
          <q-card flat class="overlay-card">
            <q-card-section>
              <h3 class="overlay-title">Start a New Expedition</h3>
              <p class="overlay-text">
                Enter the maze, clear each chamber, collect relics, and survive as long as possible.
              </p>

              <div class="overlay-tags">
                <span>WASD / Arrow keys</span>
                <span>Mouse click or Space to attack</span>
                <span>F or E to drink potion</span>
              </div>

              <q-btn
                unelevated
                no-caps
                color="primary"
                icon="play_arrow"
                label="Begin Run"
                class="overlay-action"
                @click="startGame"
              />
            </q-card-section>
          </q-card>
        </div>

        <div v-if="gameState.scene === 'upgrade'" class="labyrinthus__overlay">
          <q-card flat class="overlay-card overlay-card--large">
            <q-card-section>
              <h3 class="overlay-title">Choose One Upgrade</h3>
              <p class="overlay-text">Every 4 cleared rooms your build evolves.</p>

              <div class="upgrade-grid">
                <q-card
                  v-for="upgrade in gameState.upgrades"
                  :key="upgrade.id"
                  flat
                  class="upgrade-card"
                >
                  <q-card-section>
                    <p class="upgrade-title">{{ upgrade.title }}</p>
                    <p class="upgrade-desc">{{ upgrade.description }}</p>
                    <q-btn
                      unelevated
                      no-caps
                      color="primary"
                      icon="auto_awesome"
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
              <h3 class="overlay-title">Run Ended</h3>
              <p class="overlay-text">The labyrinth keeps your best score alive.</p>

              <div class="gameover-grid">
                <p><span>Rooms:</span> {{ gameState.gameOver?.roomsCleared || 0 }}</p>
                <p><span>Kills:</span> {{ gameState.gameOver?.kills || 0 }}</p>
                <p><span>Coins:</span> {{ gameState.gameOver?.coins || 0 }}</p>
                <p><span>Relics:</span> {{ gameState.gameOver?.relics || 0 }}</p>
                <p class="gameover-score">
                  <span>Final Score:</span> {{ gameState.gameOver?.score || 0 }}
                </p>
                <p class="gameover-best"><span>Best Score:</span> {{ bestScore }}</p>
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

        <div v-if="isFullscreen && gameState.scene === 'playing'" class="fullscreen-hud">
          <div class="fullscreen-health">
            <p class="fullscreen-health__title">Health</p>
            <p class="fullscreen-health__value">{{ roundedHp }} / {{ roundedMaxHp }}</p>
            <div class="fullscreen-health__bar">
              <span :style="{ width: `${Math.round(healthRatio * 100)}%` }" />
            </div>
          </div>

          <div class="fullscreen-map">
            <p class="fullscreen-map__title">Minimap</p>
            <div class="minimap minimap--fullscreen" :style="minimapStyle">
              <div
                v-for="cell in minimapCells"
                :key="`fs-${cell.x},${cell.y}`"
                class="minimap-cell"
                :class="minimapCellClass(cell)"
                :style="{ gridColumn: cell.gridX, gridRow: cell.gridY }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="labyrinthus__hud">
      <article class="hud-card hud-card--health">
        <div class="hud-head">
          <p class="hud-title">Health</p>
          <p class="hud-value">{{ roundedHp }} / {{ roundedMaxHp }}</p>
        </div>
        <q-linear-progress
          rounded
          size="11px"
          :value="healthRatio"
          color="positive"
          track-color="grey-8"
        />

        <div class="hud-line-grid">
          <p><span>Damage</span>{{ roundedDamage }}</p>
          <p><span>Crit</span>{{ critChanceLabel }}</p>
          <p><span>Attack CD</span>{{ attackCooldownLabel }}</p>
        </div>
      </article>

      <article class="hud-card hud-card--stats">
        <p class="hud-title">Run Stats</p>
        <div class="hud-line-grid">
          <p><span>Total Score</span>{{ gameState.stats.totalScore }}</p>
          <p><span>Rooms Cleared</span>{{ gameState.stats.roomsCleared }}</p>
          <p><span>Kills</span>{{ gameState.stats.kills }}</p>
          <p><span>Coins</span>{{ gameState.stats.coins }}</p>
          <p><span>Relics</span>{{ gameState.stats.relics }}</p>
          <p><span>Potions</span>{{ gameState.stats.potions }}</p>
        </div>
      </article>

      <article class="hud-card hud-card--room">
        <p class="hud-title">Room Status</p>
        <p class="room-label">{{ gameState.room?.typeLabel || 'Waiting for run' }}</p>
        <p class="room-pos">{{ roomPosition }}</p>
        <p class="room-doors">Doors: {{ roomDoors }}</p>

        <div class="room-threat">
          <div>
            <p class="room-threat__label">Threat</p>
            <p class="room-threat__value">{{ gameState.enemiesRemaining }}</p>
          </div>
          <q-linear-progress
            rounded
            size="9px"
            :value="roomSafetyRatio"
            color="accent"
            track-color="grey-8"
          />
        </div>
      </article>

      <article class="hud-card hud-card--map">
        <div class="hud-head">
          <p class="hud-title">Minimap</p>
          <p class="hud-value">{{ exploredRooms }} explored</p>
        </div>

        <div class="minimap" :style="minimapStyle">
          <div
            v-for="cell in minimapCells"
            :key="`${cell.x},${cell.y}`"
            class="minimap-cell"
            :class="minimapCellClass(cell)"
            :style="{ gridColumn: cell.gridX, gridRow: cell.gridY }"
            :title="`(${cell.x}, ${cell.y}) - ${cell.type}`"
          />
        </div>

        <div class="minimap-legend">
          <span class="legend-dot legend-dot--current">Current</span>
          <span class="legend-dot legend-dot--normal">Normal</span>
          <span class="legend-dot legend-dot--elite">Elite</span>
          <span class="legend-dot legend-dot--treasure">Treasure</span>
          <span class="legend-dot legend-dot--corridor">Corridor</span>
        </div>
      </article>

      <article class="hud-card hud-card--controls">
        <p class="hud-title">Controls</p>
        <p class="controls-line">Move: WASD or Arrow keys</p>
        <p class="controls-line">Attack: Left click or Space</p>
        <p class="controls-line">Potion: F or E</p>
        <p class="controls-line">Fullscreen: button or F11 browser mode</p>

        <div class="controls-actions">
          <q-btn
            flat
            no-caps
            color="primary"
            :icon="isFullscreen ? 'fullscreen_exit' : 'fullscreen'"
            :label="isFullscreen ? 'Exit fullscreen' : 'Go fullscreen'"
            :disable="!fullscreenAvailable"
            @click="toggleFullscreen"
          />
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { WORLD } from 'src/games/labyrinthus/config'
import { createLabyrinthusEngine } from 'src/games/labyrinthus/engine'

const BEST_SCORE_KEY = 'labyrinthus-best-score'

const canvasRef = ref(null)
const stageRef = ref(null)
const engine = ref(null)
const gameState = ref(createInitialState())
const isFullscreen = ref(false)
const fullscreenAvailable = ref(false)
const bestScore = ref(0)

const healthRatio = computed(() => {
  if (!gameState.value.player) {
    return 1
  }
  return gameState.value.player.hp / gameState.value.player.maxHp
})

const roundedHp = computed(() => Math.round(gameState.value.player?.hp || 0))
const roundedMaxHp = computed(() => Math.round(gameState.value.player?.maxHp || 0))
const roundedDamage = computed(() => Math.round(gameState.value.player?.damage || 0))

const critChanceLabel = computed(
  () => `${Math.round((gameState.value.player?.critChance || 0) * 100)}%`,
)

const attackCooldownLabel = computed(
  () => `${(gameState.value.player?.attackCooldown || 0).toFixed(2)}s`,
)

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

const roomSafetyRatio = computed(() => {
  if (!gameState.value.room || gameState.value.room.cleared) {
    return 1
  }

  const baseline = Math.max(1, 4 + Math.floor(gameState.value.stats.roomsCleared * 0.45))
  const pressure = Math.min(1, gameState.value.enemiesRemaining / baseline)
  return 1 - pressure
})

const runSeedLabel = computed(() => {
  if (!gameState.value.runSeed) {
    return '--'
  }
  return String(gameState.value.runSeed).slice(-8)
})

const formattedRunTime = computed(() => {
  const total = Math.floor(gameState.value.runTime || 0)
  const minutes = String(Math.floor(total / 60)).padStart(2, '0')
  const seconds = String(total % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
})

const minimapData = computed(() => {
  const map = gameState.value.map || []
  if (!map.length) {
    return { cells: [], cols: 1, rows: 1 }
  }

  const xs = map.map((room) => room.x)
  const ys = map.map((room) => room.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const roomByCoord = new Map(map.map((room) => [`${room.x},${room.y}`, room]))

  const cells = map.map((room) => {
    const eastNeighbor = roomByCoord.has(`${room.x + 1},${room.y}`)
    const southNeighbor = roomByCoord.has(`${room.x},${room.y + 1}`)

    const corridorEast = Boolean(room.doors?.east) && eastNeighbor
    const corridorSouth = Boolean(room.doors?.south) && southNeighbor

    return {
      ...room,
      gridX: room.x - minX + 1,
      gridY: room.y - minY + 1,
      corridorEast,
      corridorSouth,
    }
  })

  return {
    cols: maxX - minX + 1,
    rows: maxY - minY + 1,
    cells,
  }
})

const minimapCells = computed(() => minimapData.value.cells)
const exploredRooms = computed(() => minimapData.value.cells.length)

const minimapStyle = computed(() => ({
  gridTemplateColumns: `repeat(${minimapData.value.cols}, var(--minimap-cell-size))`,
  gridTemplateRows: `repeat(${minimapData.value.rows}, var(--minimap-cell-size))`,
}))

watch(
  () => gameState.value.gameOver?.score,
  (score) => {
    if (typeof score !== 'number') {
      return
    }

    if (score > bestScore.value) {
      bestScore.value = score
      localStorage.setItem(BEST_SCORE_KEY, String(score))
    }
  },
)

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

  const storedBestScore = Number.parseInt(localStorage.getItem(BEST_SCORE_KEY) || '0', 10)
  bestScore.value = Number.isFinite(storedBestScore) ? storedBestScore : 0

  fullscreenAvailable.value = typeof stageRef.value?.requestFullscreen === 'function'

  document.addEventListener('fullscreenchange', syncFullscreenState)
  syncFullscreenState()

  engine.value.start()
})

onBeforeUnmount(() => {
  engine.value?.destroy()
  document.removeEventListener('fullscreenchange', syncFullscreenState)
})

function createInitialState() {
  return {
    scene: 'menu',
    message: '',
    runSeed: null,
    runTime: 0,
    enemiesRemaining: 0,
    map: [],
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

function minimapCellClass(cell) {
  return {
    'minimap-cell--visited': cell.visited,
    'minimap-cell--cleared': cell.cleared,
    'minimap-cell--current': cell.isCurrent,
    'minimap-cell--elite': cell.type === 'elite',
    'minimap-cell--treasure': cell.type === 'treasure',
    'minimap-cell--start': cell.type === 'start',
    'minimap-cell--corridor-east': cell.corridorEast,
    'minimap-cell--corridor-south': cell.corridorSouth,
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

async function toggleFullscreen() {
  if (!stageRef.value || !fullscreenAvailable.value) {
    return
  }

  try {
    const activeElement = document.fullscreenElement
    const stageElement = stageRef.value
    const stageIsActive =
      activeElement && (activeElement === stageElement || stageElement.contains(activeElement))

    if (!activeElement || !stageIsActive) {
      await stageElement.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  } catch (error) {
    console.error('Unable to toggle fullscreen mode', error)
  }
}

function syncFullscreenState() {
  const stageElement = stageRef.value
  const activeElement = document.fullscreenElement

  isFullscreen.value =
    Boolean(stageElement) &&
    Boolean(activeElement) &&
    (activeElement === stageElement || stageElement.contains(activeElement))
}
</script>

<style scoped lang="scss">
.labyrinthus {
  border-radius: 22px;
  border: 1px solid var(--border-soft);
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(9, 22, 39, 0.16), rgba(9, 22, 39, 0.03)), var(--surface-card);
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
  margin: 6px 0 4px;
  font-size: clamp(1.24rem, 2.6vw, 1.75rem);
  color: var(--text-primary);
}

.labyrinthus__subtitle {
  margin: 0;
  color: var(--text-secondary);
  max-width: 62ch;
}

.header-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.labyrinthus__stage {
  border-top: 1px solid var(--border-soft);
  border-bottom: 1px solid var(--border-soft);
  background: #071122;
}

.stage-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(138, 171, 218, 0.22);
  background: linear-gradient(180deg, rgba(10, 20, 36, 0.95), rgba(7, 16, 30, 0.92));
}

.stage-pill {
  margin: 0;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(161, 194, 238, 0.28);
  background: rgba(10, 22, 40, 0.7);
  color: #d8e7ff;
  font-size: 0.78rem;
  font-weight: 600;
}

.labyrinthus__arena {
  position: relative;
  background: #040a14;
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
  background: rgba(4, 12, 24, 0.56);
  backdrop-filter: blur(4px);
}

.overlay-card {
  width: min(560px, 94%);
  border-radius: 16px;
  border: 1px solid rgba(147, 186, 234, 0.28);
  background: linear-gradient(180deg, rgba(17, 33, 56, 0.96), rgba(11, 24, 42, 0.96));
}

.overlay-card :deep(.q-card__section) {
  color: #dce8fb;
}

.overlay-card--large {
  width: min(820px, 96%);
}

.overlay-title {
  margin: 0 0 8px;
  color: #f4f9ff;
}

.overlay-text {
  margin: 0;
  color: rgba(218, 232, 250, 0.9);
}

.overlay-tags {
  margin-top: 12px;
  display: grid;
  gap: 6px;
  font-size: 0.86rem;
  color: rgba(221, 235, 255, 0.86);
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
  border: 1px solid rgba(157, 191, 236, 0.24);
  background: linear-gradient(180deg, rgba(16, 33, 55, 0.92), rgba(11, 21, 38, 0.92));
}

.upgrade-title {
  margin: 0 0 5px;
  font-weight: 700;
  color: #f4f8ff;
}

.upgrade-desc {
  margin: 0 0 10px;
  color: rgba(219, 232, 250, 0.9);
  min-height: 44px;
}

.gameover-grid {
  margin-top: 12px;
  display: grid;
  gap: 5px;
  color: rgba(220, 232, 248, 0.95);
}

.gameover-grid p {
  margin: 0;
  display: flex;
  justify-content: space-between;
}

.gameover-grid span {
  color: rgba(167, 191, 222, 0.95);
}

.gameover-score {
  margin-top: 6px !important;
  font-weight: 700;
  color: #ffffff !important;
}

.gameover-best {
  font-weight: 700;
  color: #b5ffc5 !important;
}

.status-message {
  position: absolute;
  left: 50%;
  top: 16px;
  transform: translateX(-50%);
  padding: 9px 14px;
  border-radius: 11px;
  border: 1px solid rgba(164, 196, 241, 0.35);
  color: #ecf4ff;
  background: rgba(6, 20, 39, 0.8);
  font-weight: 600;
}

.fullscreen-hud {
  position: absolute;
  inset: 14px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  pointer-events: none;
}

.fullscreen-health,
.fullscreen-map {
  border-radius: 10px;
  border: 1px solid rgba(164, 196, 241, 0.34);
  background: rgba(6, 20, 39, 0.74);
  backdrop-filter: blur(3px);
  padding: 8px 10px;
  color: #ecf4ff;
}

.fullscreen-health {
  min-width: 210px;
}

.fullscreen-health__title,
.fullscreen-health__value,
.fullscreen-map__title {
  margin: 0;
}

.fullscreen-health__title,
.fullscreen-map__title {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(205, 222, 245, 0.88);
}

.fullscreen-health__value {
  margin-top: 2px;
  font-weight: 700;
}

.fullscreen-health__bar {
  margin-top: 6px;
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.25);
  overflow: hidden;
}

.fullscreen-health__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #38d39f, #9af5ce);
}

.minimap--fullscreen {
  --minimap-cell-size: 11px;
  --minimap-gap: 3px;
  margin-top: 6px;
  padding: 6px;
  min-height: unset;
  min-width: unset;
}

.minimap--fullscreen .minimap-cell {
  border-radius: 2px;
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
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 10px;
}

.hud-card {
  border-radius: 12px;
  border: 1px solid var(--border-soft);
  background:
    linear-gradient(180deg, rgba(20, 41, 67, 0.1), rgba(20, 41, 67, 0.03)), var(--surface-soft);
  padding: 11px 12px;
}

.hud-card--health,
.hud-card--stats,
.hud-card--room {
  grid-column: span 4;
}

.hud-card--map {
  grid-column: span 7;
}

.hud-card--controls {
  grid-column: span 5;
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

.hud-line-grid {
  margin-top: 10px;
  display: grid;
  gap: 5px;
}

.hud-line-grid p {
  margin: 0;
  display: flex;
  justify-content: space-between;
  color: var(--text-primary);
  font-weight: 600;
}

.hud-line-grid span {
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

.room-threat {
  margin-top: 8px;
  display: grid;
  gap: 6px;
}

.room-threat__label,
.room-threat__value {
  margin: 0;
}

.room-threat__label {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.room-threat__value {
  color: var(--text-primary);
  font-weight: 700;
}

.minimap {
  --minimap-cell-size: 14px;
  --minimap-gap: 4px;
  --minimap-corridor-color: rgba(151, 188, 239, 0.88);
  margin-top: 8px;
  display: grid;
  gap: var(--minimap-gap);
  width: fit-content;
  max-width: 100%;
  padding: 8px;
  border-radius: 10px;
  border: 1px solid rgba(130, 165, 213, 0.28);
  background: linear-gradient(180deg, rgba(12, 27, 46, 0.2), rgba(12, 27, 46, 0.08));
  align-content: start;
}

.minimap-cell {
  position: relative;
  width: var(--minimap-cell-size);
  height: var(--minimap-cell-size);
  border-radius: 3px;
  border: 1px solid rgba(139, 168, 212, 0.45);
  background: rgba(96, 130, 177, 0.45);
  box-shadow: inset 0 0 0 1px rgba(9, 18, 33, 0.2);
  transition: transform 0.16s ease;
}

.minimap-cell--visited {
  background: rgba(124, 158, 205, 0.62);
}

.minimap-cell--cleared {
  background: rgba(68, 210, 164, 0.56);
}

.minimap-cell--elite {
  background: rgba(255, 118, 118, 0.64);
}

.minimap-cell--treasure {
  background: rgba(244, 207, 101, 0.66);
}

.minimap-cell--start {
  background: rgba(113, 213, 191, 0.7);
}

.minimap-cell--current {
  border-color: #ffffff;
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.4),
    0 0 14px rgba(180, 219, 255, 0.65);
  transform: scale(1.06);
  z-index: 2;
}

.minimap-cell::before,
.minimap-cell::after {
  content: '';
  position: absolute;
  opacity: 0;
  pointer-events: none;
  background: var(--minimap-corridor-color);
  box-shadow: 0 0 6px rgba(146, 194, 255, 0.45);
}

.minimap-cell--corridor-east::after {
  opacity: 1;
  top: 50%;
  left: 100%;
  width: calc(var(--minimap-gap) + 2px);
  height: 4px;
  border-radius: 99px;
  transform: translateY(-50%);
}

.minimap-cell--corridor-south::before {
  opacity: 1;
  left: 50%;
  top: 100%;
  width: 4px;
  height: calc(var(--minimap-gap) + 2px);
  border-radius: 99px;
  transform: translateX(-50%);
}

.minimap-legend {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.legend-dot {
  position: relative;
  padding-left: 14px;
}

.legend-dot::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transform: translateY(-50%);
}

.legend-dot--current::before {
  background: #ffffff;
}

.legend-dot--normal::before {
  background: rgba(124, 158, 205, 0.85);
}

.legend-dot--elite::before {
  background: rgba(255, 118, 118, 0.9);
}

.legend-dot--treasure::before {
  background: rgba(244, 207, 101, 0.9);
}

.legend-dot--corridor::before {
  width: 11px;
  height: 4px;
  border-radius: 99px;
  background: rgba(151, 188, 239, 0.95);
}

.controls-actions {
  margin-top: 10px;
}

.labyrinthus__stage--fullscreen,
.labyrinthus__stage:fullscreen {
  width: 100vw;
  height: 100vh;
  padding: 14px;
  box-sizing: border-box;
  background:
    radial-gradient(circle at 20% 20%, rgba(65, 140, 255, 0.16), transparent 30%),
    radial-gradient(circle at 80% 80%, rgba(69, 221, 176, 0.14), transparent 28%), #040916;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 10px;
}

.labyrinthus__stage--fullscreen .stage-toolbar,
.labyrinthus__stage:fullscreen .stage-toolbar {
  border: 1px solid rgba(157, 191, 237, 0.27);
  border-radius: 12px;
}

.labyrinthus__stage--fullscreen .labyrinthus__arena,
.labyrinthus__stage:fullscreen .labyrinthus__arena {
  border: 1px solid rgba(157, 191, 237, 0.27);
  border-radius: 14px;
  overflow: hidden;
  display: grid;
  place-items: center;
}

.labyrinthus__stage--fullscreen .labyrinthus__canvas,
.labyrinthus__stage:fullscreen .labyrinthus__canvas {
  width: min(100%, calc((100vh - 180px) * (1200 / 720)));
  max-height: calc(100vh - 180px);
  object-fit: contain;
}

@media (max-width: 1200px) {
  .hud-card--health,
  .hud-card--stats,
  .hud-card--room {
    grid-column: span 6;
  }

  .hud-card--map,
  .hud-card--controls {
    grid-column: span 6;
  }
}

@media (max-width: 820px) {
  .labyrinthus__header {
    flex-direction: column;
  }

  .upgrade-grid {
    grid-template-columns: 1fr;
  }

  .labyrinthus__hud {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  .hud-card--health,
  .hud-card--stats,
  .hud-card--room,
  .hud-card--map,
  .hud-card--controls {
    grid-column: span 1;
  }
}

@media (max-width: 640px) {
  .status-message {
    width: calc(100% - 20px);
    text-align: center;
  }

  .stage-pill {
    font-size: 0.72rem;
  }
}
</style>
