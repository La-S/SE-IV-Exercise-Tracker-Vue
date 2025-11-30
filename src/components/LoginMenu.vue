<script setup>
import ExerciseLogo from "../assets/exercise_icon.png";
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

const title = ref("Exercise Tracker");
const logoURL = ref("");


onMounted(() => {
  logoURL.value = ExerciseLogo;
});
</script>

<template>
  <v-app-bar
    app
    density="comfortable"
    color="menubar"
    class="app-toolbar"
    dark
    elevation="0"
  >
    <div class="d-flex align-center pl-3">
      <v-img :src="logoURL" height="32" width="32" contain class="mr-2" />
      <span class="text-h6 font-weight-medium title-text">{{ title }}</span>
    </div>

    <v-spacer></v-spacer>

  </v-app-bar>
</template>

<style scoped>
.app-toolbar {
  border-bottom: 1px solid var(--v-theme-border);
}

.title-text {
  white-space: nowrap;
  overflow: visible;
  text-overflow: unset;
  color: var(--v-theme-menubarText);
}

.nav-buttons {
  flex: 1;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
