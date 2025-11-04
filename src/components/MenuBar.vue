<script setup>
import ExerciseLogo from "../assets/exercise_icon.png";
import { ref, onMounted, computed} from "vue";
import Utils from "../config/utils";
import AuthServices from "../services/authServices";
import { useRouter, useRoute } from "vue-router";
import { useTheme } from "vuetify";

const router = useRouter();
const route = useRoute();
const theme = useTheme();

const user = ref(null);
const title = ref("Exercise Tracker");
const initials = ref("");
const name = ref("");
const logoURL = ref("");

const defaultNavItems = [
  { label: "Dashboard", name: "dashboard" },
  { label: "Exercise Plans", name: "exercise-plans" },
];

const isAthleteRoute = computed(() => {
  const p = (route.path || "").toLowerCase();
  return p.includes("athlete-homepage") || p.includes("current-workout") || p.includes("/athlete");
});

const athleteNavItems = computed(() => {
  const p = (route.path || "").toLowerCase();
  if (p.includes("athlete-homepage")) {
    return [{ label: "Workout", name: "current-workout" }];
  }
  if (p.includes("current-workout")) {
    return [{ label: "Home", name: "athlete-homepage" }];
  }
  return [{ label: "Home", name: "athlete-homepage" }];
});

const navItems = computed(() => defaultNavItems);

const resetMenu = () => {
  user.value = null;
  user.value = Utils.getStore("user") ?? null;

  if (user.value) {
    const fName = user.value.fName ?? "";
    const lName = user.value.lName ?? "";
    const composedName = `${fName} ${lName}`.trim();
    const firstInitial = (fName && fName.charAt(0)) || "";
    const lastInitial = (lName && lName.charAt(0)) || "";

    initials.value =
      `${firstInitial}${lastInitial}`.trim() || composedName.charAt(0) || "?";
    name.value = composedName || user.value.email || "User";
  } else {
    initials.value = "";
    name.value = "";
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
    .catch((error) => console.log("error", error));
};

const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? "light" : "dark";
};

onMounted(() => {
  logoURL.value = ExerciseLogo;
  resetMenu();
});
</script>

<template>
  <v-app-bar app>
    <router-link :to="{ name: 'dashboard' }" class="pl-3">
      <v-img :src="logoURL" height="32" width="32" contain></v-img>
    </router-link>

    <v-toolbar-title class="text-h4 font-weight-bold">
      {{ title }}
    </v-toolbar-title>

    <div class="d-none d-sm-flex">
      <template v-if="isAthleteRoute">
        <v-btn
          v-for="item in athleteNavItems"
          :key="item.name"
          :to="{ name: item.name }"
          :variant="route.name === item.name ? 'tonal' : 'text'"
          color="primary"
          class="mx-1 font-weight-medium"
        >
          {{ item.label }}
        </v-btn>
      </template>

      <template v-else>
        <v-btn
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          :variant="route.name === item.name ? 'tonal' : 'text'"
          color="primary"
          class="mx-1 font-weight-medium"
        >
          {{ item.label }}
        </v-btn>
      </template>
    </div>

    <v-spacer></v-spacer>

    <v-btn icon @click="toggleTheme" :title="theme.global.current.value.dark ? 'Light mode' : 'Dark mode'">
      <v-icon>
        {{ theme.global.current.value.dark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}
      </v-icon>
    </v-btn>

    <v-menu bottom min-width="200px" rounded offset-y v-if="user">
      <template #activator="{ props }">
        <v-btn v-bind="props" icon>
          <v-avatar color="primary">
            <span class="text-white font-weight-bold">{{ initials }}</span>
          </v-avatar>
        </v-btn>
      </template>

      <v-card>
        <v-card-text class="text-center">
          <v-avatar color="primary" size="48" class="mb-3">
            <span class="text-white font-weight-bold">{{ initials }}</span>
          </v-avatar>

          <h3 class="text-h6">{{ name }}</h3>
          <p class="text-body-2">{{ user.email }}</p>

          <v-divider class="my-3"></v-divider>

          <v-btn variant="text" @click="logout" color="primary">Logout</v-btn>
        </v-card-text>
      </v-card>
    </v-menu>
  </v-app-bar>
</template>