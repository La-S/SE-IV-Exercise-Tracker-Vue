<template>
  <v-container class="pa-4 text-center">
    <template v-if="!activeWorkout && !allWorkoutsCompleted">
      <v-row justify="center" align="center" class="mt-6">
        <v-col cols="12">
          <v-icon size="64" color="primary">mdi-weight-lifter</v-icon>
          <h2 class="text-h6 mt-2">Select a workout to get started</h2>
        </v-col>

        <v-col cols="12" md="6">
          <v-btn
            color="primary"
            size="large"
            block
            class="mb-4"
            @click="selectWorkout('individual')"
          >
            Individual Workout
          </v-btn>

          <v-btn
            color="primary"
            size="large"
            block
            @click="selectWorkout('team')"
          >
            Team Workout
          </v-btn>
        </v-col>
      </v-row>
    </template>

    <template v-else-if="activeWorkout">
      <v-card class="pa-4 mx-auto mt-4" max-width="600">
        <v-card-title class="justify-center">
          <span class="text-h6 font-weight-bold">
            {{ activeWorkout === 'individual' ? 'Individual Workout' : 'Team Workout' }}
          </span>
        </v-card-title>

        <div class="my-3 d-flex align-center justify-center">
          <v-icon color="primary">mdi-timer</v-icon>
          <span class="ml-2 text-h6">{{ formatTime(workoutTime) }}</span>

          <v-btn
            v-if="!timerStarted"
            variant="tonal"
            size="small"
            class="ml-2"
            color="success"
            @click="startWorkoutTimer"
          >
            Start Workout
          </v-btn>

          <v-btn
            v-else
            variant="tonal"
            size="small"
            class="ml-2"
            @click="toggleTimer"
          >
            {{ timerPaused ? 'Resume' : 'Pause' }}
          </v-btn>
        </div>

        <v-divider class="my-2"></v-divider>

        <v-list dense>
          <v-list-item
            v-for="(exercise, index) in currentExercises"
            :key="index"
          >
            <v-list-item-content>
              <v-list-item-title>{{ exercise.name }}</v-list-item-title>

              <template v-if="exercise.type === 'cardio'">
                <v-list-item-subtitle>
                  Goal: {{ exercise.goalMiles }} miles @ {{ exercise.goalPace }} min/mile
                </v-list-item-subtitle>
                <v-text-field
                  v-model="exercise.mileTimes"
                  label="Enter time per mile"
                  placeholder="e.g. 8:30, 8:45, 8:40"
                  dense
                  hide-details
                ></v-text-field>
                <v-text-field
                  v-model="exercise.actualMiles"
                  label="Actual miles completed"
                  type="number"
                  dense
                  hide-details
                ></v-text-field>
              </template>

              <template v-else>
                <v-list-item-subtitle>
                  {{ exercise.sets }} sets × {{ exercise.reps }} reps
                  <span v-if="exercise.weight"> @ {{ exercise.weight }} lbs</span>
                </v-list-item-subtitle>
              </template>
            </v-list-item-content>

            <v-list-item-action>
              <v-checkbox
                 color="primary"
                 v-model="exercise.completed"
                 @change="handleSetCompletion(exercise)"
              ></v-checkbox>
            </v-list-item-action>
          </v-list-item>
        </v-list>

        <div v-if="restActive" class="my-4">
          <v-icon color="amber">mdi-timer-sand</v-icon>
          <span class="ml-2 text-body-1">
            Rest Time: {{ formatTime(restTime) }}
          </span>
        </div>

        <v-divider class="my-3"></v-divider>

        <v-btn color="error" block @click="showEndModal = true">
          End Workout
        </v-btn>
      </v-card>
    </template>

    <template v-else-if="allWorkoutsCompleted">
      <div class="text-center mt-10">
        <v-icon size="64" color="primary">mdi-check-circle</v-icon>
        <h3 class="text-h6 mt-3 font-weight-medium">All workouts completed</h3>
      </div>
    </template>

    <v-dialog v-model="showEndModal" max-width="400">
      <v-card>
        <v-card-title class="text-h6">End Workout</v-card-title>
        <v-card-text>
          Do you really want to end the workout before it is completed?
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" text @click="showEndModal = false">No</v-btn>
          <v-btn color="error" text @click="confirmEndWorkout">Yes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onUnmounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const workouts = {
  individual: [
    { name: "Bench Press", sets: 3, reps: 10, weight: 135, type: "weight", completed: false },
    { name: "Squat", sets: 4, reps: 8, weight: 185, type: "weight", completed: false },
    { name: "5K Run", goalMiles: 3.1, goalPace: "8:30", type: "cardio", mileTimes: "", actualMiles: 0, completed: false },
  ],
  team: [
    { name: "Rowing", sets: 3, reps: 500, type: "weight", completed: false },
    { name: "Push Ups", sets: 3, reps: 20, type: "weight", completed: false },
    { name: "2 Mile Run", goalMiles: 2, goalPace: "9:00", type: "cardio", mileTimes: "", actualMiles: 0, completed: false },
  ],
};

const activeWorkout = ref(null);
const completedWorkouts = ref([]);
const allWorkoutsCompleted = ref(false);
const currentExercises = ref([]);

const workoutTime = ref(0);
const restTime = ref(0);
const restActive = ref(false);
const timerStarted = ref(false);
const timerPaused = ref(false);

const showEndModal = ref(false);
let workoutInterval = null;
let restInterval = null;

function selectWorkout(type) {
  activeWorkout.value = type;
  currentExercises.value = workouts[type].map((ex) => ({ ...ex }));
  timerStarted.value = false;
  workoutTime.value = 0;
}

function startWorkoutTimer() {
  clearInterval(workoutInterval);
  workoutTime.value = 0;
  timerStarted.value = true;
  timerPaused.value = false;
  workoutInterval = setInterval(() => {
    if (!timerPaused.value) workoutTime.value++;
  }, 1000);
}

function toggleTimer() {
  if (timerPaused.value && restActive.value) {
    clearInterval(restInterval);
    restActive.value = false;
  }

  timerPaused.value = !timerPaused.value;
}

function handleSetCompletion(exercise) {
  if (exercise.completed) {
    if (workoutInterval && !timerPaused.value) {
      timerPaused.value = true;
    }

    startRestTimer();
  }

  const allCompleted = currentExercises.value.every((ex) => ex.completed);
  if (allCompleted) {
    completeWorkout();
  }
}


function startRestTimer() {
  clearInterval(restInterval);

  restActive.value = true;
  restTime.value = 60;

  restInterval = setInterval(() => {
    if (restTime.value > 0) {
      restTime.value--;
    } else {
      clearInterval(restInterval);
      restActive.value = false;
      timerPaused.value = false;
    }
  }, 1000);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function confirmEndWorkout() {
  showEndModal.value = false;
  endWorkout();
}

function endWorkout() {
  clearInterval(workoutInterval);
  clearInterval(restInterval);
  restActive.value = false;
  workoutTime.value = 0;
  timerStarted.value = false;

  if (activeWorkout.value && !completedWorkouts.value.includes(activeWorkout.value)) {
    completedWorkouts.value.push(activeWorkout.value);
  }

  if (completedWorkouts.value.length < 2) {
    const next =
      activeWorkout.value === "individual" ? "team" : "individual";
    activeWorkout.value = null;
    setTimeout(() => selectWorkout(next), 1500);
  } else {
    allWorkoutsCompleted.value = true;
    activeWorkout.value = null;
    setTimeout(() => router.push({ name: "athlete-homepage" }), 3000);
  }
}

function completeWorkout() {
  endWorkout();
}

onUnmounted(() => {
  clearInterval(workoutInterval);
  clearInterval(restInterval);
});
</script>

<style scoped>
.v-btn {
  border-radius: 12px;
}
.v-list-item {
  align-items: center;
}
</style>