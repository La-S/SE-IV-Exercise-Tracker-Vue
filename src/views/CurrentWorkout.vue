<template>
  <v-container class="pa-4 text-center">
    <v-card 
  v-if="activeWorkout && timerStarted"
  class="pa-3 mb-4"
  color="primary"
  
  style="position: sticky; top: 80px; z-index: 10;"
>
  <div class="d-flex justify-space-between align-center">
    <div>
      <div class="text-caption">Timer</div>
      <div class="text-h5 font-weight-bold">{{ formatTime(workoutTime) }}</div>
    </div>
    <v-btn
      @click="toggleTimer"
      :color="timerPaused ? 'warning' : 'primary'"
      size="small"
      variant="outlined"
    >
      {{ timerPaused ? 'Resume' : 'Pause' }}
    </v-btn>
  </div>
  
  <v-divider v-if="restActive" class="my-2"></v-divider>
  
  <div v-if="restActive" class="text-center">
    <v-icon color="primary">mdi-timer-sand</v-icon>
    <span class="ml-2 text-body-1 font-weight-medium">
      Rest Time: {{ formatTime(restTime) }}
    </span>
  </div>
</v-card>

    <template v-if="!activeWorkout && !allWorkoutsCompleted">
      <v-row justify="center" align="center" class="mt-6">
        <v-col cols="12">
          <v-icon size="64" color="primary">mdi-weight-lifter</v-icon>
          <h2 class="text-h6 mt-2">Workouts available for the week: </h2>
        </v-col>

        <v-col cols="12" md="6">

  <v-alert
    v-if="workoutLoadError"
    type="error"
    variant="tonal"
    class="mb-4"
  >
    {{ workoutLoadError }}
  </v-alert>
  <div v-else-if="workoutsLoading" class="d-flex justify-center py-6">
    <v-progress-circular indeterminate color="primary" />
  </div>
  <template v-else>
    <v-card
  v-for="workout in weeklyWorkouts"
  :key="workout.id"
  class="workout-card pa-4 mb-4 cursor-pointer"
  hover
  @click="selectWorkout(workout)"
>
  <strong class="text-h6">{{ workout.focus_area || "Workout" }}</strong>
  <div class="date-text">{{ formatWorkoutDate(workout.expected_date) }}</div>
  <div class="text-caption mt-1">{{ workout.notes }}</div>
</v-card>
    <v-alert v-if="!weeklyWorkouts.length" type="info" variant="tonal" color="primary">
      No workouts assigned yet
    </v-alert>
  </template>
</v-col>
      </v-row>
    </template>

    <template v-else-if="activeWorkout">
      <v-card class="pa-4 mx-auto mt-4" max-width="600">
        <v-card-title class="justify-center">
          <span class="text-h6 font-weight-bold">
            {{ activeWorkout.focus_area || 'Workout' }}
          </span>
        </v-card-title>

        <v-card-subtitle v-if="activeWorkout.notes" class="text-center">
          {{ activeWorkout.notes }}
        </v-card-subtitle>

        <v-btn
          variant="tonal"
          size="small"
          class="ml-2 mb-3"
          color="primary"
          :disabled="timerStarted"
          @click="startWorkoutTimer"
        >
          {{ timerStarted ? 'Workout Started' : 'Start Workout' }}
        </v-btn>

        <v-divider class="my-2"></v-divider>

        <v-alert
          v-if="exercisesLoading"
          type="info"
          variant="tonal"
          class="my-4"
          color="primary"
        >
          <v-progress-circular indeterminate size="20" class="mr-2" />
          Loading exercises...
        </v-alert>

        <v-alert
          v-else-if="exerciseLoadError"
          type="error"
          variant="tonal"
          class="my-4"
        >
          {{ exerciseLoadError }}
        </v-alert>
        <v-list v-else-if="currentExercises.length" dense>
  <v-list-item
    v-for="(exercise, index) in currentExercises"
    :key="index"
    class="mb-4"
  >
    <v-card class="pa-4 w-100" elevation="2" rounded="lg">
      <h3 class="text-subtitle-1 font-weight-bold">
        {{ exercise.name }}
      </h3>

      <div class="text-caption mb-3">
        {{ formatLabel(exercise.type) }} • {{ formatLabel(exercise.muscleGroup) }}
      </div>

      <div v-if="exercise.notes" class="text-caption mb-2">
        Note: {{ exercise.notes }}
      </div>

      <v-chip
        v-if="exercise.restTimer"
        size="small"
        color="primary"
        variant="tonal"
        class="mb-3"
        
      >
        Rest: {{ exercise.restTimer }}s
      </v-chip>

      <template v-if="exercise.type === 'cardio'">
  <div
    v-for="(goalMile, setIndex) in exercise.goalMiles"
    :key="setIndex"
  >
    <v-card class="pa-3 mb-3 workout-card" variant="tonal" rounded="md">
      <div class="font-weight-medium mb-1">Cardio Set {{ setIndex + 1 }}</div>
      <div class="text-body-2 mb-2">
        {{ exercise.goalMiles[setIndex] }} miles  
        <span v-if="exercise.goalPace[setIndex]">
          @ {{ exercise.goalPace[setIndex] }} mins
        </span>
      </div>

      <v-text-field
        v-model="exercise.actualMiles[setIndex]"
        label="Actual distance (miles)"
        type="number"
        dense
        hide-details
        class="mb-2"
        :disabled="!timerStarted"
      />

      <v-text-field
        v-model="exercise.actualTime[setIndex]"
        label="Actual total time (mins)"
        type="number"
        dense
        hide-details
        :disabled="!timerStarted"
      />
    </v-card>
  </div>
</template>
      <template v-else>
  <div
    v-for="(set, setIndex) in exercise.sets"
    :key="setIndex"
  >
    <v-card
      class="pa-3 mb-3 workout-card"
      variant="tonal"
      rounded="md"
    >
      <div class="font-weight-medium mb-1">
        Set {{ setIndex + 1 }}
      </div>
      
      <div class="text-body-2 mb-2">
        Goal: {{ exercise.reps[setIndex] }} reps  
        <span v-if="exercise.weight[setIndex]">
          @ {{ exercise.weight[setIndex] }} lbs
        </span>
      </div>

      <v-text-field
  v-model="exercise.actualReps[setIndex]"
  label="Actual reps"
  type="number"
  variant="outlined"
  dense
  hide-details
  class="mb-2"
  :disabled="!timerStarted"
/>

<v-text-field
  v-model="exercise.actualWeight[setIndex]"
  label="Actual weight (lbs)"
  type="number"
  variant="outlined"
  dense
  hide-details
  :disabled="!timerStarted"
/>
    </v-card>
    </div>
    </template>

      <div class=" align-items-start">
 
        <v-checkbox
          color="primary"
          v-model="exercise.completed"
          label="Mark exercise complete"
          @change="handleSetCompletion(exercise)"
        />
      </div>

    </v-card>
  </v-list-item>
</v-list>
        <v-alert v-else type="info" variant="tonal" class="my-4" color="primary">
          No exercises assigned to this workout yet.
        </v-alert>

        <v-divider class="my-3"></v-divider>

        <v-btn 
  color="primary" 
  block 
  @click="completeWorkout" 
  :to="{ name: 'athlete-homepage' }"
  :disabled="currentExercises.length === 0 || !currentExercises.every(ex => ex.completed)"
>
  Complete Workout
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
import { ref, onMounted, onUnmounted } from "vue";
import apiClient from "../services/services.js";
import Utils from "../config/utils.js";
import { useRouter } from "vue-router";

const router = useRouter();

const backendWorkouts = ref([]);     
const weeklyWorkouts = ref([]);       
const activeWorkout = ref(null);
const completedWorkouts = ref([]);
const allWorkoutsCompleted = ref(false);
const currentExercises = ref([]);

const workoutsLoading = ref(true);
const workoutLoadError = ref(null);
const exercisesLoading = ref(false);
const exerciseLoadError = ref(null);

const workoutTime = ref(0);
const restTime = ref(0);
const restActive = ref(false);
const timerStarted = ref(false);
const timerPaused = ref(false);

const showEndModal = ref(false);

let workoutInterval = null;
let restInterval = null;

const resolveUserContext = () => {
  const stored = Utils.getStore("user") || {};
  const rawUserId = stored.userId ?? stored.user_id ?? stored.id;
  const userId = parseNumericId(rawUserId);
  return { userId };
};

const parseNumericId = (value) => {
  if (value === null || value === undefined) return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const formatLabel = (value) => {
  if (!value && value !== 0) return "Other";
  const label = String(value);
  return label.charAt(0).toUpperCase() + label.slice(1);
};

async function fetchWorkouts() {
  workoutsLoading.value = true;
  workoutLoadError.value = null;

  try {
    const { userId } = resolveUserContext();
    if (!userId) {
      workoutLoadError.value = "User not logged in. Please log in again.";
      workoutsLoading.value = false;
      return;
    }

    const body = {"startDate": '2025-01-01', "endDate": '2025-12-31'}
    const response = await apiClient.post(`workout/user/${userId}/dated`, body);
    backendWorkouts.value = Array.isArray(response.data) ? response.data : [];
    filterThisWeeksWorkouts();




  } catch (err) {
    console.error("Error loading workouts:", err);
    workoutLoadError.value = err?.response?.data?.message || "Unable to load workouts. Please refresh and try again.";
  } finally {
    workoutsLoading.value = false;
  }
}

function filterThisWeeksWorkouts() {
  if (!backendWorkouts.value.length) {
    weeklyWorkouts.value = [];
    return;
  }

  const today = new Date();
  const startOfWeek = new Date(today);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0,0,0,0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  endOfWeek.setHours(0,0,0,0);

  weeklyWorkouts.value = backendWorkouts.value.filter(workout => {
    if (!workout.expected_date) return false;
    if (workout.date != null) return false; 
    const workoutDate = new Date(workout.expected_date);
    return workoutDate >= startOfWeek && workoutDate < endOfWeek;
  });
}

async function fetchExercisesForWorkout(workoutId) {
  exercisesLoading.value = true;
  exerciseLoadError.value = null;
  currentExercises.value = [];

  try {
    const response = await apiClient.get(`workout/${workoutId}/exercises`);
    const exercises = Array.isArray(response.data) ? response.data : [];

    const mappedExercises = await Promise.all(
      exercises.map(async (exercise) => {
        const sets = await fetchSetsForExercise(exercise.id);

        return {
          id: exercise.id,
          assignmentId: exercise.id,
          templateId: exercise.exercise_template_id,
          name: exercise.exerciseTemplate?.name || "Unnamed Exercise",
          type: exercise.exerciseTemplate?.type || "other",
          muscleGroup: exercise.exerciseTemplate?.muscle_group || "other",
          notes: exercise.notes || "",
          restTimer: exercise.rest_timer || 30,
          completed: false,
          sets: sets.map(s => s.goal_reps || 0),
          reps: sets.map(s => s.goal_reps || 0),
          weight: sets.map(s => s.goal_weight || null),
          goalMiles: sets.map(s => s.goal_dist || null),
          goalPace: sets.map(s => s.goal_time || null),
          actualMiles: sets.map(s => s.actual_dist || null),
          actualWeight: sets.map(s => s.actual_weight || null),
          actualTime: sets.map(s => s.actual_time || 0), 
          actualReps: sets.map(s => s.actual_reps || null),
          mileTimes: "",
        };
      })
    );

    currentExercises.value = mappedExercises;

  } catch (err) {
    console.error("Error loading exercises:", err);
    exerciseLoadError.value = err?.response?.data?.message || "Unable to load exercises for this workout.";
  } finally {
    exercisesLoading.value = false;
  }
}

async function fetchSetsForExercise(exerciseId) {
  try {
    const response = await apiClient.get(`exercise/${exerciseId}/sets`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    console.error(`Error loading sets for exercise ${exerciseId}:`, err);
    return [];
  }
}

async function selectWorkout(workout) {
  activeWorkout.value = workout;
  timerStarted.value = false;
  workoutTime.value = 0;
  await fetchExercisesForWorkout(workout.id);
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
  timerPaused.value = !timerPaused.value;
}

function handleSetCompletion(exercise) {
  if (exercise.completed) {
    startRestTimer(exercise.restTimer);
  }

  const allCompleted = currentExercises.value.every(ex => ex.completed);
  if (allCompleted) {
    completeWorkout();
  }
}

async function completeWorkout() {
  if (!activeWorkout.value) return;

  clearInterval(workoutInterval);
  clearInterval(restInterval);
  restActive.value = false;
  timerStarted.value = false;
  timerPaused.value = false;

  await submitWorkout();
}

function startRestTimer(duration = 60) {
  clearInterval(restInterval);
  restActive.value = true;
  restTime.value = duration;

  restInterval = setInterval(() => {
    if (timerPaused.value) {
      return;
    }
    if (restTime.value > 0) {
      restTime.value--;
    } else {
      clearInterval(restInterval);
      restActive.value = false;
    }
  }, 1000);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function formatWorkoutDate(dateString) {
  if (!dateString) return "No date";
  const d = new Date(dateString);
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

async function submitWorkout() {
  if (!activeWorkout.value) return;

  const { userId } = resolveUserContext();
  if (!userId) return;

  try {
    await apiClient.put(`workout/${activeWorkout.value.id}`, {
      totalTime: workoutTime.value,
      date: new Date().toISOString(),
    });

    for (const exercise of currentExercises.value) {
      const setsResponse = await apiClient.get(`exercise/${exercise.id}/sets`);
      const sets = Array.isArray(setsResponse.data) ? setsResponse.data : [];

      for (let i = 0; i < sets.length; i++) {
        await apiClient.put(`set/${sets[i].id}`, {
          actualReps: exercise.actualReps[i],
          actualWeight: exercise.actualWeight[i],
          actualTime: exercise.actualTime[i],
          actualDist: exercise.actualMiles[i],
        });
      }
    }

    

  } catch (err) {
    console.error("Error submitting workout:", err);
    alert("Failed to save workout. Please try again.");
  }
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
  activeWorkout.value = null;
}

onUnmounted(() => {
  clearInterval(workoutInterval);
  clearInterval(restInterval);
});

onMounted(fetchWorkouts);
</script>

<style scoped>
.v-btn {
  border-radius: 12px;
}

.v-list-item {
  align-items: center;
}

.cursor-pointer {
  cursor: pointer;
}

.workout-card {
  background-color: var(--v-theme-card);
  color: var(--v-theme-on-surface, var(--v-theme-text));
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2); 
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}

.workout-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
}

.workout-set-card {
  background-color: var(--v-theme-surface);
  color: var(--v-theme-on-surface);
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.workout-set-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0,0,0,0.15);
}

.date-text {
  color: var(--v-theme-on-surface-variant, var(--v-theme-secondary));
  margin-top: 4px;
  font-weight: 500;
}
</style>