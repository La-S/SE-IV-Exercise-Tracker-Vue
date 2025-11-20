<script setup>
import AdminMenu from '../components/AdminMenu.vue'
</script>

<template>
    <v-app>
      <AdminMenu />
      <v-main>
        <router-view />
      </v-main>
    </v-app>
</template>

<style scoped>
</style>
