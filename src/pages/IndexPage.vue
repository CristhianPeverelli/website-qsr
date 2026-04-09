<template>
  <q-page class="portfolio-page">
    <div class="bg-orb orb-a" />
    <div class="bg-orb orb-b" />

    <section id="home" data-section class="portfolio-section hero-section">
      <div class="section-shell hero-grid">
        <div class="hero-copy">
          <p class="section-kicker">Computer Science and Software Development</p>
          <h1 class="hero-title">
            It doesn't matter who disappears, everyone is interested in the man who comes out on the
            other side.
          </h1>
          <div class="hero-intro">
            <div class="surface-card hero-portrait">
              <img
                class="hero-portrait__image"
                :src="profilePhoto"
                alt="Portrait of Cristhian Peverelli"
              />
            </div>
            <p class="hero-lead">
              I am Cristhian Peverelli, a developer and IT technician from Italy. I design and ship
              software with clean architecture, maintainable code, and polished user experience.
            </p>
          </div>

          <div class="hero-actions">
            <q-btn
              unelevated
              no-caps
              color="primary"
              label="View projects"
              class="pill-btn"
              @click="scrollTo('projects')"
            />
            <q-btn
              outline
              no-caps
              color="primary"
              label="Start a conversation"
              class="pill-btn"
              @click="scrollTo('contact')"
            />
            <q-btn
              unelevated
              no-caps
              color="secondary"
              label="Play my games"
              class="pill-btn"
              @click="toggleGamePanel"
            />
          </div>

          <div class="quick-links">
            <q-btn
              flat
              no-caps
              icon="code"
              label="GitHub"
              href="https://github.com/CristhianPeverelli"
              target="_blank"
              rel="noopener"
            />
            <q-btn
              flat
              no-caps
              icon="business_center"
              label="LinkedIn"
              href="https://www.linkedin.com/in/cristhian-peverelli/"
              target="_blank"
              rel="noopener"
            />
            <q-btn flat no-caps icon="mail" label="Email" @click="scrollTo('contact')" />
          </div>
        </div>

        <div class="hero-side">
          <InteractiveIcosahedron />
          <p class="hero-icosa-note">A living icosahedron inspired by fantasy RPG dices.</p>
        </div>
      </div>
    </section>

    <section id="about" data-section class="portfolio-section">
      <div class="section-shell">
        <header class="section-header">
          <p class="section-kicker">About</p>
          <h2 class="section-title">Engineering mindset with practical delivery.</h2>
        </header>

        <div class="about-grid">
          <q-card flat class="surface-card about-card">
            <q-card-section>
              <p>
                I enjoy building useful software and continuously improving systems already in
                production. My work style combines technical rigor with a strong focus on product
                goals.
              </p>
              <p>
                I have hands-on experience with frontend frameworks, backend fundamentals,
                algorithms, and IT operations. I care about writing code that teams can understand,
                test, and scale.
              </p>
            </q-card-section>
          </q-card>

          <q-card flat class="surface-card services-card">
            <q-card-section>
              <h3 class="card-title">What I can help with</h3>
              <q-list separator>
                <q-item v-for="service in serviceItems" :key="service.title">
                  <q-item-section avatar>
                    <q-icon :name="service.icon" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="service-title">{{ service.title }}</q-item-label>
                    <q-item-label caption>{{ service.description }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </section>

    <section id="skills" data-section class="portfolio-section">
      <div class="section-shell">
        <header class="section-header">
          <p class="section-kicker">Skills</p>
          <h2 class="section-title">Technical toolbox</h2>
        </header>

        <q-tabs
          v-model="activeSkillCategory"
          dense
          no-caps
          inline-label
          class="skill-tabs"
          active-color="primary"
          indicator-color="primary"
          outside-arrows
          mobile-arrows
        >
          <q-tab
            v-for="category in skillCategories"
            :key="category.id"
            :name="category.id"
            :icon="category.icon"
            :label="category.label"
          />
        </q-tabs>

        <div class="skills-grid">
          <q-card
            v-for="skill in filteredSkills"
            :key="skill.name"
            flat
            class="surface-card skill-card"
          >
            <q-card-section>
              <div class="skill-row">
                <p class="skill-name">{{ skill.name }}</p>
                <p class="skill-level">{{ skill.level }}%</p>
              </div>
              <q-linear-progress rounded size="9px" :value="skill.level / 100" color="primary" />
              <p class="skill-note">{{ skill.note }}</p>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </section>

    <section id="experience" data-section class="portfolio-section">
      <div class="section-shell">
        <header class="section-header">
          <p class="section-kicker">Journey</p>
          <h2 class="section-title">Education and milestones</h2>
        </header>

        <div class="experience-grid">
          <q-card flat class="surface-card timeline-card">
            <q-card-section>
              <q-timeline color="primary">
                <q-timeline-entry
                  v-for="item in timelineItems"
                  :key="item.title"
                  :title="item.title"
                  :subtitle="item.period"
                >
                  <p class="timeline-org">{{ item.organization }}</p>
                  <p class="timeline-text">{{ item.description }}</p>
                </q-timeline-entry>
              </q-timeline>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </section>

    <section id="projects" data-section class="portfolio-section">
      <div class="section-shell">
        <header class="section-header">
          <p class="section-kicker">Portfolio</p>
          <h2 class="section-title">Selected projects</h2>
        </header>

        <div class="project-controls">
          <div class="project-filters">
            <q-chip
              v-for="filter in projectFilters"
              :key="filter.id"
              clickable
              square
              class="filter-chip"
              :class="{ 'filter-chip--active': activeProjectFilter === filter.id }"
              @click="activeProjectFilter = filter.id"
            >
              {{ filter.label }}
            </q-chip>
          </div>

          <q-input
            v-model="projectSearch"
            dense
            outlined
            clearable
            debounce="250"
            label="Search project, stack or keyword"
            class="project-search"
            color="primary"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <div class="projects-grid">
          <q-card
            v-for="project in filteredProjects"
            :key="project.title"
            flat
            class="surface-card project-card"
          >
            <div class="project-ribbon" :class="`project-ribbon--${project.category}`" />

            <q-card-section>
              <div class="project-head">
                <p class="project-category">{{ categoryLabel(project.category) }}</p>
                <q-badge color="secondary" text-color="white" outline>{{ project.status }}</q-badge>
              </div>

              <h3 class="project-title">{{ project.title }}</h3>
              <p class="project-summary">{{ project.summary }}</p>

              <div class="project-stack">
                <q-chip
                  v-for="tech in project.stack"
                  :key="`${project.title}-${tech}`"
                  dense
                  square
                  class="stack-chip"
                >
                  {{ tech }}
                </q-chip>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-actions class="project-actions">
              <q-btn
                v-if="project.live || project.liveRoute"
                flat
                no-caps
                color="primary"
                icon="open_in_new"
                :label="project.liveLabel || 'Live'"
                :href="project.live || undefined"
                :to="project.liveRoute || undefined"
                :target="project.live ? '_blank' : undefined"
                :rel="project.live ? 'noopener' : undefined"
              />
              <q-btn
                flat
                no-caps
                color="primary"
                icon="code"
                label="Source"
                :href="project.repo"
                target="_blank"
                rel="noopener"
              />
            </q-card-actions>
          </q-card>
        </div>

        <p v-if="!filteredProjects.length" class="empty-state">
          No project matches this filter yet. Try changing category or search keyword.
        </p>
      </div>
    </section>

    <section id="contact" data-section class="portfolio-section">
      <div class="section-shell">
        <header class="section-header">
          <p class="section-kicker">Contact</p>
          <h2 class="section-title">Don't be scared to reach out.</h2>
        </header>

        <div class="contact-grid">
          <q-card flat class="surface-card contact-card">
            <q-card-section>
              <h3 class="card-title">Usefuls channels</h3>

              <div class="contact-list">
                <a class="contact-item" href="mailto:cristhian.peverelli@gmail.com">
                  <q-icon name="mail" size="20px" />
                  <span>cristhian [dot] peverelli [at] gmail [dot] com</span>
                </a>
                <a
                  class="contact-item"
                  href="https://www.linkedin.com/in/cristhian-peverelli/"
                  target="_blank"
                  rel="noopener"
                >
                  <q-icon name="work" size="20px" />
                  <span>LinkedIn profile</span>
                </a>
                <a
                  class="contact-item"
                  href="https://github.com/CristhianPeverelli"
                  target="_blank"
                  rel="noopener"
                >
                  <q-icon name="terminal" size="20px" />
                  <span>GitHub repositories</span>
                </a>
              </div>

              <div class="contact-actions">
                <q-btn
                  flat
                  no-caps
                  color="primary"
                  icon="content_copy"
                  :label="emailCopied ? 'Email copied' : 'Copy email'"
                  @click="copyEmail"
                />
              </div>
            </q-card-section>
          </q-card>

          <q-card flat class="surface-card form-card">
            <q-card-section>
              <h3 class="card-title">Quick message</h3>

              <q-form class="contact-form" @submit.prevent="openMailDraft">
                <q-input
                  v-model="contactForm.name"
                  dense
                  outlined
                  label="Your name"
                  :rules="[requiredRule]"
                />
                <q-input
                  v-model="contactForm.email"
                  dense
                  outlined
                  label="Your email"
                  :rules="[requiredRule, emailRule]"
                />
                <q-input
                  v-model="contactForm.subject"
                  dense
                  outlined
                  label="Subject"
                  :rules="[requiredRule]"
                />
                <q-input
                  v-model="contactForm.message"
                  type="textarea"
                  autogrow
                  outlined
                  label="Message"
                  :rules="[requiredRule]"
                />

                <div class="form-actions">
                  <q-btn
                    type="submit"
                    no-caps
                    unelevated
                    color="primary"
                    :label="submitButtonLabel"
                  />
                  <q-btn flat no-caps color="primary" label="Reset" @click="resetContactForm" />
                </div>
              </q-form>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </section>

    <footer class="portfolio-footer">
      <div class="section-shell footer-content">
        <p>&copy; {{ currentYear }} Cristhian Peverelli</p>
        <p>Built with Vue 3 and Quasar</p>
      </div>
    </footer>

    <q-dialog v-model="gamePanelOpen">
      <q-card flat class="surface-card games-panel">
        <q-card-section class="games-panel__head">
          <p class="games-panel__kicker">Playable games</p>
          <q-btn flat class="games-panel__close-btn" :icon="'close'" @click="toggleGamePanel" />
          <p class="games-panel__text">
            A catalog of some browser-ready games I've developed. You can try them out directly or
            check their repositories for code reference.
          </p>
        </q-card-section>

        <q-card-section class="games-panel__body">
          <div class="games-panel__grid">
            <q-card
              v-for="game in playableGames"
              :key="game.id"
              flat
              class="games-panel-card"
              :class="`games-panel-card--${game.theme}`"
            >
              <q-card-section>
                <div class="games-panel-card__head">
                  <p class="games-panel-card__eyebrow">{{ game.label }}</p>
                  <q-badge color="secondary" text-color="white" outline>{{ game.badge }}</q-badge>
                </div>

                <h4 class="games-panel-card__title">{{ game.title }}</h4>
                <p class="games-panel-card__description">{{ game.description }}</p>

                <div class="games-panel-card__actions">
                  <q-btn
                    unelevated
                    no-caps
                    color="primary"
                    :icon="game.actionIcon"
                    :label="game.actionLabel"
                    @click="selectGame(game)"
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-page-sticky v-show="showBackToTop" position="bottom-right" :offset="[18, 18]">
      <q-btn
        round
        unelevated
        color="primary"
        icon="north"
        aria-label="Back to top"
        @click="scrollTo('home')"
      />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useMeta } from 'quasar'
import { useRouter } from 'vue-router'
import InteractiveIcosahedron from 'src/components/InteractiveIcosahedron.vue'
import profilePhoto from 'src/assets/profile-photo.jpg'

const router = useRouter()

useMeta(() => ({
  title: 'Cristhian Peverelli',
  meta: {
    description: {
      name: 'description',
      content:
        'Portfolio of Cristhian Peverelli, software developer and IT technician focused on robust and user-oriented digital products.',
    },
    keywords: {
      name: 'keywords',
      content: 'Cristhian Peverelli, portfolio, software developer, Vue, Quasar, IT technician',
    },
  },
}))

const serviceItems = [
  {
    icon: 'web',
    title: 'Web Application Development',
    description: 'Vue and Quasar interfaces with responsive design and clear user flows.',
  },
  {
    icon: 'settings_suggest',
    title: 'Technical Problem Solving',
    description: 'Debugging, optimization, and structured refactoring for existing codebases.',
  },
  {
    icon: 'memory',
    title: 'Computer Science Foundations',
    description: 'Algorithms, data structures, and rigorous implementation practices.',
  },
]

const skillCategories = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'frontend', label: 'Frontend', icon: 'design_services' },
  { id: 'backend', label: 'Backend', icon: 'dns' },
  { id: 'languages', label: 'Languages', icon: 'code' },
  { id: 'tools', label: 'Tools', icon: 'build' },
]

const skillItems = [
  {
    name: 'Vue 3 + Quasar',
    level: 88,
    category: 'frontend',
    note: 'Component architecture and UI systems.',
  },
  {
    name: 'HTML + SCSS',
    level: 90,
    category: 'frontend',
    note: 'Semantic markup, responsive layouts, and styling.',
  },
  {
    name: 'JavaScript',
    level: 86,
    category: 'languages',
    note: 'Modern syntax, asynchronous flows, and tooling.',
  },
  {
    name: 'C#',
    level: 78,
    category: 'languages',
    note: 'Game and app scripting in Unity environments.',
  },
  {
    name: 'Java',
    level: 74,
    category: 'languages',
    note: 'Object-oriented design and problem solving.',
  },
  {
    name: 'Golang',
    level: 70,
    category: 'languages',
    note: 'Learning practical backend-oriented patterns.',
  },
  { name: 'SQL', level: 67, category: 'backend', note: 'Query design and database reasoning.' },
  {
    name: 'Git + GitHub',
    level: 84,
    category: 'tools',
    note: 'Branching, repository management, and collaboration.',
  },
  {
    name: 'Unity + Blender',
    level: 76,
    category: 'tools',
    note: '3D game production and content integration.',
  },
  {
    name: 'Linux + IT Support',
    level: 80,
    category: 'backend',
    note: 'Troubleshooting and system-level diagnostics.',
  },
]

const timelineItems = [
  {
    title: 'Bachelor in Computer Science',
    period: '2021 - 2025',
    organization: 'University of Milan "La Statale"',
    description:
      'Academic training in software engineering, algorithms, data management, and systems.',
  },
  {
    title: 'High School CS Diploma',
    period: '2016 - 2021',
    organization: 'ITIS Emilio Alessandrini, Vittuone',
    description: 'Early technical specialization in computing and IT fundamentals.',
  },
  {
    title: 'Independent Project Work',
    period: 'Ongoing',
    organization: 'Personal portfolio and coding platforms',
    description:
      'Continuous practice through projects, coding challenges, and iterative improvements.',
  },
]

const projectFilters = [
  { id: 'all', label: 'All' },
  { id: 'game', label: 'Game Dev' },
  { id: 'web', label: 'Web Apps' },
  { id: 'algorithms', label: 'Algorithms' },
  { id: 'hardware', label: 'Hardware' },
]

const playableGames = [
  {
    id: 'labyrinthus',
    title: 'Labyrinthus',
    label: 'Dungeon crawler',
    badge: 'Playable on site',
    description:
      'A pixel fantasy roguelite with procedural rooms, weapon loadouts, upgrades, and score-driven runs.',
    actionLabel: 'Play',
    actionIcon: 'sports_martial_arts',
    destinationType: 'route',
    destination: '/labyrinthus',
    theme: 'dungeon',
  },
  {
    id: 'delta-e',
    title: 'Delta - E',
    label: 'Color puzzle',
    badge: 'Playable on site',
    description:
      'A minimalist color-memory puzzle with LCH generation and Delta E validation, fast-paced gameplay.',
    actionLabel: 'Play',
    actionIcon: 'color_lens',
    destinationType: 'route',
    destination: '/delta-e',
    theme: 'puzzle',
  },
  {
    id: 'pevefast',
    title: 'Pevefast',
    label: 'Arcade runner',
    badge: 'WebGL demo',
    description:
      'A fast-paced 3D endless runner built in Unity, focused on speed, reflexes, and immediate browser play.',
    actionLabel: 'Play',
    actionIcon: 'directions_run',
    destinationType: 'external',
    destination: 'https://cristhianpeverelli.github.io/pevefast/',
    theme: 'runner',
  },
]

const projects = [
  {
    title: 'Labyrinthus',
    category: 'game',
    status: 'My main game project',
    summary:
      'A fantasy roguelite built into the portfolio with procedural rooms, selectable weapons, and run-based progression.',
    stack: ['Vue 3', 'Quasar', 'Canvas', 'Game Engine', 'Sprite', '2025-2026'],
    live: '',
    liveRoute: '/labyrinthus',
    liveLabel: 'Play now',
    repo: 'https://github.com/CristhianPeverelli/website-qsr',
  },
  {
    title: 'Delta - E',
    category: 'game',
    status: 'Experimental puzzle',
    summary:
      'Minimal color-memory puzzle with perceptual LCH generation and Delta E validation through colorjs.io.',
    stack: ['Vue 3', 'Quasar', 'colorjs.io', 'Canvas', 'SCSS', '2026'],
    live: '',
    liveRoute: '/delta-e',
    liveLabel: 'Play now',
    repo: 'https://github.com/CristhianPeverelli/website-qsr',
  },
  {
    title: 'Pevefast',
    category: 'game',
    status: 'Playable demo',
    summary:
      '3D endless-runner developed in Unity and exported to WebGL for instant browser access.',
    stack: ['Unity', 'C#', 'Blender', 'WebGL', '2019-2020'],
    live: 'https://cristhianpeverelli.github.io/pevefast/',
    repo: 'https://github.com/CristhianPeverelli/Pevefast-scripts',
  },
  {
    title: 'Portfolio Website',
    category: 'web',
    status: 'In active development',
    summary: 'Personal website focused on branding, interaction design, and practical utility.',
    stack: ['Vue 3', 'Quasar', 'SCSS'],
    live: '',
    repo: 'https://github.com/CristhianPeverelli/website-qsr',
  },
  {
    title: 'LeetCode Solutions',
    category: 'algorithms',
    status: 'Public repository',
    summary: 'Collection of algorithmic exercises with emphasis on clean and readable approaches.',
    stack: ['Golang', 'Problem Solving'],
    live: '',
    repo: 'https://github.com/CristhianPeverelli/leetcode',
  },
  {
    title: 'CodeWars Kata Archive',
    category: 'algorithms',
    status: 'Public repository',
    summary: 'Set of my kata solutions to train algorithmic thinking and implementation speed.',
    stack: ['Java', 'Algorithms'],
    live: '',
    repo: 'https://github.com/CristhianPeverelli/Codewars-Challenge',
  },
  {
    title: 'Tic-Tac-Toe Logic Circuit',
    category: 'hardware',
    status: 'University project',
    summary: 'Game simulation implemented only with digital logic circuits and hardware reasoning.',
    stack: ['Logisim', 'Digital Design', '2021'],
    live: '',
    repo: 'https://github.com/CristhianPeverelli/Logisim-Tris-Project',
  },
  {
    title: 'Pevefast Scripts',
    category: 'game',
    status: 'Code reference',
    summary:
      'Detailed script repository used for gameplay systems and legacy experiments on Pevefast.',
    stack: ['C#', 'Unity', '2019-2020'],
    live: '',
    repo: 'https://github.com/CristhianPeverelli/Pevefast-scripts',
  },
]

const categoryLabels = {
  web: 'Web Application',
  game: 'Game Development',
  algorithms: 'Algorithm Practice',
  hardware: 'Hardware Logic',
}

const activeSkillCategory = ref('all')
const activeProjectFilter = ref('all')
const projectSearch = ref('')
const emailCopied = ref(false)
const submitButtonLabel = ref('Open email draft')
const scrollPosition = ref(0)
const gamePanelOpen = ref(false)

const contactForm = reactive({
  name: '',
  email: '',
  subject: 'Hi! I would like to get in touch with you',
  message: '',
})

const requiredRule = (value) => Boolean(value && String(value).trim()) || 'This field is required'
const emailRule = (value) => /.+@.+\..+/.test(value) || 'Enter a valid email address'

const currentYear = new Date().getFullYear()

const filteredSkills = computed(() => {
  const category = activeSkillCategory.value
  if (category === 'all') {
    return skillItems
  }
  return skillItems.filter((item) => item.category === category)
})

const filteredProjects = computed(() => {
  const query = projectSearch.value.trim().toLowerCase()

  return projects.filter((project) => {
    const categoryMatch =
      activeProjectFilter.value === 'all' || project.category === activeProjectFilter.value

    const searchableText =
      `${project.title} ${project.summary} ${project.stack.join(' ')}`.toLowerCase()
    const queryMatch = !query || searchableText.includes(query)

    return categoryMatch && queryMatch
  })
})

const showBackToTop = computed(() => scrollPosition.value > 760)

function categoryLabel(category) {
  return categoryLabels[category] || 'Project'
}

function scrollTo(id) {
  const target = document.getElementById(id)
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function toggleGamePanel() {
  gamePanelOpen.value = !gamePanelOpen.value
}

function selectGame(game) {
  gamePanelOpen.value = false

  if (game.destinationType === 'route') {
    router.push(game.destination)
    return
  }

  window.open(game.destination, '_blank', 'noopener')
}

function onWindowScroll() {
  scrollPosition.value = window.scrollY || 0
}

async function copyEmail() {
  const email = 'cristhian.peverelli@gmail.com'

  try {
    await navigator.clipboard.writeText(email)
    emailCopied.value = true
    window.setTimeout(() => {
      emailCopied.value = false
    }, 2000)
  } catch {
    const input = document.createElement('input')
    input.value = email
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)

    emailCopied.value = true
    window.setTimeout(() => {
      emailCopied.value = false
    }, 2000)
  }
}

function openMailDraft() {
  const body = [
    `Hi Cristhian,`,
    '',
    contactForm.message,
    '',
    `Name: ${contactForm.name}`,
    `Email: ${contactForm.email}`,
  ].join('\n')

  const mailtoLink = `mailto:cristhian.peverelli@gmail.com?subject=${encodeURIComponent(contactForm.subject)}&body=${encodeURIComponent(body)}`
  window.location.href = mailtoLink

  submitButtonLabel.value = 'Draft opened'
  window.setTimeout(() => {
    submitButtonLabel.value = 'Open email draft'
  }, 2000)
}

function resetContactForm() {
  contactForm.name = ''
  contactForm.email = ''
  contactForm.subject = 'Collaboration request'
  contactForm.message = ''
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
