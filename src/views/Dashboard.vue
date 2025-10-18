<script setup>
import { computed, onMounted, ref } from "vue";
import Utils from "../config/utils";

const user = ref(null);

const fullName = computed(() => {
  if (!user.value) return "";
  const fName = user.value.fName ?? "";
  const lName = user.value.lName ?? "";
  return `${fName} ${lName}`.trim();
});

onMounted(() => {
  user.value = Utils.getStore("user");
});
</script>

<template>
  <v-container>
    <v-toolbar>
      <v-toolbar-title>Exercise Dashboard</v-toolbar-title>
    </v-toolbar>
    <v-card class="mt-6">
      <v-card-text>
        <p v-if="fullName">Welcome back, {{ fullName }}.</p>
        <p v-else>Welcome to your exercise dashboard.</p>
        <p class="text-body-2">
          Use this space to plan workouts, track completed sessions, and review
          your progress. Build the features you need by extending this view,
          adding charts, summaries, or quick links to detailed logs.
        </p>
      </v-card-text>
    </v-card>
  </v-container>
</template>
