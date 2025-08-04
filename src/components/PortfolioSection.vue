<template>
  <section id="portfolio-section" class="section-container">
    <h2 class="text-h4 text-bold q-mb-lg text-center">My Projects</h2>

    <q-layout-grid class="project-grid" cols="12" cols-sm="6" cols-md="4" cols-lg="3" gutter="24px">
      <q-card
        v-for="project in projects"
        :key="project.title"
        class="project-card bg-grey-9 text-white"
        flat
        bordered
      >
        <q-img :src="project.image" ratio="16/9" />

        <q-card-section>
          <div class="text-h6">{{ project.title }}</div>
          <div class="text-subtitle2 text-grey-4 q-mt-xs">{{ project.description }}</div>
          <div class="q-mt-sm text-caption text-grey-5">Stack: {{ project.stack }}</div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            :href="project.link"
            target="_blank"
            label="View"
            icon="launch"
            size="sm"
            flat
            color="primary"
          />
        </q-card-actions>
      </q-card>
    </q-layout-grid>
  </section>
</template>

<script setup>
const projects = [
  {
    title: 'Pevefast',
    description:
      'A 3D car runner game developed in Unity for Android devices. If you click View you can play it via web',
    stack: 'C#, Blender, Audacity, Visual Effects, WebGL, Unity',
    image: 'https://placehold.co/400x200?text=Train+App',
    link: 'https://cristhianpeverelli.github.io/pevefast/',
  },
  {
    title: 'Pevefast Scripts',
    description:
      'Here is the repo with all the scripts used in Pevefast. Unused scripts are kept as legacy :)',
    stack: 'C#',
    image: 'https://placehold.co/400x200?text=Portfolio+Site',
    link: 'https://github.com/CristhianPeverelli/Pevefast-scripts',
  },
  {
    title: 'My Portfolio Website',
    description: 'The repository of this website is available on my GitHub',
    stack: 'Vue, Node, Quasar',
    image: 'https://placehold.co/400x200?text=Poker+Evaluator',
    link: 'https://github.com/CristhianPeverelli/website-qsr',
  },
  {
    title: 'LeetCode',
    description: 'Here you can find a repo with all my solutions of some LeetCode problems',
    stack: 'Golang, MySQL',
    image: 'https://placehold.co/400x200?text=Face+Recognition',
    link: 'https://github.com/CristhianPeverelli/leetcode',
  },
  {
    title: 'CodeWars',
    description: 'Here you can find a repo with all my solutions of some CodeWars Kata',
    stack: 'Java',
    image: 'https://placehold.co/400x200?text=Face+Recognition',
    link: 'https://github.com/CristhianPeverelli/Codewars-Challenge',
  },
  {
    title: 'Tic-Tac-Toe',
    description:
      "A university project I've done to simulate a Tic-Tac-Toe game using only logic circuits",
    stack: 'Logisim',
    image: 'https://placehold.co/400x200?text=Face+Recognition',
    link: 'https://github.com/CristhianPeverelli/Logisim-Tris-Project',
  },
]
</script>

<style scoped>
.section-container {
  padding: 100px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.project-card {
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}
.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(255, 255, 255, 0.08);
}
</style>
