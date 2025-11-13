<script setup>
import CoachMenu from '../components/CoachMenu.vue'
</script>

<template>
    <v-app>
      <CoachMenu />
      <v-main>
        <router-view />
      </v-main>
    </v-app>
</template>

<style scoped>
</style>
