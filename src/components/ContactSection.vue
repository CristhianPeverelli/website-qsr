<template>
  <section id="contact-section" class="section-container bg-dark text-white">
    <div class="content-wrapper">
      <div class="animation-wrapper">
        <DotLottieVue
          style="width: 180px; height: 180px"
          autoplay
          loop
          src="https://lottie.host/9f1a9415-38d0-4aa8-93dd-4084e05ad3d1/PH96mhrfEv.lottie"
        />
      </div>

      <ul class="contact-list">
        <li>
          <q-icon name="mail" size="20px" class="icon" />
          <a href="mailto:cristhian.peverelli@gmail.com" target="_blank" rel="noopener noreferrer">
            cristhian.peverelli@gmail.com
          </a>
        </li>
        <li>
          <q-icon name="person" size="20px" class="icon" />
          <a
            href="https://www.linkedin.com/in/cristhian-peverelli/"
            target="_blank"
            rel="noopener noreferrer"
          >
            linkedin.com/in/cristhian-peverelli
          </a>
        </li>
        <li>
          <q-icon name="code" size="20px" class="icon" />
          <a href="https://github.com/CristhianPeverelli" target="_blank" rel="noopener noreferrer">
            github.com/CristhianPeverelli
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
</script>

<style scoped>
.section-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 80px 24px;
  text-align: center;
  background-color: #121212;
  border-radius: 8px;
}

.animation-wrapper {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.content-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;

  text-align: left;
  flex-direction: row; /* for large screens */
  flex-wrap: nowrap;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: #e0e0e0;
  margin-bottom: 8px;
}

.section-subtitle {
  font-size: 1.1rem;
  color: #a0a0a0;
  margin-bottom: 32px;
}

.contact-list {
  list-style: none;
  padding: 0;
  margin: 0 auto;
  max-width: 400px;
  text-align: left;
}

.contact-list li {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  color: #c0c0c0;
  font-size: 1.125rem;
}

.contact-list li a {
  color: #00b8d9;
  text-decoration: none;
  margin-left: 12px;
  transition: color 0.3s ease;
}

.contact-list li a:hover {
  color: #80d0ea;
}

.icon {
  color: #00b8d9;
}
</style>
