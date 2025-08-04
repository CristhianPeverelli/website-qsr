<template>
  <section id="about-section" class="section-container">
    <h2 class="section-title">About Me</h2>
    <hr class="divider" />

    <div class="content-wrapper">
      <div class="text-content">
        <p class="section-text">
          Hi, I'm Cristhian. A student, developer, and IT technician passionate about computer
          programming. Eager for challenges, I constantly seek opportunities to enhance my skills in
          programming. What truly sets me apart is my insatiable hunger for challenges. I thrive in
          environments where innovation and adaptation are paramount, constantly seeking out
          opportunities to expand my knowledge and refine my skills.
        </p>
      </div>

      <div class="photo-wrapper">
        <img src="~assets/profile-photo.jpg" alt="Cristhian Peverelli" class="profile-photo" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-container {
  padding: 80px 24px;
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}

.section-title {
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.divider {
  width: 70px;
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
  gap: 48px;
  flex-wrap: wrap;
  text-align: left;
}

.text-content {
  flex: 1 1 400px;
  max-width: 540px;
}

.section-text {
  font-size: 1.125rem;
  line-height: 1.6;
  margin-bottom: 36px;
}

.photo-wrapper {
  flex: 0 0 180px;
  text-align: center;
}

.profile-photo {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  border: 3px solid #00b8d9;
  object-fit: cover;
  box-shadow: 0 0 12px rgba(0, 184, 217, 0.6);
  transition: transform 0.3s ease;
}

.profile-photo:hover {
  transform: scale(1.05);
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

  .photo-wrapper {
    margin-top: 32px;
  }
}
</style>
