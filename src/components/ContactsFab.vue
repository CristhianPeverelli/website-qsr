<template>
  <div class="fixed bottom left q-ma-md">
    <q-fab
      vertical-actions-align="right"
      color="secondary"
      glossy
      icon="keyboard_arrow_up"
      direction="up"
      label="Contacts"
    >
      <q-fab-action
        label-position="left"
        color="primary"
        @click="onClick('Email')"
        icon="mail"
        label="Email"
      />
      <q-fab-action
        label-position="left"
        color="light-blue"
        @click="onClick('LinkedIn')"
        icon="verified"
        label="LinkedIn"
      />
      <q-fab-action
        label-position="left"
        color="grey"
        @click="onClick('GitHub')"
        icon="code"
        label="GitHub"
      />
    </q-fab>
  </div>
</template>

<script setup></script>

<script>
export default {
  methods: {
    onClick(label) {
      switch (label) {
        case 'Email':
          window.location.href =
            'mailto:cristhian.peverelli@gmail.com?subject=Super%20Professional%20Business%20Mail%20:)&body=Hi%20Cristhian,'
          break
        case 'LinkedIn':
          window.location.href = 'https://www.linkedin.com/in/cristhian-peverelli/'
          break
        case 'GitHub':
          window.location.href = 'https://github.com/CristhianPeverelli'
          break
        default:
          console.log('Error on fab: ', label)
          break
      }
    },
  },
}
</script>
