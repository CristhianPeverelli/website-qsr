<template>
  <q-page class="delta-e-page">
    <div class="bg-orb orb-a" />
    <div class="bg-orb orb-b" />

    <section class="delta-e-section">
      <div class="section-shell">
        <q-card flat class="delta-e-card">
          <q-card-section class="card-head">
            <div class="title-block">
              <p class="section-kicker">Color Perception Puzzle</p>
              <h1 class="page-title">Delta - E</h1>
              <p class="page-summary">
                Memorize a target color, then find it again between near matches generated in
                LCH and validated with Delta E 2000.
              </p>
            </div>

            <div class="score-grid">
              <div class="metric-pill">
                <span class="metric-label">Score</span>
                <strong>{{ score }}</strong>
              </div>
              <div class="metric-pill">
                <span class="metric-label">Best</span>
                <strong>{{ bestScore }}</strong>
              </div>
              <div class="metric-pill">
                <span class="metric-label">Delta E</span>
                <strong>{{ formattedDelta }}</strong>
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="card-body">
            <div class="status-row">
              <div class="status-chip" :class="statusChipClass">{{ phaseLabel }}</div>
              <p class="round-label">Round {{ round }}</p>
            </div>

            <transition name="fade-scale" mode="out-in">
              <div :key="phase === 'memorize' ? 'target' : 'recall'" class="target-panel">
                <div class="target-copy">
                  <p class="target-eyebrow">{{ targetEyebrow }}</p>
                  <h2 class="target-title">{{ targetTitle }}</h2>
                  <p class="target-description">{{ helperText }}</p>
                </div>

                <div
                  class="target-swatch-frame"
                  :class="{ 'target-swatch-frame--masked': phase !== 'memorize' }"
                >
                  <div
                    class="target-swatch"
                    :class="{ 'target-swatch--hidden': phase !== 'memorize' }"
                    :style="phase === 'memorize' ? { backgroundColor: targetCss } : undefined"
                  >
                    <span v-if="phase !== 'memorize'">Pick the exact match</span>
                  </div>
                </div>
              </div>
            </transition>

            <transition name="fade-up" mode="out-in">
              <div v-if="phase === 'memorize'" key="waiting" class="waiting-panel">
                <p>Choices appear after 1.5 seconds. Focus on hue, brightness, and saturation.</p>
              </div>

              <div v-else key="choices" class="choice-grid">
                <q-btn
                  v-for="(option, index) in options"
                  :key="option.id"
                  unelevated
                  no-caps
                  class="choice-btn"
                  :class="choiceClass(option)"
                  :aria-disabled="phase !== 'choose'"
                  :aria-label="`Choice ${index + 1}`"
                  @click="handleChoice(option)"
                >
                  <span class="choice-index">0{{ index + 1 }}</span>
                  <span class="choice-swatch" :style="{ backgroundColor: option.cssValue }" />
                </q-btn>
              </div>
            </transition>
          </q-card-section>
        </q-card>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import Color from 'colorjs.io'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { useMeta } from 'quasar'

const MEMORIZE_MS = 1500
const FEEDBACK_MS = 1050
const INITIAL_DELTA_E = 15
const MIN_DELTA_E = 2
const DIFFICULTY_FACTOR = 0.9
const TARGET_MAX_ATTEMPTS = 180
const DISTRACTOR_MAX_ATTEMPTS = 48
const BINARY_SEARCH_STEPS = 18

useMeta(() => ({
  title: 'Delta - E',
  meta: {
    description: {
      name: 'description',
      content:
        'Delta - E is a minimalist Quasar puzzle based on color memory and perceptual color difference.',
    },
  },
}))

const phase = ref('memorize')
const feedbackTone = ref('')
const score = ref(0)
const bestScore = ref(0)
const round = ref(0)
const difficultyDelta = ref(INITIAL_DELTA_E)
const selectedOptionId = ref(null)

const targetColor = shallowRef(null)
const options = ref([])

const timers = []

const formattedDelta = computed(() => formatDelta(difficultyDelta.value))

const phaseLabel = computed(() => {
  if (phase.value === 'memorize') {
    return 'Memorize'
  }

  if (feedbackTone.value === 'correct') {
    return 'Correct'
  }

  if (feedbackTone.value === 'wrong') {
    return 'Missed'
  }

  return 'Choose'
})

const statusChipClass = computed(() => ({
  'status-chip--memorize': phase.value === 'memorize',
  'status-chip--choose': phase.value === 'choose',
  'status-chip--correct': feedbackTone.value === 'correct',
  'status-chip--wrong': feedbackTone.value === 'wrong',
}))

const targetCss = computed(() => {
  if (!targetColor.value) {
    return 'transparent'
  }

  return toCssColor(targetColor.value)
})

const targetEyebrow = computed(() => {
  if (phase.value === 'memorize') {
    return 'Target Color'
  }

  if (feedbackTone.value === 'correct') {
    return 'Round Cleared'
  }

  if (feedbackTone.value === 'wrong') {
    return 'Round Lost'
  }

  return 'Recall Phase'
})

const targetTitle = computed(() => {
  if (phase.value === 'memorize') {
    return 'Lock this color in memory.'
  }

  if (feedbackTone.value === 'correct') {
    return 'Exact match. The next round gets tighter.'
  }

  if (feedbackTone.value === 'wrong') {
    return 'That was not the original target.'
  }

  return 'Which swatch is the original color?'
})

const helperText = computed(() => {
  if (phase.value === 'memorize') {
    return 'The target is generated in LCH and stays visible for 1.5 seconds before the options appear.'
  }

  if (feedbackTone.value === 'correct') {
    return `Score increased to ${score.value}. Delta E tightens to ${formattedDelta.value} on the next round.`
  }

  if (feedbackTone.value === 'wrong') {
    return `Score resets to 0 and difficulty returns to Delta E ${formatDelta(INITIAL_DELTA_E)}.`
  }

  return `Only one option is identical to the target. The distractors are tuned around Delta E ${formattedDelta.value}.`
})

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

function wrapHue(value) {
  return ((value % 360) + 360) % 360
}

function formatDelta(value) {
  return Number(value.toFixed(1)).toString()
}

function shuffle(items) {
  const cloned = [...items]

  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]]
  }

  return cloned
}

function queueTimeout(callback, delay) {
  const timerId = window.setTimeout(callback, delay)
  timers.push(timerId)
}

function clearTimers() {
  while (timers.length) {
    window.clearTimeout(timers.pop())
  }
}

function toCssColor(color) {
  return color.to('srgb').toString({
    precision: 3,
    inGamut: true,
  })
}

function createTargetColor() {
  for (let attempt = 0; attempt < TARGET_MAX_ATTEMPTS; attempt += 1) {
    const candidate = new Color('lch', [
      randomBetween(28, 82),
      randomBetween(18, 88),
      randomBetween(0, 360),
    ])

    if (candidate.to('srgb').inGamut()) {
      return candidate
    }
  }

  return new Color('lch', [56, 42, randomBetween(0, 360)]).to('srgb').toGamut('srgb').to('lch')
}

function createProbeColor(target) {
  const [lightness, chroma, hue] = target.coords
  const probe = new Color('lch', [
    clamp(lightness + randomBetween(18, 36) * randomSign(), 18, 90),
    clamp(chroma + randomBetween(16, 40) * randomSign(), 8, 98),
    wrapHue(hue + randomBetween(32, 150) * randomSign()),
  ])

  return probe.to('srgb').toGamut('srgb').to('lch')
}

function randomSign() {
  return Math.random() < 0.5 ? -1 : 1
}

function isDistinctFromExisting(candidate, existingColors, desiredDelta) {
  if (!existingColors.length) {
    return true
  }

  const minimumSpacing = Math.max(6, desiredDelta * 0.42)
  return existingColors.every((existingColor) => existingColor.deltaE2000(candidate) >= minimumSpacing)
}

function findDistractorColor(target, desiredDelta, existingColors = []) {
  const tolerance = Math.max(0.9, desiredDelta * 0.12)
  let bestCandidate = null
  let bestGap = Number.POSITIVE_INFINITY

  for (let attempt = 0; attempt < DISTRACTOR_MAX_ATTEMPTS; attempt += 1) {
    const probe = createProbeColor(target)

    if (target.deltaE2000(probe) <= desiredDelta + tolerance) {
      continue
    }

    let lowerBound = 0
    let upperBound = 1

    for (let step = 0; step < BINARY_SEARCH_STEPS; step += 1) {
      const mixRatio = (lowerBound + upperBound) / 2
      const candidate = target
        .mix(probe, mixRatio, {
          space: 'lch',
          outputSpace: 'srgb',
          hue: 'shorter',
        })
        .to('srgb')
        .toGamut('srgb')
        .to('lch')
      const measuredDelta = target.deltaE2000(candidate)
      const deltaGap = Math.abs(measuredDelta - desiredDelta)

      if (isDistinctFromExisting(candidate, existingColors, desiredDelta) && deltaGap < bestGap) {
        bestCandidate = candidate
        bestGap = deltaGap
      }

      if (measuredDelta < desiredDelta) {
        lowerBound = mixRatio
      } else {
        upperBound = mixRatio
      }
    }

    if (bestCandidate && bestGap <= tolerance) {
      return bestCandidate
    }
  }

  if (bestCandidate) {
    return bestCandidate
  }

  const fallback = new Color('lch', [
    clamp(target.coords[0] + desiredDelta * 0.8, 18, 90),
    clamp(target.coords[1] + desiredDelta * 0.6, 8, 98),
    wrapHue(target.coords[2] + 48),
  ])

  return fallback.to('srgb').toGamut('srgb').to('lch')
}

function createFallbackDistractor(target, desiredDelta, variantIndex) {
  const hueOffset = variantIndex === 0 ? 48 : 126
  const fallback = new Color('lch', [
    clamp(target.coords[0] + desiredDelta * (variantIndex === 0 ? 0.8 : -0.65), 18, 90),
    clamp(target.coords[1] + desiredDelta * (variantIndex === 0 ? 0.6 : 0.4), 8, 98),
    wrapHue(target.coords[2] + hueOffset),
  ])

  return fallback.to('srgb').toGamut('srgb').to('lch')
}

function buildOptions(target, desiredDelta) {
  const distractorColors = []
  let attempts = 0

  while (distractorColors.length < 2 && attempts < 8) {
    const distractor = findDistractorColor(target, desiredDelta, distractorColors)
    if (isDistinctFromExisting(distractor, distractorColors, desiredDelta)) {
      distractorColors.push(distractor)
    }
    attempts += 1
  }

  while (distractorColors.length < 2) {
    const fallbackDistractor = createFallbackDistractor(target, desiredDelta, distractorColors.length)
    distractorColors.push(fallbackDistractor)
  }

  const preparedOptions = [
    {
      id: `round-${round.value}-target`,
      cssValue: toCssColor(target),
      isCorrect: true,
    },
    ...distractorColors.map((distractor, index) => ({
      id: `round-${round.value}-distractor-${index + 1}`,
      cssValue: toCssColor(distractor),
      isCorrect: false,
    })),
  ]

  return shuffle(preparedOptions)
}

function startRound() {
  clearTimers()
  round.value += 1
  phase.value = 'memorize'
  feedbackTone.value = ''
  selectedOptionId.value = null

  const nextTarget = createTargetColor()
  targetColor.value = nextTarget
  options.value = buildOptions(nextTarget, difficultyDelta.value)

  queueTimeout(() => {
    phase.value = 'choose'
  }, MEMORIZE_MS)
}

function handleChoice(option) {
  if (phase.value !== 'choose') {
    return
  }

  selectedOptionId.value = option.id
  phase.value = 'feedback'

  if (option.isCorrect) {
    feedbackTone.value = 'correct'
    score.value += 1
    bestScore.value = Math.max(bestScore.value, score.value)
    difficultyDelta.value = Math.max(MIN_DELTA_E, difficultyDelta.value * DIFFICULTY_FACTOR)
  } else {
    feedbackTone.value = 'wrong'
    score.value = 0
    difficultyDelta.value = INITIAL_DELTA_E
  }

  queueTimeout(() => {
    startRound()
  }, FEEDBACK_MS)
}

function choiceClass(option) {
  return {
    'choice-btn--interactive': phase.value === 'choose',
    'choice-btn--locked': phase.value !== 'choose',
    'choice-btn--selected': selectedOptionId.value === option.id,
    'choice-btn--correct': phase.value === 'feedback' && option.isCorrect,
    'choice-btn--wrong': phase.value === 'feedback' && selectedOptionId.value === option.id && !option.isCorrect,
    'choice-btn--dimmed': phase.value === 'feedback' && feedbackTone.value === 'correct' && !option.isCorrect,
  }
}

onMounted(() => {
  startRound()
})

onBeforeUnmount(() => {
  clearTimers()
})
</script>

<style scoped lang="scss" src="../css/pages/delta-e/delta-e-page.scss"></style>
