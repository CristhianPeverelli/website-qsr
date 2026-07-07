<template>
  <q-page class="portfolio-page">
    <section
      id="home"
      data-section
      class="portfolio-section hero-section"
      aria-labelledby="hero-title"
    >
      <InteractiveIcosahedron class="hero-icosahedron" />

      <div class="section-shell hero-shell">
        <div class="hero-copy">
          <p class="section-kicker">Portfolio / Italy / 2026</p>
          <h1 id="hero-title" class="hero-title">Cristhian Peverelli</h1>
          <p class="hero-role">
            Computer Science graduate focused on web development, IT systems and security-minded
            software.
          </p>
          <p class="hero-lead">
            I build practical digital products with clean interfaces, solid code and a careful eye
            for how people actually use them.
          </p>

          <div class="hero-actions" aria-label="Primary actions">
            <q-btn
              unelevated
              no-caps
              color="primary"
              icon-right="south_east"
              label="Selected work"
              class="pill-btn"
              @click="scrollTo('projects')"
            />
            <q-btn
              outline
              no-caps
              color="primary"
              icon="mail"
              label="Contact"
              class="pill-btn"
              @click="scrollTo('contact')"
            />
          </div>
        </div>

        <aside class="hero-signals" aria-label="Profile highlights">
          <div v-for="signal in heroSignals" :key="signal.label" class="hero-signal">
            <span>{{ signal.label }}</span>
            <strong>{{ signal.value }}</strong>
          </div>
        </aside>
      </div>

      <div class="section-shell hero-footer">
        <a href="#projects" class="scroll-cue" @click.prevent="scrollTo('projects')">
          <span>Explore</span>
          <q-icon name="keyboard_arrow_down" size="20px" />
        </a>
      </div>
    </section>

    <section id="projects" data-section class="portfolio-section" aria-labelledby="projects-title">
      <div class="section-shell">
        <header class="section-header">
          <p class="section-kicker">Selected projects</p>
        </header>

        <div class="projects-list">
          <article
            v-for="(project, index) in featuredProjects"
            :key="project.title"
            class="project-row"
          >
            <span class="project-index">{{ formatIndex(index) }}</span>

            <div class="project-main">
              <p class="project-meta">{{ project.category }} / {{ project.status }}</p>
              <h3 class="project-title">{{ project.title }}</h3>
              <p class="project-summary">{{ project.summary }}</p>

              <div class="project-stack" aria-label="Project stack">
                <span v-for="tech in project.stack" :key="`${project.title}-${tech}`">
                  {{ tech }}
                </span>
              </div>
            </div>

            <div class="project-actions">
              <q-btn
                v-if="project.live || project.liveRoute"
                flat
                round
                color="primary"
                icon="open_in_new"
                :aria-label="`Open ${project.title}`"
                :href="project.live || undefined"
                :to="project.liveRoute || undefined"
                :target="project.live ? '_blank' : undefined"
                :rel="project.live ? 'noopener' : undefined"
              />
              <q-btn
                flat
                round
                color="primary"
                icon="code"
                :aria-label="`Open ${project.title} source code`"
                :href="project.repo"
                target="_blank"
                rel="noopener"
              />
            </div>
          </article>
        </div>
      </div>
    </section>

    <section id="stack" data-section class="portfolio-section" aria-labelledby="stack-title">
      <div class="section-shell">
        <header class="section-header">
          <p class="section-kicker">Stack</p>
        </header>

        <article v-for="group in stackGroups" :key="group.title" class="stack-group">
          <q-icon :name="group.icon" size="22px" />
          <h3>{{ group.title }}</h3>
          <p>{{ group.description }}</p>
          <ul>
            <li v-for="item in group.items" :key="item">{{ item }}</li>
          </ul>
        </article>
      </div>
    </section>

    <section id="journey" data-section class="portfolio-section" aria-labelledby="journey-title">
      <div class="section-shell">
        <header class="section-header">
          <p class="section-kicker">Education</p>
        </header>

        <div class="journey-list">
          <article v-for="item in journeyItems" :key="item.title" class="journey-item">
            <span>{{ item.period }}</span>
            <div>
              <h3>{{ item.title }}</h3>
              <p class="journey-place">{{ item.place }}</p>
              <p>{{ item.description }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section
      id="contact"
      data-section
      class="portfolio-section contact-section"
      aria-labelledby="contact-title"
    >
      <div class="section-shell contact-shell">
        <div>
          <p class="section-kicker">Contact</p>
          <h2 id="contact-title" class="section-title">Open to good technical conversations :)</h2>
        </div>

        <div class="contact-actions">
          <a class="contact-link" href="mailto:cristhian.peverelli@gmail.com">
            <q-icon name="mail" size="20px" />
            <span>Email</span>
          </a>
          <a
            class="contact-link"
            href="https://www.linkedin.com/in/cristhian-peverelli/"
            target="_blank"
            rel="noopener"
          >
            <q-icon name="business_center" size="20px" />
            <span>LinkedIn</span>
          </a>
          <a
            class="contact-link"
            href="https://github.com/CristhianPeverelli"
            target="_blank"
            rel="noopener"
          >
            <q-icon name="terminal" size="20px" />
            <span>GitHub</span>
          </a>
          <button type="button" class="contact-link contact-link--button" @click="copyEmail">
            <q-icon name="content_copy" size="20px" />
            <span>{{ emailCopied ? 'Copied' : 'Copy email' }}</span>
          </button>
        </div>
      </div>
    </section>

    <footer class="portfolio-footer">
      <div class="section-shell footer-content">
        <p>&copy; {{ currentYear }} Cristhian Peverelli</p>
        <div class="footer-links" aria-label="Footer links">
          <router-link to="/privacy">Privacy &amp; cookies</router-link>
          <span>Vue 3 / Quasar / interactive canvas</span>
        </div>
      </div>
    </footer>

    <q-page-sticky
      v-show="showBackToTop"
      position="bottom-right"
      :offset="[18, 18]"
      class="back-to-top-sticky"
    >
      <q-btn
        round
        unelevated
        color="primary"
        icon="north"
        aria-label="Back to top"
        @click.stop.prevent="scrollToTop"
      />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useMeta } from 'quasar'
import InteractiveIcosahedron from 'src/components/InteractiveIcosahedron.vue'

useMeta(() => ({
  title: 'Cristhian Peverelli - Portfolio',
  meta: {
    description: {
      name: 'description',
      content:
        'Portfolio of Cristhian Peverelli, Computer Science graduate focused on web development, IT systems, cybersecurity and practical software projects.',
    },
    keywords: {
      name: 'keywords',
      content:
        'Cristhian Peverelli, portfolio, software developer, Vue, Quasar, IT, cybersecurity, web development',
    },
  },
}))

const heroSignals = [
  { label: 'Focus', value: 'Web, IT, Security' },
  { label: 'Base', value: 'Italy' },
  { label: 'Mode', value: 'Build, test, iterate' },
]

const featuredProjects = [
  {
    title: 'Labyrinthus',
    category: 'Game development',
    status: 'Main project',
    summary:
      'A browser dungeon crawler with procedural rooms, weapon choices, upgrades and score-driven runs.',
    stack: ['Vue 3', 'Quasar', 'Canvas', 'Game logic'],
    liveRoute: '/labyrinthus',
    repo: 'https://github.com/CristhianPeverelli/website-qsr',
  },
  {
    title: 'Delta - E',
    category: 'Interactive web',
    status: 'Experimental puzzle',
    summary:
      'A compact color-memory game using perceptual color distance to validate choices and pace the challenge.',
    stack: ['Vue 3', 'colorjs.io', 'SCSS', 'UX'],
    liveRoute: '/delta-e',
    repo: 'https://github.com/CristhianPeverelli/website-qsr',
  },
  {
    title: 'Timer',
    category: 'Event utility',
    status: 'Production tool',
    summary:
      'A distraction-free speaker timer with fullscreen mode, visible progress, final warning and overrun count.',
    stack: ['Vue 3', 'Quasar', 'Fullscreen API', 'UX'],
    liveRoute: '/timer',
    repo: 'https://github.com/CristhianPeverelli/website-qsr',
  },
  {
    title: 'Pevefast',
    category: '3D prototype',
    status: 'Playable demo',
    summary:
      'A Unity WebGL endless runner focused on speed, immediate controls and arcade-style progression.',
    stack: ['Unity', 'C#', 'Blender', 'WebGL'],
    live: 'https://cristhianpeverelli.github.io/pevefast/',
    repo: 'https://github.com/CristhianPeverelli/Pevefast-scripts',
  },
  {
    title: 'Algorithm archive',
    category: 'Computer science',
    status: 'Practice repository',
    summary:
      'Readable solutions and exercises used to train data structures, reasoning and implementation discipline.',
    stack: ['Golang', 'Java', 'Algorithms'],
    repo: 'https://github.com/CristhianPeverelli/leetcode',
  },
]

const stackGroups = [
  {
    title: 'Frontend',
    icon: 'design_services',
    description:
      'Interfaces with clear hierarchy, responsive behavior and maintainable components.',
    items: ['Vue 3', 'Quasar', 'JavaScript', 'HTML', 'SCSS'],
  },
  {
    title: 'Backend and data',
    icon: 'dns',
    description: 'Core programming and data reasoning for robust application logic.',
    items: ['Java', 'Golang', 'SQL', 'REST fundamentals'],
  },
  {
    title: 'Systems and security',
    icon: 'shield',
    description:
      'A practical interest in diagnostics, Linux environments and security-aware choices.',
    items: ['Linux', 'IT support', 'Networking basics', 'Cybersecurity learning'],
  },
  {
    title: 'Creative tech',
    icon: 'view_in_ar',
    description:
      'Interactive prototypes, game systems and visual experiments with technical constraints.',
    items: ['Canvas', 'Unity', 'C#', 'Blender'],
  },
]

const journeyItems = [
  {
    period: '2021 - 2025',
    title: 'Bachelor in Computer Science',
    place: 'University of Milan "La Statale"',
    description:
      'Academic work across software engineering, algorithms, databases and system fundamentals.',
  },
  {
    period: '2016 - 2021',
    title: 'Computer Science diploma',
    place: 'ITIS Emilio Alessandrini, Vittuone',
    description: 'Early technical path through programming, networks and IT foundations.',
  },
  {
    period: 'Ongoing',
    title: 'Independent project work',
    place: 'Personal projects and public repositories',
    description:
      'Continuous practice through browser games, portfolio systems, coding challenges and experiments.',
  },
]

const emailCopied = ref(false)
const scrollPosition = ref(0)
const currentYear = new Date().getFullYear()

const showBackToTop = computed(() => scrollPosition.value > 760)

function formatIndex(index) {
  return String(index + 1).padStart(2, '0')
}

function scrollTo(id) {
  const target = document.getElementById(id)
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function scrollToTop() {
  const scrollOptions = { top: 0, left: 0, behavior: 'smooth' }
  const scrollTargets = [document.scrollingElement, document.documentElement, document.body]

  window.scrollTo(scrollOptions)
  scrollTargets.forEach((target) => {
    if (target?.scrollTo) {
      target.scrollTo(scrollOptions)
    } else if (target) {
      target.scrollTop = 0
    }
  })

  scrollPosition.value = 0
}

async function copyEmail() {
  const email = 'cristhian.peverelli@gmail.com'

  try {
    await navigator.clipboard.writeText(email)
  } catch {
    const input = document.createElement('input')
    input.value = email
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
  }

  emailCopied.value = true
  window.setTimeout(() => {
    emailCopied.value = false
  }, 1800)
}

function onWindowScroll() {
  scrollPosition.value = window.scrollY || 0
}

onMounted(() => {
  onWindowScroll()
  window.addEventListener('scroll', onWindowScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onWindowScroll)
})
</script>

<style scoped lang="scss" src="../css/pages/index/index-page.scss"></style>
