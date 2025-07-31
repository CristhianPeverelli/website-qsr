<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> Quasar App </q-toolbar-title>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Essential Links </q-item-label>

        <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import EssentialLink from 'components/EssentialLink.vue'

const linksList = [
  {
    title: 'Home',
    caption: 'My biography',
    icon: 'account_circle',
    route: '/',
    link: '',
  },
  {
    title: 'Education',
    caption: 'My educational history',
    icon: 'school',
    route: '/',
    link: '',
  },
  {
    title: 'Work Experience',
    caption: 'My work experience',
    icon: 'badge',
    route: '/#/work',
    link: '',
  },
  {
    title: 'Projects',
    caption: 'Personal projects I have been working to',
    icon: 'build',
    route: '/#/projects',
    link: '',
  },
  {
    title: 'GitHub Profile',
    caption: 'My GitHub page',
    icon: 'code',
    link: 'https://github.com/CristhianPeverelli',
  },
  {
    title: 'Codewars Profile',
    caption: 'Where I solve some code puzzles',
    icon: 'data_object',
    link: 'https://www.codewars.com/users/CristhianPeverelli',
  },
  {
    title: 'LeetCode Profile',
    caption: 'Other puzzles :)',
    icon: 'terminal',
    link: 'https://leetcode.com/CristhianPeverelli/',
  },
  {
    title: 'Contact me',
    caption: 'via Email',
    icon: 'favorite',
    link: 'mailto:cristhian.peverelli@gmail.com?subject=Super%20Professional%20Business%20Mail%20:)&body=Hi%20Cristhian,',
  },
]

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
