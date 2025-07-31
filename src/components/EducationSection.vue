<template>
  <section id="education-section" class="section-container text-white">
    <h2 class="section-title">Education</h2>
    <hr class="divider" />

    <div class="content-wrapper">
      <div class="animation-wrapper">
        <DotLottieVue
          style="height: 400px; width: 400px"
          autoplay
          loop
          src="https://lottie.host/e3db75b2-347b-482f-8e5f-d61cb9e3c8d9/pnJL9DO68U.lottie"
        />
      </div>

      <div class="text-content">
        <p class="section-intro">Bachelor’s degree student in Computer Science</p>

        <ul class="education-list">
          <li class="education-item">
            <span class="degree">
              Bachelor's Degree in Computer Science @
              <strong>University of Milan "La Statale"</strong>
            </span>
            <span class="period">2021 - expected mid 2025</span>
          </li>

          <li class="education-item">
            <span class="degree">
              High School Diploma @ <strong>ITIS Emilio Alessandrini, Vittuone</strong>
            </span>
            <span class="period">Sep 2016 - Jun 2021</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
</script>

<style scoped>
.section-container {
  padding: 80px 24px;
  max-width: 900px;
  margin: 0 auto;
  border-radius: 8px;
  text-align: center;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: #e0e0e0;
  margin-bottom: 16px;
}

.divider {
  width: 60px;
  height: 3px;
  background-color: #00b8d9;
  margin: 0 auto 40px auto;
  border: none;
  border-radius: 2px;
}

.content-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 60px;
  text-align: left;
  flex-direction: row; /* for large screens */
  flex-wrap: nowrap;
}

.animation-wrapper {
  flex: 0 0 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.text-content {
  flex: 1 1 450px;
  max-width: 500px;
}

.section-intro {
  color: #b0b0b0;
  font-size: 1.125rem;
  margin-bottom: 36px;
  line-height: 1.5;
}

.education-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.education-item {
  position: relative;
  padding-left: 32px;
  margin-bottom: 28px;
  color: #d0d0d0;
  font-size: 1.125rem;
  line-height: 1.4;
}

/* Bullet */
.education-item::before {
  content: '✶';
  position: absolute;
  left: 0;
  top: 0;
  color: #00b8d9;
  font-size: 1.5rem;
  line-height: 1;
}

.degree {
  font-weight: 600;
  color: #e0e0e0;
}

.period {
  display: block;
  color: #80cfe9;
  font-size: 0.9rem;
  margin-top: 4px;
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
    text-align: center;
  }

  .text-content {
    max-width: 100%;
  }

  .animation-wrapper {
    margin-bottom: 32px;
    flex: none;
    width: 300px;
    height: 300px;
  }
}
</style>
