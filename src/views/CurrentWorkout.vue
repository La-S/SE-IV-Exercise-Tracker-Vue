<script setup>
import { ref, computed, onMounted } from "vue";
import Utils from "../config/utils";

const user = ref(null);
const selectedPlan = ref(null);
const workoutPlans = ref([]);
const exercises = ref([]);
const timer = ref(0); // seconds elapsed
const isRunning = ref(false);
let timerInterval = null;

const fullName = computed(() => {
  if (!user.value) return "";
  const fName = user.value.fName ?? "";
  const lName = user.value.lName ?? "";
  return `${fName} ${lName}`.trim();
});

function loadWorkoutPlans() {
  workoutPlans.value = [
    { id: 1, name: "Full Body Blast" },
    { id: 2, name: "Leg Day Routine" },
    { id: 3, name: "Core Strength Builder" },
  ];
}

function loadExercises(planId) {
  const data = {
    1: [
      { id: 1, name: "Push-ups", completed: false },
      { id: 2, name: "Squats", completed: false },
      { id: 3, name: "Plank", completed: false },
    ],
    2: [
      { id: 4, name: "Lunges", completed: false },
      { id: 5, name: "Leg Press", completed: false },
      { id: 6, name: "Calf Raises", completed: false },
    ],
    3: [
      { id: 7, name: "Crunches", completed: false },
      { id: 8, name: "Leg Raises", completed: false },
      { id: 9, name: "Russian Twists", completed: false },
    ],
  };
  exercises.value = data[planId] || [];
  resetWorkout();
}

function toggleExerciseCompletion(exercise) {
  exercise.completed = !exercise.completed;
}

function startTimer() {
  if (isRunning.value) return;
  isRunning.value = true;
  timerInterval = setInterval(() => {
    timer.value++;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning.value = false;
}

function completeWorkout() {
  stopTimer();
  const workoutData = {
    athlete: fullName.value,
    plan: selectedPlan.value,
    timeElapsed: timer.value,
    exercises: exercises.value,
    completedAt: new Date().toISOString(),
  };
  console.log("Workout complete:", workoutData);
  // Later: send to backend for coach tracking
  resetWorkout();
}

function resetWorkout() {
  stopTimer();
  timer.value = 0;
  exercises.value.forEach((e) => (e.completed = false));
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

onMounted(() => {
  user.value = Utils.getStore("user");
  loadWorkoutPlans();
});
</script>

<template>
  <v-container>
    <v-toolbar>
      <v-toolbar-title>Select Workout</v-toolbar-title>
      <v-spacer />
    </v-toolbar>

    <v-card class="mt-6 mx-auto" max-width="600">
      <v-card-text>
        <p v-if="fullName">Welcome back, {{ fullName }}!</p>
        <p v-else>Welcome to your athlete dashboard.</p>

        <!-- Plan Select -->
        <v-select
          v-model="selectedPlan"
          :items="workoutPlans"
          item-title="name"
          item-value="id"
          label="Select a Workout Plan"
          class="mt-4"
          @update:modelValue="loadExercises"
        />

        <!-- Timer + Controls -->
        <div v-if="selectedPlan" class="mt-4 d-flex align-center justify-space-between">
          <div class="text-h6">⏱️ {{ formatTime(timer) }}</div>
          <div>
            <v-btn color="primary" @click="startTimer" :disabled="isRunning">Start</v-btn>
            <v-btn color="success" class="ml-2" @click="completeWorkout" :disabled="!isRunning">
              Complete
            </v-btn>
          </div>
        </div>

        <!-- Exercise List -->
        <v-list v-if="exercises.length" class="mt-4">
          <v-list-item
            v-for="exercise in exercises"
            :key="exercise.id"
            @click="toggleExerciseCompletion(exercise)"
          >
            <v-list-item-action>
              <v-checkbox
                v-model="exercise.completed"
                @click.stop="toggleExerciseCompletion(exercise)"
              />
            </v-list-item-action>
            <v-list-item-title
              :class="exercise.completed ? 'text-decoration-line-through text-grey' : ''"
            >
              {{ exercise.name }}
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <p v-else class="mt-4 text-body-2">Select a plan to view your exercises.</p>
      </v-card-text>
    </v-card>
  </v-container>
</template>