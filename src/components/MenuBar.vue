<script setup>
import { ref, computed, onMounted } from "vue";
import Utils from "../config/utils";
import AuthServices from "../services/authServices";
import { useRouter, useRoute } from "vue-router";
import { useTheme } from "vuetify";

const router = useRouter();
const route = useRoute();
const theme = useTheme();

const drawer = ref(false);
const user = ref(null);
const initials = ref("");
const name = ref("");

const athleteMenuItems = [
  { title: "Home", route: "athlete-homepage" },
  { title: "Workout", route: "current-workout" },
];

const coachMenuItems = [
  { title: "Dashboard", route: "dashboard" },
  { title: "Exercise Plans", route: "exercise-plans" },
  { title: "Teams", route: "teams" },
];

const isAthletePage = computed(() =>
  ["athlete-homepage", "current-workout"].includes(route.name)
);

const resetMenu = () => {
  user.value = Utils.getStore("user");
  if (user.value) {
    const fName = user.value.fName ?? "";
    const lName = user.value.lName ?? "";
    const composedName = `${fName} ${lName}`.trim();
    initials.value = `${fName.charAt(0)}${lName.charAt(0)}` || "?";
    name.value = composedName || user.value.email || "User";
  }
};

const logout = () => {
  AuthServices.logoutUser(user.value)
    .then(() => {
      Utils.removeItem("user");
      user.value = null;
      initials.value = "";
      name.value = "";
      router.push({ name: "login" });
    })
    .catch((error) => console.log("Logout error:", error));
};

const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? "light" : "dark";
};

function goTo(name) {
  router.push({ name });
}

onMounted(() => {
  resetMenu();
});
</script>

<template>
  <v-app-bar app color="dark" dark>
    <v-toolbar-title class="text-h6 font-weight-bold">
      {{ isAthletePage ? "Training" : "Dashboard" }}
    </v-toolbar-title>

    <v-spacer></v-spacer>

    <template v-if="isAthletePage">
      <div class="d-none d-md-flex">
        <v-btn
          text
          v-for="item in athleteMenuItems"
          :key="item.title"
          @click="goTo(item.route)"
        >
          {{ item.title }}
        </v-btn>
      </div>
    </template>

    <template v-else>
      <div class="d-none d-md-flex">
        <v-btn
          text
          v-for="item in coachMenuItems"
          :key="item.title"
          @click="goTo(item.route)"
        >
          {{ item.title }}
        </v-btn>
      </div>
    </template>

    <v-btn
      icon
      @click="toggleTheme"
      :title="theme.global.current.value.dark ? 'Light mode' : 'Dark mode'"
    >
      <v-icon>
        {{ theme.global.current.value.dark ? "mdi-weather-sunny" : "mdi-weather-night" }}
      </v-icon>
    </v-btn>

    <v-menu bottom min-width="200px" rounded offset-y v-if="user">
      <template #activator="{ props }">
        <v-btn v-bind="props" icon>
          <v-avatar color="secondary">
            <span class="text-white font-weight-bold">{{ initials }}</span>
          </v-avatar>
        </v-btn>
      </template>

      <v-card>
        <v-card-text class="text-center">
          <v-avatar color="secondary" size="48" class="mb-3">
            <span class="text-white font-weight-bold">{{ initials }}</span>
          </v-avatar>
          <h3 class="text-h6">{{ name }}</h3>
          <p class="text-body-2">{{ user.email }}</p>
          <v-divider class="my-3"></v-divider>
          <v-btn variant="text" @click="logout" color="error">Logout</v-btn>
        </v-card-text>
      </v-card>
    </v-menu>

    <template v-if="isAthletePage">
      <v-app-bar-nav-icon
        class="d-md-none ml-2"
        @click="drawer = !drawer"
      />
    </template>
  </v-app-bar>

  <v-navigation-drawer
    v-if="isAthletePage"
    v-model="drawer"
    app
    temporary
    location="right"
    class="d-md-none athlete-drawer"
  >
    <v-list class="text-left pr-4">
      <v-list-item
        v-for="item in athleteMenuItems"
        :key="item.title"
        @click="() => { goTo(item.route); drawer = false; }"
      >
        <v-list-item-title class="font-weight-medium text-left pl-2">
          {{ item.title }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

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