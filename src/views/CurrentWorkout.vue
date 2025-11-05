<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import Utils from "../config/utils";

const router = useRouter();

const user = ref(null);
const selectedPlan = ref(null);
const selectedPlanType = ref(null);
const selectedView = ref("workout");
const exercises = ref([]);
const timer = ref(0);
const isRunning = ref(false);
let timerInterval = null;

const workoutPlans = ref({
  team: [],
  individual: [],
});

const fullName = computed(() => {
  if (!user.value) return "";
  const fName = user.value.fName ?? "";
  const lName = user.value.lName ?? "";
  return `${fName} ${lName}`.trim();
});

function loadWorkoutPlans() {
  workoutPlans.value.team = [
    { id: "t1", name: "Team Strength Circuit", description: "High intensity team workout" },
    { id: "t2", name: "Team Cardio Challenge", description: "Endurance cardio exercises for team" },
    { id: "t3", name: "Endurance Relay", description: "Relay-based team endurance training" },
  ];

  workoutPlans.value.individual = [
    { id: "i1", name: "Full Body Blast", description: "Full body individual routine" },
    { id: "i2", name: "Leg Day Routine", description: "Lower body focused individual workout" },
    { id: "i3", name: "Core Strength Builder", description: "Individual core and abs workout" },
  ];
}

function loadExercises(planId) {
  const data = {
    t1: [
      { id: 1, name: "Burpees", completed: false },
      { id: 2, name: "Mountain Climbers", completed: false },
      { id: 3, name: "High Knees", completed: false },
    ],
    t2: [
      { id: 4, name: "Jump Rope", completed: false },
      { id: 5, name: "Sprints", completed: false },
      { id: 6, name: "Cooldown Jog", completed: false },
    ],
    t3: [
      { id: 7, name: "Lateral Hops", completed: false },
      { id: 8, name: "Row Machine", completed: false },
      { id: 9, name: "Team Plank Hold", completed: false },
    ],
    i1: [
      { id: 10, name: "Push-ups", completed: false },
      { id: 11, name: "Squats", completed: false },
      { id: 12, name: "Plank", completed: false },
    ],
    i2: [
      { id: 13, name: "Lunges", completed: false },
      { id: 14, name: "Leg Press", completed: false },
      { id: 15, name: "Calf Raises", completed: false },
    ],
    i3: [
      { id: 16, name: "Crunches", completed: false },
      { id: 17, name: "Leg Raises", completed: false },
      { id: 18, name: "Russian Twists", completed: false },
    ],
  };

  exercises.value = data[planId] || [];
  selectedPlan.value =
    workoutPlans.value.team.find((p) => p.id === planId) ||
    workoutPlans.value.individual.find((p) => p.id === planId);

  selectedPlanType.value = workoutPlans.value.team.some((p) => p.id === planId)
    ? "team"
    : "individual";

  selectedView.value = "workout";
  resetWorkout();
}

function selectStatistics() {
  selectedView.value = "statistics";
  router.push({ name: "AthleteStatistics" });
}

function toggleExerciseCompletion(exercise) {
  exercise.completed = !exercise.completed;
}

function startTimer() {
  if (timer.value > 0) return;
  isRunning.value = true;
  timerInterval = setInterval(() => {
    timer.value++;
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning.value = false;
}

function resumeTimer() {
  if (isRunning.value) return;
  isRunning.value = true;
  timerInterval = setInterval(() => {
    timer.value++;
  }, 1000);
}

function cancelWorkout() {
  resetWorkout();
  selectedPlan.value = null;
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
    plan: selectedPlan.value?.name,
    timeElapsed: timer.value,
    exercises: exercises.value,
    completedAt: new Date().toISOString(),
  };
  console.log("Workout complete:", workoutData);
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
  <v-container fluid class="pa-6">
    <v-row align="stretch" justify="center" no-gutters>

      <v-col cols="12" lg="3" class="pr-lg-4">
        <v-card class="d-flex flex-column">
          <v-card-text class="flex-grow-1 overflow-y-auto pr-2">
            <v-list dense nav>
            
              <v-list-item>
                <v-list-item-title class="font-weight-medium text-subtitle-1">
                  Workout Plans
                </v-list-item-title>
              </v-list-item>

              <v-expansion-panels multiple elevation="0" flat>
                <v-expansion-panel>
                  <v-expansion-panel-title class="font-weight-medium">
                    Team Workouts
                  </v-expansion-panel-title>
                  <v-expansion-panel-text class="px-0">
                    <v-list dense nav>
                      <v-list-item
                        v-for="plan in workoutPlans.team"
                        :key="plan.id"
                        :active="selectedPlan?.id === plan.id && selectedView === 'workout'"
                        rounded
                        @click="loadExercises(plan.id)"
                      >
                        <v-list-item-title>{{ plan.name }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <v-expansion-panel>
                  <v-expansion-panel-title class="font-weight-medium">
                    Individual Workouts
                  </v-expansion-panel-title>
                  <v-expansion-panel-text class="px-0">
                    <v-list dense nav>
                      <v-list-item
                        v-for="plan in workoutPlans.individual"
                        :key="plan.id"
                        :active="selectedPlan?.id === plan.id && selectedView === 'workout'"
                        rounded
                        @click="loadExercises(plan.id)"
                      >
                        <v-list-item-title>{{ plan.name }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>

              <v-divider class="my-4" />

              <v-list-item
                :active="selectedView === 'statistics'"
                rounded
                @click="selectStatistics"
              >
                <v-list-item-title class="font-weight-medium text-subtitle-1">
                  Statistics
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6" class="px-lg-4 mt-6 mt-lg-0">
        <v-card v-if="selectedPlan" class="h-100">
          <v-card-title class="d-flex flex-column align-start">
            <span class="text-h5">{{ selectedPlan.name }}</span>
            <span class="text-subtitle-2 text-medium-emphasis">
              {{ selectedPlan.description || "No description provided." }}
            </span>
          </v-card-title>
          <v-divider />

          <v-card-text>
            <div class="d-flex align-center justify-space-between mb-4">
              <div class="text-h6 d-flex align-center">
                <v-icon class="mr-2" color="#58f707">mdi-timer-outline</v-icon>
                {{ formatTime(timer) }}
              </div>

              <div>
                <v-btn color="primary" @click="startTimer" :disabled="timer > 0">
                  Start
                </v-btn>

                <v-btn color="warning" class="ml-2" v-if="isRunning" @click="pauseTimer">
                  Pause
                </v-btn>

                <v-btn color="primary" class="ml-2" v-else-if="timer > 0" @click="resumeTimer">
                  Resume
                </v-btn>

                <v-btn color="success" class="ml-2" @click="completeWorkout" :disabled="timer === 0">
                  Complete
                </v-btn>

                <v-btn color="error" class="ml-2" @click="cancelWorkout" :disabled="timer === 0">
                  Cancel
                </v-btn>
              </div>
            </div>

            <v-list v-if="exercises.length">
              <v-list-item
                v-for="exercise in exercises"
                :key="exercise.id"
                @click="toggleExerciseCompletion(exercise)"
              >
                <v-list-item-title
                  :class="exercise.completed ? 'text-decoration-line-through text-grey' : ''"
                >
                  {{ exercise.name }}
                </v-list-item-title>

                <v-list-item-action>
                  <v-checkbox
                    v-model="exercise.completed"
                    @click.stop="toggleExerciseCompletion(exercise)"
                  />
                </v-list-item-action>
              </v-list-item>
            </v-list>

            <p v-else class="mt-4 text-body-2">
              Select a plan to view your exercises
            </p>
          </v-card-text>
        </v-card>

        <div v-else class="text-center py-12">
          <v-icon size="56" color="primary">mdi-weight-lifter</v-icon>
          <p class="text-body-1 mt-3">
            Select a workout plan from the sidebar to get started
          </p>
        </div>
      </v-col>
      <v-col cols="12" lg="3" class="pl-lg-4 mt-6 mt-lg-0"></v-col>
    </v-row>
  </v-container>
</template>