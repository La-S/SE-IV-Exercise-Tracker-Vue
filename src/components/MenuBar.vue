<template>
  <v-app-bar app color="primary" dark>
    <template v-if="isAthletePage">
      <v-app-bar-nav-icon class="d-md-none" @click="drawer = !drawer" />
      <v-toolbar-title>My Training</v-toolbar-title>
    </template>

    <template v-else>
      <v-toolbar-title>Coach Dashboard</v-toolbar-title>
    </template>

    <v-spacer></v-spacer>

    <template v-if="isAthletePage">
      <div class="d-none d-md-flex">
        <v-btn text v-for="item in athleteMenuItems" :key="item.title" @click="goTo(item.route)">
          {{ item.title }}
        </v-btn>
      </div>
    </template>

    <template v-else>
      <div class="d-none d-md-flex">
        <v-btn text v-for="item in coachMenuItems" :key="item.title" @click="goTo(item.route)">
          {{ item.title }}
        </v-btn>
      </div>
    </template>
  </v-app-bar>

  <v-navigation-drawer
    v-if="isAthletePage"
    v-model="drawer"
    app
    temporary
    class="d-md-none"
  >
    <v-list>
      <v-list-item
        v-for="item in athleteMenuItems"
        :key="item.title"
        @click="() => { goTo(item.route); drawer = false; }"
      >
        <v-list-item-title>{{ item.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const drawer = ref(false);
const route = useRoute();
const router = useRouter();

const athleteMenuItems = [
  { title: "Home", route: "athlete-homepage" },
  { title: "Workout", route: "current-workout" },
];

const coachMenuItems = [
  { title: "Dashboard", route: "coach-dashboard" },
  { title: "Exercise Plans", route: "coach-exercise-plans" },
];

const isAthletePage = computed(() => {
  return ["athlete-homepage", "current-workout"].includes(route.name);
});

function goTo(name) {
  router.push({ name });
}
</script>

<style scoped>
.v-toolbar-title {
  font-weight: 600;
}

.v-navigation-drawer {
  background-color: #f9f9f9;
}

.v-btn {
  font-weight: 500;
}
</style>