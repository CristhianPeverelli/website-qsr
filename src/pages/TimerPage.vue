<template>
  <q-page
    ref="pageRef"
    class="timer-page"
    :class="{
      'timer-page--alert': isAlert,
      'timer-page--finished': isFinished,
      'timer-page--fullscreen': isFullscreen,
    }"
  >
    <section class="timer-shell" aria-labelledby="timer-title">
      <header class="timer-header">
        <div>
          <p class="timer-kicker">Event tool</p>
          <h1 id="timer-title" class="timer-title">Timer</h1>
        </div>

        <q-btn
          flat
          round
          :icon="isFullscreen ? 'fullscreen_exit' : 'fullscreen'"
          :aria-label="isFullscreen ? 'Esci da schermo intero' : 'Apri a schermo intero'"
          class="icon-control"
          @click="toggleFullscreen"
        >
          <q-tooltip>{{ isFullscreen ? 'Esci da schermo intero' : 'Schermo intero' }}</q-tooltip>
        </q-btn>
      </header>

      <div class="timer-layout">
        <main class="timer-stage" aria-live="polite">
          <div class="timer-status-row">
            <div class="timer-state" :class="{ 'timer-state--alert': isAlert }">
              {{ stateLabel }}
            </div>
            <div class="duration-chip">
              <span>Durata</span>
              <strong>{{ configuredDurationLabel }}</strong>
            </div>
          </div>

          <div
            class="timer-ring"
            :style="{ '--timer-progress': `${progressDegrees}deg` }"
            role="img"
            :aria-label="progressLabel"
          >
            <div class="timer-display-wrap">
              <span v-if="isFinished" class="timer-prefix">+</span>
              <span
                class="timer-display"
                :class="{ 'timer-display--long': displayTime.length > 5 }"
              >
                {{ displayTime }}
              </span>
              <p class="timer-subline">{{ subline }}</p>
            </div>
          </div>

          <div
            class="progress-track"
            role="progressbar"
            aria-label="Avanzamento timer"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="Math.round(progressPercent)"
          >
            <div class="progress-fill" :style="{ width: `${progressPercent}%` }" />
            <span class="progress-warning-mark" />
          </div>

          <div class="progress-labels" aria-hidden="true">
            <span>Start</span>
            <span>10%</span>
            <span>Fine</span>
          </div>

          <div class="fullscreen-adjustments" aria-label="Regolazione rapida durata">
            <q-btn
              v-for="adjustment in fullscreenAdjustments"
              :key="`${adjustment.label}-${adjustment.seconds}`"
              flat
              no-caps
              class="fullscreen-adjust-btn"
              :icon="adjustment.seconds > 0 ? 'add' : 'remove'"
              :label="adjustment.label"
              :disable="!canAdjustDuration(adjustment.seconds)"
              @click="adjustDuration(adjustment.seconds, { allowDuringRun: true })"
            />
          </div>

          <div class="timer-actions" aria-label="Controlli timer">
            <q-btn
              unelevated
              no-caps
              color="primary"
              class="main-action"
              :icon="primaryActionIcon"
              :label="primaryActionLabel"
              :disable="durationSeconds <= 0"
              @click="toggleRunning"
            />
            <q-btn
              outline
              no-caps
              color="primary"
              icon="restart_alt"
              label="Reset"
              class="secondary-action"
              :disable="!hasStarted"
              @click="resetTimer"
            />
          </div>
        </main>

        <aside class="timer-setup" aria-label="Impostazione durata">
          <div class="setup-block">
            <div class="setup-heading">
              <q-icon name="tune" size="20px" />
              <h2>Durata</h2>
            </div>

            <div class="time-inputs">
              <q-input
                v-model.number="fieldHours"
                outlined
                dense
                type="number"
                label="Ore"
                min="0"
                max="23"
                inputmode="numeric"
                :disable="setupLocked"
                @blur="commitFields"
              />
              <q-input
                v-model.number="fieldMinutes"
                outlined
                dense
                type="number"
                label="Min"
                min="0"
                max="999"
                inputmode="numeric"
                :disable="setupLocked"
                @blur="commitFields"
              />
              <q-input
                v-model.number="fieldSeconds"
                outlined
                dense
                type="number"
                label="Sec"
                min="0"
                max="59"
                inputmode="numeric"
                :disable="setupLocked"
                @blur="commitFields"
              />
            </div>
          </div>

          <div class="setup-block">
            <div class="setup-heading">
              <q-icon name="bolt" size="20px" />
              <h2>Preset</h2>
            </div>

            <div class="preset-grid">
              <q-btn
                v-for="preset in presets"
                :key="preset.seconds"
                outline
                no-caps
                class="preset-btn"
                :class="{ 'preset-btn--active': durationSeconds === preset.seconds }"
                :label="preset.label"
                :disable="setupLocked"
                @click="setDuration(preset.seconds)"
              />
            </div>
          </div>

          <div class="setup-block adjustment-block">
            <q-btn
              flat
              no-caps
              icon="remove"
              label="1 min"
              class="adjust-btn"
              :disable="setupLocked || durationSeconds <= 60"
              @click="adjustDuration(-60)"
            />
            <q-btn
              flat
              no-caps
              icon="add"
              label="1 min"
              class="adjust-btn"
              :disable="setupLocked"
              @click="adjustDuration(60)"
            />
          </div>
        </aside>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMeta } from 'quasar'

const STORAGE_KEY = 'portfolio-event-timer-duration'
const DEFAULT_DURATION_SECONDS = 10 * 60
const MAX_DURATION_SECONDS = 23 * 60 * 60 + 59 * 60 + 59

useMeta(() => ({
  title: 'Timer | Cristhian Peverelli',
  meta: {
    description: {
      name: 'description',
      content:
        'Timer web pulito per eventi, talk e speaker, con progress bar, soglia finale in rosso e conteggio del tempo extra.',
    },
  },
  script: {
    adsense: {
      async: '',
      src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5894415078703849',
      crossorigin: 'anonymous',
    },
  },
}))

const presets = [
  { label: '5 min', seconds: 5 * 60 },
  { label: '10 min', seconds: 10 * 60 },
  { label: '15 min', seconds: 15 * 60 },
  { label: '20 min', seconds: 20 * 60 },
  { label: '30 min', seconds: 30 * 60 },
  { label: '45 min', seconds: 45 * 60 },
]

const fullscreenAdjustments = [
  { label: '5 min', seconds: -5 * 60 },
  { label: '1 min', seconds: -60 },
  { label: '1 min', seconds: 60 },
  { label: '5 min', seconds: 5 * 60 },
]

const pageRef = ref(null)
const durationSeconds = ref(DEFAULT_DURATION_SECONDS)
const fieldHours = ref(0)
const fieldMinutes = ref(10)
const fieldSeconds = ref(0)
const elapsedMs = ref(0)
const running = ref(false)
const isFullscreen = ref(false)

let animationFrameId = 0
let startTimestamp = 0
let elapsedAtStart = 0
let wakeLock = null

const durationMs = computed(() => durationSeconds.value * 1000)
const hasStarted = computed(() => running.value || elapsedMs.value > 0)
const setupLocked = computed(() => hasStarted.value)
const remainingMs = computed(() => Math.max(0, durationMs.value - elapsedMs.value))
const overrunMs = computed(() => Math.max(0, elapsedMs.value - durationMs.value))
const isFinished = computed(() => hasStarted.value && elapsedMs.value >= durationMs.value)
const warningThresholdMs = computed(() => durationMs.value * 0.1)
const isWarning = computed(
  () => hasStarted.value && !isFinished.value && remainingMs.value <= warningThresholdMs.value,
)
const isAlert = computed(() => isWarning.value || isFinished.value)
const progressPercent = computed(() => {
  if (durationMs.value <= 0) {
    return 0
  }

  return Math.min(100, (elapsedMs.value / durationMs.value) * 100)
})
const progressDegrees = computed(() => progressPercent.value * 3.6)
const displayMs = computed(() => (isFinished.value ? overrunMs.value : remainingMs.value))
const displayTime = computed(() =>
  formatDuration(displayMs.value, isFinished.value ? 'floor' : 'ceil'),
)
const configuredDurationLabel = computed(() => formatDuration(durationMs.value))
const stateLabel = computed(() => {
  if (isFinished.value) {
    return running.value ? 'Tempo extra' : 'Extra in pausa'
  }

  if (running.value) {
    return isWarning.value ? 'Ultimo 10%' : 'In corso'
  }

  return elapsedMs.value > 0 ? 'Pausa' : 'Pronto'
})
const subline = computed(() => {
  if (isFinished.value) {
    return 'oltre il tempo impostato'
  }

  if (running.value) {
    return 'rimanenti'
  }

  return elapsedMs.value > 0 ? 'timer in pausa' : 'pronto per partire'
})
const primaryActionLabel = computed(() => {
  if (running.value) {
    return 'Pausa'
  }

  return elapsedMs.value > 0 ? 'Riprendi' : 'Avvia'
})
const primaryActionIcon = computed(() => (running.value ? 'pause' : 'play_arrow'))
const progressLabel = computed(
  () => `${Math.round(progressPercent.value)}% del tempo impostato trascorso`,
)

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function parseField(value) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return 0
  }

  return Math.max(0, Math.floor(parsed))
}

function secondsFromFields() {
  const hours = parseField(fieldHours.value)
  const minutes = parseField(fieldMinutes.value)
  const seconds = parseField(fieldSeconds.value)

  return clamp(hours * 3600 + minutes * 60 + seconds, 1, MAX_DURATION_SECONDS)
}

function syncFieldsFromSeconds(totalSeconds) {
  const normalizedSeconds = clamp(Math.floor(totalSeconds), 1, MAX_DURATION_SECONDS)

  fieldHours.value = Math.floor(normalizedSeconds / 3600)
  fieldMinutes.value = Math.floor((normalizedSeconds % 3600) / 60)
  fieldSeconds.value = normalizedSeconds % 60
}

function persistDuration() {
  localStorage.setItem(STORAGE_KEY, String(durationSeconds.value))
}

function loadSavedDuration() {
  const saved = Number(localStorage.getItem(STORAGE_KEY))

  if (Number.isFinite(saved) && saved > 0) {
    durationSeconds.value = clamp(Math.floor(saved), 1, MAX_DURATION_SECONDS)
  }

  syncFieldsFromSeconds(durationSeconds.value)
}

function commitFields() {
  if (setupLocked.value) {
    return
  }

  durationSeconds.value = secondsFromFields()
  syncFieldsFromSeconds(durationSeconds.value)
  persistDuration()
}

function setDuration(seconds, options = {}) {
  if (setupLocked.value && !options.allowDuringRun) {
    return
  }

  durationSeconds.value = clamp(seconds, 1, MAX_DURATION_SECONDS)
  syncFieldsFromSeconds(durationSeconds.value)
  persistDuration()
}

function canAdjustDuration(deltaSeconds) {
  if (deltaSeconds > 0) {
    return durationSeconds.value < MAX_DURATION_SECONDS
  }

  return durationSeconds.value + deltaSeconds >= 1
}

function adjustDuration(deltaSeconds, options = {}) {
  setDuration(durationSeconds.value + deltaSeconds, options)
}

function formatDuration(milliseconds, rounding = 'floor') {
  const secondsValue = Math.max(0, milliseconds) / 1000
  const totalSeconds = rounding === 'ceil' ? Math.ceil(secondsValue) : Math.floor(secondsValue)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
      seconds,
    ).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function updateElapsed() {
  if (!running.value) {
    return
  }

  elapsedMs.value = elapsedAtStart + (performance.now() - startTimestamp)
  animationFrameId = window.requestAnimationFrame(updateElapsed)
}

function startTimer() {
  if (running.value) {
    return
  }

  if (!hasStarted.value) {
    commitFields()
  }

  elapsedAtStart = elapsedMs.value
  startTimestamp = performance.now()
  running.value = true
  requestWakeLock()
  updateElapsed()
}

function pauseTimer() {
  if (!running.value) {
    return
  }

  elapsedMs.value = elapsedAtStart + (performance.now() - startTimestamp)
  running.value = false
  window.cancelAnimationFrame(animationFrameId)
  releaseWakeLock()
}

function toggleRunning() {
  if (running.value) {
    pauseTimer()
    return
  }

  startTimer()
}

function resetTimer() {
  running.value = false
  elapsedMs.value = 0
  elapsedAtStart = 0
  startTimestamp = 0
  window.cancelAnimationFrame(animationFrameId)
  releaseWakeLock()
}

function pageElement() {
  return pageRef.value?.$el ?? pageRef.value
}

async function toggleFullscreen() {
  const fullscreenElement = document.fullscreenElement

  if (fullscreenElement) {
    await document.exitFullscreen()
    return
  }

  await nextTick()
  const element = pageElement()

  if (element?.requestFullscreen) {
    await element.requestFullscreen()
  }
}

function syncFullscreenState() {
  const element = pageElement()
  isFullscreen.value = document.fullscreenElement === element
}

async function requestWakeLock() {
  if (!('wakeLock' in navigator) || wakeLock) {
    return
  }

  try {
    wakeLock = await navigator.wakeLock.request('screen')
    wakeLock.addEventListener('release', () => {
      wakeLock = null
    })
  } catch {
    wakeLock = null
  }
}

function releaseWakeLock() {
  if (!wakeLock) {
    return
  }

  wakeLock.release()
  wakeLock = null
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && running.value) {
    requestWakeLock()
  }
}

watch([fieldHours, fieldMinutes, fieldSeconds], () => {
  if (setupLocked.value) {
    return
  }

  durationSeconds.value = secondsFromFields()
  persistDuration()
})

onMounted(() => {
  loadSavedDuration()
  document.addEventListener('fullscreenchange', syncFullscreenState)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  running.value = false
  window.cancelAnimationFrame(animationFrameId)
  document.removeEventListener('fullscreenchange', syncFullscreenState)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  releaseWakeLock()
})
</script>

<style scoped lang="scss" src="../css/pages/timer/timer-page.scss"></style>
