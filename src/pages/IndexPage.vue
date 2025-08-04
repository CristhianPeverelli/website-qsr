<template>
  <q-page :class="pageClasses">
    <div :class="heroWrapperClasses">
      <DotLottieVue
        style="height: 500px; width: 500px"
        autoplay
        loop
        src="https://lottie.host/a0307ab9-ca6a-436f-afa8-2f9c49336ea1/CCOte4fTtR.lottie"
      />

      <h1 class="text-h3 text-bold q-mb-sm">Cristhian Peverelli</h1>

      <h2 :class="subtitleClasses">
        <span class="animated-word" :style="{ minWidth: '140px', display: 'inline-block' }">
          {{ currentWord }}
        </span>
      </h2>

      <p :class="descriptionClasses">Simplicity is the ultimate sophistication</p>

      <div class="q-gutter-md q-mb-xl">
        <q-btn label="Contact Me" color="primary" rounded class="cta" @click="scrollToFab" />
        <q-btn
          label="View Portfolio"
          rounded
          color="secondary"
          class="cta"
          @click="scrollToPortfolio"
        />
      </div>

      <q-icon
        name="expand_more"
        class="text-grey-5 animate__animated animate__fadeInDown animate__infinite"
        size="2.5rem"
      />
    </div>

    <!-- Sezioni -->
    <AboutSection />
    <EducationSection />
    <PortfolioSection />
    <ContactSection />
  </q-page>
</template>

<script setup>
import { useQuasar, scroll } from 'quasar'
import { computed } from 'vue'
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
import AboutSection from 'components/AboutSection.vue'
import EducationSection from 'components/EducationSection.vue'
import PortfolioSection from 'components/PortfolioSection.vue'
import ContactSection from 'components/ContactSection.vue'

const $q = useQuasar()

const pageClasses = computed(() =>
  $q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark',
)
const heroWrapperClasses = computed(
  () => 'hero-wrapper column items-center justify-center text-center full-width q-py-xl',
)
const subtitleClasses = computed(
  () => 'text-subtitle1 q-mb-md ' + ($q.dark.isActive ? 'text-grey-4' : 'text-grey-7'),
)
const descriptionClasses = computed(
  () => 'text-body1 q-mb-xl ' + ($q.dark.isActive ? 'text-grey-4' : 'text-grey-7'),
)

function scrollToFab() {
  const el = document.getElementById('contact-section')
  if (el) {
    scroll.setVerticalScrollPosition(window, el.offsetTop - 100, 600)
  }
}
function scrollToPortfolio() {
  const el = document.getElementById('portfolio-section')
  if (el) {
    scroll.setVerticalScrollPosition(window, el.offsetTop - 100, 600)
  }
}
</script>

<script>
export default {
  data() {
    return {
      words: ['a Developer', 'an IT Technician', 'a Student'],
      currentWordIndex: 0,
      currentTypedWord: '',
      wordIndex: 0,
      timer: null,
    }
  },
  computed: {
    currentWord() {
      return this.currentTypedWord
    },
  },
  created() {
    this.startAnimation()
  },
  unmounted() {
    clearInterval(this.timer)
  },
  methods: {
    startAnimation() {
      this.timer = setInterval(() => {
        if (this.wordIndex < this.words[this.currentWordIndex].length) {
          this.currentTypedWord += this.words[this.currentWordIndex][this.wordIndex]
          this.wordIndex++
        } else {
          this.currentTypedWord = ' '
          this.wordIndex = 0
          this.currentWordIndex = (this.currentWordIndex + 1) % this.words.length
        }
      }, 200)
    },
  },
}
</script>

<style scoped>
@import 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css';

.cta {
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}
.cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(255, 255, 255, 0.1);
}
</style>
