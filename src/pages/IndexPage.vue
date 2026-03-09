<template>
  <q-page class="portfolio-page">
    <div class="bg-orb orb-a" />
    <div class="bg-orb orb-b" />

    <section id="home" data-section class="portfolio-section hero-section">
      <div class="section-shell hero-grid">
        <div class="hero-copy">
          <p class="section-kicker">Computer Science and Software Development</p>
          <h1 class="hero-title">It doesn't matter who disappears, everyone is interested in the man who comes out on the other side.</h1>
          <p class="hero-lead">
            I am Cristhian Peverelli, a developer and IT technician from Italy. I design and ship
            software with clean architecture, maintainable code, and polished user experience.
          </p>

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
          </div>

          <div class="hero-meta">
            <q-chip color="secondary" text-color="white" icon="location_on" square>
              Milan, Italy
            </q-chip>
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
          <p class="hero-icosa-note">
            A living icosahedron inspired by fantasy worlds. Rotate it freely and shape its energy.
          </p>
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
          <q-card v-for="skill in filteredSkills" :key="skill.name" flat class="surface-card skill-card">
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
          <q-card v-for="project in filteredProjects" :key="project.title" flat class="surface-card project-card">
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
                v-if="project.live"
                flat
                no-caps
                color="primary"
                icon="open_in_new"
                label="Live"
                :href="project.live"
                target="_blank"
                rel="noopener"
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
          <h2 class="section-title">Let us build something valuable.</h2>
        </header>

        <div class="contact-grid">
          <q-card flat class="surface-card contact-card">
            <q-card-section>
              <h3 class="card-title">Direct channels</h3>

              <div class="contact-list">
                <a class="contact-item" href="mailto:cristhian.peverelli@gmail.com">
                  <q-icon name="mail" size="20px" />
                  <span>cristhian.peverelli@gmail.com</span>
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
                  <q-btn type="submit" no-caps unelevated color="primary" :label="submitButtonLabel" />
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
import InteractiveIcosahedron from 'src/components/InteractiveIcosahedron.vue'

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
  { name: 'Vue 3 + Quasar', level: 88, category: 'frontend', note: 'Component architecture and UI systems.' },
  { name: 'HTML + SCSS', level: 90, category: 'frontend', note: 'Semantic markup, responsive layouts, and styling.' },
  { name: 'JavaScript', level: 86, category: 'languages', note: 'Modern syntax, asynchronous flows, and tooling.' },
  { name: 'C#', level: 78, category: 'languages', note: 'Game and app scripting in Unity environments.' },
  { name: 'Java', level: 74, category: 'languages', note: 'Object-oriented design and problem solving.' },
  { name: 'Golang', level: 70, category: 'languages', note: 'Learning practical backend-oriented patterns.' },
  { name: 'SQL', level: 67, category: 'backend', note: 'Query design and database reasoning.' },
  { name: 'Git + GitHub', level: 84, category: 'tools', note: 'Branching, repository management, and collaboration.' },
  { name: 'Unity + Blender', level: 76, category: 'tools', note: '3D game production and content integration.' },
  { name: 'Linux + IT Support', level: 80, category: 'backend', note: 'Troubleshooting and system-level diagnostics.' },
]

const timelineItems = [
  {
    title: 'Bachelor in Computer Science',
    period: '2021 - 2025',
    organization: 'University of Milan "La Statale"',
    description: 'Academic training in software engineering, algorithms, data management, and systems.',
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
    description: 'Continuous practice through projects, coding challenges, and iterative improvements.',
  },
]

const projectFilters = [
  { id: 'all', label: 'All' },
  { id: 'web', label: 'Web Apps' },
  { id: 'game', label: 'Game Dev' },
  { id: 'algorithms', label: 'Algorithms' },
  { id: 'hardware', label: 'Hardware' },
]

const projects = [
  {
    title: 'Pevefast',
    category: 'game',
    status: 'Playable demo',
    summary:
      '3D endless-runner developed in Unity and exported to WebGL for instant browser access.',
    stack: ['Unity', 'C#', 'Blender', 'WebGL'],
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
    summary: 'Curated set of kata solutions to train algorithmic thinking and implementation speed.',
    stack: ['Java', 'Algorithms'],
    live: '',
    repo: 'https://github.com/CristhianPeverelli/Codewars-Challenge',
  },
  {
    title: 'Tic-Tac-Toe Logic Circuit',
    category: 'hardware',
    status: 'University project',
    summary: 'Game simulation implemented only with digital logic circuits and hardware reasoning.',
    stack: ['Logisim', 'Digital Design'],
    live: '',
    repo: 'https://github.com/CristhianPeverelli/Logisim-Tris-Project',
  },
  {
    title: 'Pevefast Scripts',
    category: 'game',
    status: 'Code reference',
    summary: 'Detailed script repository used for gameplay systems and legacy experiments.',
    stack: ['C#', 'Unity'],
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

const contactForm = reactive({
  name: '',
  email: '',
  subject: 'Collaboration request',
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

    const searchableText = `${project.title} ${project.summary} ${project.stack.join(' ')}`.toLowerCase()
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
