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
.coach-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
main {
  flex: 1;
  padding: 1rem;
}
</style>
