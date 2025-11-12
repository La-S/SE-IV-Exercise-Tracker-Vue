<script setup>
import AthleteMenu from '../components/AthleteMenu.vue'
</script>

<template>
  <div class="athlete-layout">
    <AthleteMenu />
    <main>
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.athlete-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
  padding: 1rem;
  padding-top: 64px;
}

@media (max-width: 600px) {
  main {
    padding-top: 72px;
  }
}
</style>