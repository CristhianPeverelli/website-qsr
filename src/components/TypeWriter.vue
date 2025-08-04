<template>
  <div class="typewriter">
    <span>{{ displayText }}</span
    ><span class="cursor">|</span>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const words = ['a Developer', 'an IT Technician', 'a Student']
const displayText = ref('')
const currentWordIndex = ref(0)
const charIndex = ref(0)
const isDeleting = ref(false)

let timer = null

function updateTypewriter() {
  const currentWord = words[currentWordIndex.value]

  if (!isDeleting.value) {
    // Scrittura
    displayText.value = currentWord.slice(0, charIndex.value + 1)
    charIndex.value++

    if (charIndex.value === currentWord.length) {
      isDeleting.value = true
      clearInterval(timer)
      setTimeout(() => {
        timer = setInterval(updateTypewriter, 80)
      }, 1000) // Pausa dopo aver scritto la parola
    }
  } else {
    // Cancellazione
    displayText.value = currentWord.slice(0, charIndex.value - 1)
    charIndex.value--

    if (charIndex.value === 0) {
      isDeleting.value = false
      currentWordIndex.value = (currentWordIndex.value + 1) % words.length
    }
  }
}

onMounted(() => {
  timer = setInterval(updateTypewriter, 80)
})

onBeforeUnmount(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.typewriter {
  font-size: 1.25rem;
  font-weight: 500;
  display: inline-block;
  white-space: nowrap;
}

.cursor {
  display: inline-block;
  animation: blink 1s step-end infinite;
  color: #00b8d9;
  margin-left: 2px;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
