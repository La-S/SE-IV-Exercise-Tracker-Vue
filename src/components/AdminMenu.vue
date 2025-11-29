<script setup>
import ExerciseLogo from "../assets/exercise_icon.png";
import { ref, onMounted } from "vue";
import Utils from "../config/utils";
import AuthServices from "../services/authServices";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

const user = ref(null);
const title = ref("Exercise Tracker");
const initials = ref("");
const name = ref("");
const logoURL = ref("");
const menuOpen = ref(false);

const navItems = [
  // { label: "Users", name: "userList" },
  // { label: "Teams", name: "teamList" },
];


function getInitialsFromEmail(email) {
  if (!email) return "?";
  const namePart = email.split("@")[0]; 
  const parts = namePart.split(".");
  const firstInitial = parts[0]?.[0]?.toUpperCase() || "";
  const lastInitial = parts[1]?.[0]?.toUpperCase() || "";
  return firstInitial + lastInitial || "?";
}

const resetMenu = () => {
  user.value = Utils.getStore("user");
  if (user.value){
    const fName = user.value.firstName ?? "";
    const lName = user.value.lastName ?? "";
    initials.value = `${fName.charAt(0)}${lName.charAt(0)}` || "?";
    const composedName = `${fName} ${lName}`.trim();  
    name.value = composedName || user.value.email || "User";
  }
};

const logout = () => {
  AuthServices.logoutUser(user.value)
    .then(() => {
      Utils.removeItem("user");
      router.push({ name: "login" });
    })
    .catch((error) => console.log("error", error));
};

onMounted(() => {
  const storedUser = Utils.getStore("user");
  if (storedUser.email){
    initials.value = getInitialsFromEmail(storedUser.email);
  }
  logoURL.value = ExerciseLogo;
  resetMenu();
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
    <div class="d-flex justify-center nav-buttons">
      <v-btn
        v-for="item in navItems"
        :key="item.name"
        :to="{ name: item.name }"
        variant="text"
        class="mx-2"
        color="primary"
      >
        {{ item.label }}
      </v-btn>
    </div>
    <v-spacer></v-spacer>

    <v-menu v-model="menuOpen" location="bottom end" transition="scale-transition">
      <template #activator="{ props }">
        <v-avatar v-bind="props" color="primary" size="40" class="mr-4 cursor-pointer">
          <span class="text-white font-weight-bold">{{ initials }}</span>
        </v-avatar>
      </template>

      <v-card>
        <v-card-text class="text-center">
          <v-avatar color="primary" size="48" class="mb-3">
            <span class="text-white font-weight-bold">{{ initials }}</span>
          </v-avatar>
          <h3 class="text-h6">{{ name }}</h3>
          <p class="text-body-2">{{ user.email }}</p>
          <v-divider class="my-3"></v-divider>
          <v-btn variant="text" @click="logout" color="error">Logout</v-btn>
        </v-card-text>
      </v-card>
    </v-menu>
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
