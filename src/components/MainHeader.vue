<template>
  <q-header elevated class="main-header" :class="{ 'main-header--scrolled': isScrolled }">
    <div class="header-progress" :style="{ transform: `scaleX(${scrollProgress})` }" />

    <q-toolbar class="main-toolbar q-px-md q-px-lg-xl">
      <q-btn flat no-caps class="brand-btn" aria-label="Go to home section" @click="goToSection('home')">
        <div class="brand-copy">
          <span class="brand-name">Cristhian Peverelli</span>
          <span class="brand-tag">Software Developer</span>
        </div>
      </q-btn>

      <q-space />

      <div v-if="isHome" class="nav-links gt-sm">
        <q-btn
          v-for="link in sectionLinks"
          :key="link.id"
          flat
          no-caps
          :label="link.label"
          class="nav-link"
          :class="{ 'nav-link--active': activeSection === link.id }"
          @click="goToSection(link.id)"
        />
      </div>

      <div v-else class="page-context gt-xs">
        <span class="page-context__label">Current</span>
        <strong class="page-context__title">{{ currentPageLabel }}</strong>
      </div>

      <div class="header-actions">
        <q-btn
          flat
          round
          :icon="isDark ? 'light_mode' : 'dark_mode'"
          aria-label="Toggle theme"
          @click="toggleTheme"
        />

        <q-btn
          v-if="isHome"
          unelevated
          no-caps
          color="primary"
          class="gt-xs hire-btn"
          label="Let's Work Together"
          @click="goToSection('contact')"
        />

        <q-btn
          v-if="isHome"
          flat
          round
          icon="menu"
          aria-label="Open navigation"
          class="lt-md"
          @click="mobileMenu = true"
        />

        <q-btn
          v-else
          flat
          no-caps
          :label="backButtonLabel"
          class="back-btn"
          @click="goToSection(returnSectionId)"
        />
      </div>
    </q-toolbar>
  </q-header>

  <q-drawer
    v-if="isHome"
    v-model="mobileMenu"
    side="right"
    overlay
    behavior="mobile"
    class="mobile-nav"
  >
    <q-list padding>
      <q-item-label header class="mobile-nav__title">Navigate</q-item-label>
      <q-item v-for="link in sectionLinks" :key="link.id" clickable v-ripple @click="goToSection(link.id)">
        <q-item-section>{{ link.label }}</q-item-section>
      </q-item>
    </q-list>
  </q-drawer>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const sectionLinks = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
]

const mobileMenu = ref(false)
const activeSection = ref('home')
const scrollProgress = ref(0)
const isScrolled = ref(false)
const isDark = ref($q.dark.isActive)

let observer = null

const isHome = computed(() => route.path === '/')
const isDeltaE = computed(() => route.path === '/delta-e')
const currentPageLabel = computed(() => (isDeltaE.value ? 'Delta - E' : 'Portfolio'))
const returnSectionId = computed(() => (isDeltaE.value ? 'projects' : 'home'))
const backButtonLabel = computed(() => (isDeltaE.value ? 'Back to projects' : 'Back to portfolio'))

function applyTheme(theme) {
  const darkTheme = theme === 'dark'
  $q.dark.set(darkTheme)
  isDark.value = darkTheme
  localStorage.setItem('portfolio-theme', theme)
}

function toggleTheme() {
  applyTheme(isDark.value ? 'light' : 'dark')
}

function syncThemeFromStorage() {
  const savedTheme = localStorage.getItem('portfolio-theme')

  if (savedTheme === 'light' || savedTheme === 'dark') {
    applyTheme(savedTheme)
    return
  }

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  applyTheme(prefersDark ? 'dark' : 'light')
}

function updateScrollState() {
  const currentScroll = window.scrollY || 0
  const totalScrollable = document.documentElement.scrollHeight - window.innerHeight

  isScrolled.value = currentScroll > 24
  scrollProgress.value = totalScrollable > 0 ? Math.min(1, currentScroll / totalScrollable) : 0
}

function scrollToSection(id) {
  const target = document.getElementById(id)
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

async function goToSection(id) {
  if (route.path !== '/') {
    await router.push('/')
    await nextTick()
    window.setTimeout(() => {
      scrollToSection(id)
    }, 80)
  } else {
    scrollToSection(id)
  }

  mobileMenu.value = false
  if (id === 'home') {
    activeSection.value = 'home'
  }
}

function teardownObserver() {
  if (observer) {
    observer.disconnect()
    observer = null
  }
}

function setupObserver() {
  teardownObserver()

  if (!isHome.value) {
    return
  }

  const sections = document.querySelectorAll('section[data-section]')
  if (!sections.length) {
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id
        }
      })
    },
    {
      root: null,
      rootMargin: '-30% 0px -45% 0px',
      threshold: 0.2,
    },
  )

  sections.forEach((section) => observer.observe(section))
}

onMounted(() => {
  syncThemeFromStorage()
  updateScrollState()

  window.addEventListener('scroll', updateScrollState, { passive: true })

  nextTick(() => {
    setupObserver()
  })
})

watch(
  () => route.path,
  async () => {
    mobileMenu.value = false
    activeSection.value = 'home'

    await nextTick()
    window.setTimeout(() => {
      setupObserver()
      updateScrollState()
    }, 80)
  },
)

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateScrollState)
  teardownObserver()
})
</script>

<style scoped lang="scss" src="../css/components/main-header.scss"></style>
