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
          <q-card flat class="overlay-card overlay-card--large">
            <q-card-section>
              <h3 class="overlay-title">Start a New Expedition</h3>
              <p class="overlay-text">
                Enter the maze, clear each chamber, collect relics and survive as long as possible.
              </p>

              <div class="intro-chips">
                <q-chip square icon="grid_view">WASD / Arrow keys</q-chip>
                <q-chip square icon="bolt">Mouse click or Space to attack</q-chip>
                <q-chip square icon="diamond">F or E to drink potion</q-chip>
              </div>

              <div class="loadout-grid">
                <button
                  v-for="loadout in loadouts"
                  :key="loadout.id"
                  type="button"
                  class="loadout-card"
                  :class="{ 'loadout-card--active': loadout.id === selectedLoadoutId }"
                  @click="selectedLoadoutId = loadout.id"
                >
                  <p class="loadout-card__eyebrow">{{ loadout.archetype }}</p>
                  <p class="loadout-card__title">{{ loadout.shortLabel }}</p>
                  <p class="loadout-card__desc">{{ loadout.description }}</p>

                  <div class="loadout-card__stats">
                    <span>DMG {{ loadout.damage }}</span>
                    <span>CRIT {{ Math.round(loadout.critChance * 100) }}%</span>
                    <span>HASTE {{ loadout.attackCooldown.toFixed(2) }}s</span>
                  </div>
                </button>
              </div>

              <q-btn
                unelevated
                no-caps
                icon="play_arrow"
                :label="`Begin with ${selectedLoadout.shortLabel}`"
                class="overlay-action"
                @click="startGame(selectedLoadoutId)"
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
            <p class="fullscreen-health__weapon">{{ currentWeaponLabel }}</p>
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
      <div class="hud-stack">
        <article class="hud-panel hud-panel--vitals">
          <div class="hud-panel__top">
            <div>
              <p class="hud-label">Health</p>
              <p class="hud-primary">{{ roundedHp }} / {{ roundedMaxHp }}</p>
            </div>
            <span class="hud-badge">{{ currentWeaponLabel }}</span>
          </div>

          <div class="hud-healthbar">
            <span :style="{ width: `${Math.round(healthRatio * 100)}%` }" />
          </div>

          <div class="hud-chip-row">
            <span
              v-for="stat in combatStats"
              :key="stat.label"
              class="hud-chip"
              :class="stat.tone ? `hud-chip--${stat.tone}` : ''"
            >
              <span class="hud-chip__label">{{ stat.label }}</span>
              <span class="hud-chip__value">{{ stat.value }}</span>
            </span>
          </div>
        </article>

        <article class="hud-panel hud-panel--run">
          <div class="hud-panel__top">
            <div>
              <p class="hud-label">Run Overview</p>
              <p class="hud-primary">{{ gameState.stats.totalScore }}</p>
            </div>
            <span class="hud-badge hud-badge--soft">Score</span>
          </div>

          <div class="hud-metrics-grid">
            <div
              v-for="metric in runMetrics"
              :key="metric.label"
              class="hud-metric"
              :class="metric.tone ? `hud-metric--${metric.tone}` : ''"
            >
              <span class="hud-metric__label">{{ metric.label }}</span>
              <strong class="hud-metric__value">{{ metric.value }}</strong>
            </div>
          </div>
        </article>
      </div>

      <article class="hud-panel hud-panel--room">
        <div class="hud-panel__top">
          <div>
            <p class="hud-label">Room</p>
            <p class="hud-primary">{{ currentRoomLabel }}</p>
          </div>

          <q-btn
            flat
            round
            dense
            color="primary"
            class="hud-inline-action"
            :icon="isFullscreen ? 'fullscreen_exit' : 'fullscreen'"
            :disable="!fullscreenAvailable"
            @click="toggleFullscreen"
          />
        </div>

        <div class="hud-chip-row hud-chip-row--meta">
          <span
            v-for="item in roomMetaChips"
            :key="item.label"
            class="hud-chip hud-chip--quiet"
            :class="item.tone ? `hud-chip--${item.tone}` : ''"
          >
            <span class="hud-chip__label">{{ item.label }}</span>
            <span class="hud-chip__value">{{ item.value }}</span>
          </span>
        </div>

        <div class="minimap minimap--hud" :style="minimapStyle">
          <div
            v-for="cell in minimapCells"
            :key="`${cell.x},${cell.y}`"
            class="minimap-cell"
            :class="minimapCellClass(cell)"
            :style="{ gridColumn: cell.gridX, gridRow: cell.gridY }"
            :title="`(${cell.x}, ${cell.y}) - ${cell.type}`"
          />
        </div>

        <p class="hud-hint">Move WASD · Attack click/space · Potion F/E</p>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PLAYER_DEFAULT_LOADOUT_ID, PLAYER_LOADOUTS, WORLD } from 'src/games/labyrinthus/config'
import { createLabyrinthusEngine } from 'src/games/labyrinthus/engine'

const BEST_SCORE_KEY = 'labyrinthus-best-score'

const canvasRef = ref(null)
const stageRef = ref(null)
const engine = ref(null)
const gameState = ref(createInitialState())
const isFullscreen = ref(false)
const fullscreenAvailable = ref(false)
const bestScore = ref(0)
const selectedLoadoutId = ref(PLAYER_DEFAULT_LOADOUT_ID)
const loadouts = PLAYER_LOADOUTS

const healthRatio = computed(() => {
  if (!gameState.value.player) {
    return 1
  }
  return gameState.value.player.hp / gameState.value.player.maxHp
})

const roundedHp = computed(() => Math.round(gameState.value.player?.hp || 0))
const roundedMaxHp = computed(() => Math.round(gameState.value.player?.maxHp || 0))
const roundedDamage = computed(() => Math.round(gameState.value.player?.damage || 0))
const selectedLoadout = computed(
  () => loadouts.find((loadout) => loadout.id === selectedLoadoutId.value) || loadouts[0],
)
const currentWeaponLabel = computed(
  () => gameState.value.player?.weaponTitle || selectedLoadout.value?.title || 'Unarmed',
)
const currentRoomLabel = computed(() => gameState.value.room?.typeLabel || 'Awaiting run')
const currentAttackStyleLabel = computed(() =>
  gameState.value.player?.attackKind === 'projectile' ? 'Ranged' : 'Melee',
)

const critChanceLabel = computed(
  () => `${Math.round((gameState.value.player?.critChance || 0) * 100)}%`,
)

const attackCooldownLabel = computed(
  () => `${(gameState.value.player?.attackCooldown || 0).toFixed(2)}s`,
)

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
const roomPositionLabel = computed(() => {
  const room = gameState.value.room
  if (!room) {
    return '--'
  }

  return `${room.coords.x}, ${room.coords.y}`
})

const roomDoorsLabel = computed(() => {
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

const roomThreatLabel = computed(() => {
  const room = gameState.value.room
  if (!room) {
    return 'Dormant'
  }

  if (room.cleared) {
    return 'Cleared'
  }

  const enemies = gameState.value.enemiesRemaining
  return enemies === 1 ? '1 enemy' : `${enemies} enemies`
})

const combatStats = computed(() => [
  { label: 'Damage', value: roundedDamage.value },
  { label: 'Crit', value: critChanceLabel.value },
  { label: 'Cooldown', value: attackCooldownLabel.value },
  { label: 'Style', value: currentAttackStyleLabel.value, tone: 'accent' },
])

const runMetrics = computed(() => [
  { label: 'Rooms', value: gameState.value.stats.roomsCleared },
  { label: 'Kills', value: gameState.value.stats.kills },
  { label: 'Coins', value: gameState.value.stats.coins, tone: 'gold' },
  { label: 'Relics', value: gameState.value.stats.relics, tone: 'arcane' },
  { label: 'Potions', value: gameState.value.stats.potions, tone: 'life' },
])

const roomMetaChips = computed(() => [
  { label: 'Position', value: roomPositionLabel.value },
  {
    label: 'Threat',
    value: roomThreatLabel.value,
    tone: gameState.value.room?.cleared ? 'life' : 'danger',
  },
  { label: 'Doors', value: roomDoorsLabel.value },
  { label: 'Explored', value: exploredRooms.value },
])

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
      if (snapshot.player?.weaponId) {
        selectedLoadoutId.value = snapshot.player.weaponId
      }
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

function startGame(loadoutId = selectedLoadoutId.value) {
  engine.value?.startRun(loadoutId)
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
  border-radius: 12px;
  border: 1px solid rgba(255, 212, 148, 0.18);
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(42, 25, 30, 0.96), rgba(18, 12, 22, 0.96)), var(--surface-card);
  box-shadow: 0 24px 46px rgba(0, 0, 0, 0.32);
}

.labyrinthus :deep(.q-btn) {
  font-family: var(--font-pixel);
  letter-spacing: 0.02em;
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
  border-top: 1px solid rgba(255, 212, 148, 0.16);
  border-bottom: 1px solid rgba(255, 212, 148, 0.16);
  background: #090510;
}

.stage-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 212, 148, 0.12);
  background: linear-gradient(180deg, rgba(41, 23, 30, 0.96), rgba(20, 12, 20, 0.94));
}

.stage-pill {
  margin: 0;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 214, 153, 0.2);
  background: rgba(24, 14, 22, 0.84);
  color: #f7e6ca;
  font-size: 0.72rem;
  font-weight: 600;
  font-family: var(--font-pixel);
}

.labyrinthus__arena {
  position: relative;
  background: #090510;
}

.labyrinthus__canvas {
  display: block;
  width: 100%;
  max-width: 100%;
  aspect-ratio: 1200 / 720;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.labyrinthus__overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(11, 6, 15, 0.68);
  backdrop-filter: blur(4px);
}

.overlay-card {
  width: min(560px, 94%);
  border-radius: 10px;
  border: 1px solid rgba(255, 218, 163, 0.24);
  background: linear-gradient(180deg, rgba(49, 29, 35, 0.96), rgba(22, 14, 20, 0.98));
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.36);
}

.overlay-card :deep(.q-card__section) {
  color: #f6e8d4;
}

.overlay-card--large {
  width: min(820px, 96%);
}

.overlay-title {
  margin: 0 0 8px;
  color: #fff1d7;
  font-family: var(--font-pixel);
  font-size: 1rem;
  line-height: 1.4;
}

.overlay-text {
  margin: 0;
  color: rgba(246, 232, 212, 0.84);
}

.overlay-tags {
  margin-top: 12px;
  display: grid;
  gap: 6px;
  font-size: 0.8rem;
  color: rgba(246, 232, 212, 0.82);
}

.overlay-action {
  margin-top: 14px;
  border-radius: 8px;
}

.overlay-selection {
  margin: 14px 0 0;
  color: #ffedca;
  font-family: var(--font-pixel);
  font-size: 0.72rem;
}

.loadout-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.loadout-card {
  border: 1px solid rgba(255, 218, 163, 0.16);
  border-radius: 8px;
  padding: 12px;
  background: linear-gradient(180deg, rgba(56, 34, 39, 0.92), rgba(23, 14, 20, 0.96));
  color: #f7ecd8;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.loadout-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 228, 177, 0.38);
}

.loadout-card--active {
  border-color: rgba(148, 236, 202, 0.58);
  box-shadow:
    inset 0 0 0 1px rgba(148, 236, 202, 0.22),
    0 0 18px rgba(93, 190, 155, 0.18);
}

.loadout-card__eyebrow,
.loadout-card__title,
.loadout-card__desc {
  margin: 0;
}

.loadout-card__eyebrow {
  color: #8ff0d1;
  font-family: var(--font-pixel);
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.loadout-card__title {
  margin-top: 8px;
  color: #fff2d3;
  font-family: var(--font-pixel);
  font-size: 0.78rem;
}

.loadout-card__desc {
  margin-top: 8px;
  min-height: 60px;
  color: rgba(247, 236, 216, 0.84);
  font-size: 0.84rem;
}

.loadout-card__stats {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.loadout-card__stats span {
  display: inline-flex;
  align-items: center;
  padding: 3px 7px;
  border-radius: 999px;
  background: rgba(255, 236, 193, 0.08);
  color: #f4ddb0;
  font-family: var(--font-pixel);
  font-size: 0.58rem;
}

.upgrade-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.upgrade-card {
  border-radius: 8px;
  border: 1px solid rgba(255, 218, 163, 0.2);
  background: linear-gradient(180deg, rgba(58, 35, 40, 0.92), rgba(24, 14, 20, 0.94));
}

.upgrade-title {
  margin: 0 0 5px;
  font-weight: 700;
  color: #fff0d0;
  font-family: var(--font-pixel);
  font-size: 0.82rem;
  line-height: 1.35;
}

.upgrade-desc {
  margin: 0 0 10px;
  color: rgba(246, 232, 212, 0.82);
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
  border-radius: 7px;
  border: 1px solid rgba(255, 218, 163, 0.32);
  color: #fff0d2;
  background: rgba(24, 14, 22, 0.88);
  font-weight: 600;
  font-family: var(--font-pixel);
  font-size: 0.7rem;
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
  border-radius: 8px;
  border: 1px solid rgba(255, 214, 153, 0.26);
  background: rgba(24, 14, 22, 0.82);
  backdrop-filter: blur(3px);
  padding: 8px 10px;
  color: #fff0d2;
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
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 225, 188, 0.88);
  font-family: var(--font-pixel);
}

.fullscreen-health__value {
  margin-top: 2px;
  font-weight: 700;
}

.fullscreen-health__weapon {
  margin: 4px 0 0;
  color: #8ff0d1;
  font-family: var(--font-pixel);
  font-size: 0.62rem;
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
  background: linear-gradient(90deg, #4fdc8b, #f4d074);
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
  padding: 12px 14px 14px;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.88fr);
  gap: 10px;
  background: linear-gradient(180deg, rgba(16, 10, 18, 0.96), rgba(12, 8, 16, 0.98));
}

.hud-stack {
  display: grid;
  gap: 10px;
}

.hud-panel {
  border-radius: 10px;
  border: 1px solid rgba(255, 214, 153, 0.14);
  background:
    linear-gradient(180deg, rgba(39, 24, 30, 0.8), rgba(16, 11, 18, 0.92)),
    rgba(22, 15, 24, 0.88);
  padding: 12px;
  box-shadow: inset 0 1px 0 rgba(255, 227, 185, 0.03);
}

.hud-panel--vitals {
  background:
    radial-gradient(circle at right top, rgba(83, 186, 255, 0.12), transparent 30%),
    linear-gradient(180deg, rgba(31, 23, 30, 0.9), rgba(15, 11, 17, 0.94));
}

.hud-panel--run {
  background:
    radial-gradient(circle at left center, rgba(246, 199, 113, 0.08), transparent 26%),
    linear-gradient(180deg, rgba(30, 21, 26, 0.88), rgba(15, 11, 17, 0.94));
}

.hud-panel--room {
  display: grid;
  align-content: start;
}

.hud-panel__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.hud-label {
  margin: 0;
  color: rgba(224, 196, 160, 0.72);
  font-family: var(--font-pixel);
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hud-primary {
  margin: 6px 0 0;
  color: #fff0d3;
  font-family: var(--font-pixel);
  font-size: 0.92rem;
  line-height: 1.4;
}

.hud-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 9px;
  border-radius: 999px;
  border: 1px solid rgba(139, 228, 193, 0.24);
  background: rgba(74, 155, 125, 0.1);
  color: #95efcf;
  font-family: var(--font-pixel);
  font-size: 0.58rem;
  white-space: nowrap;
}

.hud-badge--soft {
  border-color: rgba(255, 214, 153, 0.16);
  background: rgba(255, 214, 153, 0.06);
  color: #f0dbb4;
}

.hud-healthbar {
  margin-top: 10px;
  height: 9px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(97, 71, 64, 0.38);
}

.hud-healthbar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #59d98e, #f2c86b);
}

.hud-chip-row {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hud-chip {
  min-width: 0;
  display: grid;
  gap: 3px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 214, 153, 0.12);
  background: rgba(255, 244, 224, 0.04);
}

.hud-chip--accent {
  border-color: rgba(139, 228, 193, 0.2);
  background: rgba(139, 228, 193, 0.08);
}

.hud-chip--gold {
  border-color: rgba(244, 207, 101, 0.18);
  background: rgba(244, 207, 101, 0.08);
}

.hud-chip--arcane {
  border-color: rgba(143, 187, 255, 0.22);
  background: rgba(143, 187, 255, 0.08);
}

.hud-chip--life {
  border-color: rgba(95, 227, 142, 0.18);
  background: rgba(95, 227, 142, 0.08);
}

.hud-chip--danger {
  border-color: rgba(255, 120, 120, 0.18);
  background: rgba(255, 120, 120, 0.08);
}

.hud-chip--quiet {
  background: rgba(255, 244, 224, 0.03);
}

.hud-chip__label {
  color: rgba(220, 189, 151, 0.7);
  font-size: 0.64rem;
  line-height: 1;
}

.hud-chip__value {
  color: #f7ebd4;
  font-weight: 700;
  font-size: 0.76rem;
  line-height: 1.2;
  word-break: break-word;
}

.hud-metrics-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.hud-metric {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 214, 153, 0.12);
  background: rgba(255, 244, 224, 0.04);
}

.hud-metric--gold {
  border-color: rgba(244, 207, 101, 0.18);
}

.hud-metric--arcane {
  border-color: rgba(143, 187, 255, 0.22);
}

.hud-metric--life {
  border-color: rgba(95, 227, 142, 0.18);
}

.hud-metric__label {
  display: block;
  color: rgba(220, 189, 151, 0.72);
  font-size: 0.63rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.hud-metric__value {
  display: block;
  margin-top: 5px;
  color: #fff0d3;
  font-family: var(--font-pixel);
  font-size: 0.76rem;
}

.hud-inline-action {
  border: 1px solid rgba(255, 214, 153, 0.12);
  background: rgba(255, 255, 255, 0.03);
}

.minimap--hud {
  --minimap-cell-size: 12px;
  --minimap-gap: 3px;
  margin-top: 12px;
  padding: 7px;
}

.hud-hint {
  margin: 12px 0 0;
  color: rgba(222, 204, 180, 0.72);
  font-size: 0.74rem;
  line-height: 1.5;
}

.minimap {
  --minimap-cell-size: 14px;
  --minimap-gap: 4px;
  --minimap-corridor-color: rgba(255, 214, 153, 0.9);
  margin-top: 8px;
  display: grid;
  gap: var(--minimap-gap);
  width: fit-content;
  max-width: 100%;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid rgba(255, 214, 153, 0.18);
  background: linear-gradient(180deg, rgba(30, 19, 24, 0.48), rgba(20, 13, 19, 0.24));
  align-content: start;
}

.minimap-cell {
  position: relative;
  width: var(--minimap-cell-size);
  height: var(--minimap-cell-size);
  border-radius: 2px;
  border: 1px solid rgba(59, 34, 30, 0.65);
  background: rgba(156, 116, 85, 0.52);
  box-shadow: inset 0 0 0 1px rgba(20, 12, 20, 0.25);
  transition: transform 0.16s ease;
}

.minimap-cell--visited {
  background: rgba(201, 157, 106, 0.68);
}

.minimap-cell--cleared {
  background: rgba(101, 222, 155, 0.74);
}

.minimap-cell--elite {
  background: rgba(255, 116, 116, 0.78);
}

.minimap-cell--treasure {
  background: rgba(255, 215, 99, 0.82);
}

.minimap-cell--start {
  background: rgba(132, 228, 200, 0.82);
}

.minimap-cell--current {
  border-color: #ffffff;
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.4),
    0 0 14px rgba(255, 225, 165, 0.65);
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

.labyrinthus__stage--fullscreen,
.labyrinthus__stage:fullscreen {
  width: 100vw;
  height: 100vh;
  padding: 14px;
  box-sizing: border-box;
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 190, 118, 0.14), transparent 30%),
    radial-gradient(circle at 80% 80%, rgba(69, 221, 176, 0.1), transparent 28%), #090510;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 10px;
}

.labyrinthus__stage--fullscreen .stage-toolbar,
.labyrinthus__stage:fullscreen .stage-toolbar {
  border: 1px solid rgba(255, 214, 153, 0.2);
  border-radius: 8px;
}

.labyrinthus__stage--fullscreen .labyrinthus__arena,
.labyrinthus__stage:fullscreen .labyrinthus__arena {
  border: 1px solid rgba(255, 214, 153, 0.2);
  border-radius: 10px;
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
  .labyrinthus__hud {
    grid-template-columns: 1fr;
  }

  .hud-metrics-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .labyrinthus__header {
    flex-direction: column;
  }

  .loadout-grid,
  .upgrade-grid {
    grid-template-columns: 1fr;
  }

  .labyrinthus__hud {
    grid-template-columns: 1fr;
  }

  .hud-metrics-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
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

  .hud-panel__top {
    flex-direction: column;
    align-items: flex-start;
  }

  .hud-metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
