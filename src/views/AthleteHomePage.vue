<template>
  <v-container class="py-4 px-3" fluid>
    <v-alert
      v-if="isLoading"
      type="info"
      variant="tonal"
      class="mb-4"
      color="primary"
    >
      <v-progress-circular indeterminate size="20" class="mr-2" />
      Loading statistics...
    </v-alert>

    <v-alert
      v-if="loadError"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ loadError }}
    </v-alert>

    <v-row class="mb-4" dense>
      <v-col cols="12">
        <v-btn
          color="primary"
          size="large"
          block
          class="mb-4"
          :to="{ name: 'current-workout' }"
        >
          Go To Workouts
        </v-btn>
        <v-card class="pa-3 elevation-2" rounded="xl">
          <v-card-title class="text-subtitle-1 font-weight-bold">
            Workouts Completed This Week
          </v-card-title>
          <v-card-text class="pt-2">
            <div class="d-flex flex-column align-center text-center">
              <div class="text-body-2 mb-2">
                {{ completedThisWeek }} / {{ totalThisWeek }} Workouts
              </div>
              <v-progress-linear
                :model-value="weeklyCompletionRate"
                height="10"
                color="primary"
                rounded
                striped
                class="w-100"
              ></v-progress-linear>
              <div class="text-caption mt-2 grey--text">
                {{ weeklyCompletionRate }}% Complete this week
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-4" dense>
      <v-col cols="12">
        <v-card class="pa-3 elevation-2" rounded="xl">
          <v-card-title class="text-subtitle-1 font-weight-bold">
            Average Mile Time
          </v-card-title>
          <v-card-text class="pt-2">
            <div class="d-flex flex-column align-center text-center">
              <div class="text-h5 font-weight-bold">{{ averageMileTime }}</div>
              <div class="text-caption grey--text mb-2">
                {{ mileTimeSubtext }}
              </div>
            </div>
            <v-sparkline
              v-if="mileTimeHistory.length > 0"
              :value="mileTimeHistory"
              color="primary"
              height="60"
              smooth
              line-width="3"
              padding="8"
            ></v-sparkline>
            <div v-else class="text-caption text-center grey--text">
              No cardio data available for the week
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row dense>
      <v-col cols="12">
        <v-card class="pa-3 elevation-2" rounded="xl">
          <v-card-title class="text-subtitle-1 font-weight-bold">
            Lifting History
          </v-card-title>
          <v-card-text class="pt-2">
  <div
    v-if="Object.keys(personalRecords).length > 0"
    v-for="(weight, exercise) in personalRecords"
    :key="exercise"
    class="d-flex justify-space-between text-body-2 mb-1"
  >
    <span>{{ exercise }}</span>
    <span class="font-weight-medium">{{ weight }} lbs</span>
  </div>
  <div class="d-flex flex-column align-center text-center mt-2">
    <div class="text-caption grey--text">
      {{ liftingSubtext }}
    </div>
  </div>
</v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import Utils from "../config/utils.js";
import dayjs from 'dayjs';
import apiClient from "../services/apiService";

const completedThisWeek = ref(0);
const totalThisWeek = ref(0);
const averageMileTime = ref("--:--");
const mileTimeHistory = ref([]);
const personalRecords = ref({});
const isLoading = ref(true);
const loadError = ref(null);

const weeklyCompletionRate = computed(() => {
  if (totalThisWeek.value === 0) return 0;
  return Math.round((completedThisWeek.value / totalThisWeek.value) * 100);
});

const mileTimeSubtext = computed(() => {
  if (mileTimeHistory.value.length === 0) {
    return "";
  }
  return "Based on times from last cardio workout";
});

const liftingSubtext = computed(() => {
  if (Object.keys(personalRecords.value).length === 0) {
    return "No lifting data available for the week";
  }
  return "Based on weight lifted in last workout";
});

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

const formatTimeMinutes = (seconds) => {
  if (!seconds || seconds === 0) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")} / mile`;
};

const fetchWeeklyStats = async (userId) => {
  try {
    const body = {"startDate": dayjs().subtract(7, 'day').toISOString(), "endDate": dayjs().add(7, 'day').toISOString()}
    const response = await apiClient.post(`workout/user/${userId}/dated`, body);
    const workouts = Array.isArray(response.data) ? response.data : [];

    const today = new Date();
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    endOfWeek.setHours(0, 0, 0, 0);

    const thisWeekWorkouts = workouts.filter((workout) => {
      if (!workout.expected_date) return false;
      const workoutDate = new Date(workout.expected_date);
      return workoutDate >= startOfWeek && workoutDate < endOfWeek;
    });

    totalThisWeek.value = thisWeekWorkouts.length;
    completedThisWeek.value = thisWeekWorkouts.filter((w) => w.date != null).length;

    return workouts;
  } catch (err) {
    console.error("Error fetching weekly stats:", err);
    throw err;
  }
};

const fetchCardioStats = async (workouts) => {
  try {
    const completedWorkouts = workouts
      .filter((w) => w.date != null)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const cardioTimesFromLastWorkout = [];
    let foundCardio = false;

    for (const workout of completedWorkouts) {
      try {
        const exercisesResponse = await apiClient.get(`workout/${workout.id}/exercises`);
        const exercises = Array.isArray(exercisesResponse.data) ? exercisesResponse.data : [];

        for (const exercise of exercises) {
          if (exercise.exerciseTemplate?.type === "cardio") {
            const setsResponse = await apiClient.get(`exercise/${exercise.id}/sets`);
            const sets = Array.isArray(setsResponse.data) ? setsResponse.data : [];

            for (const set of sets) {
              if (set.actual_time && set.actual_dist && set.actual_dist > 0) {
                const pacePerMile = set.actual_time / set.actual_dist;
                cardioTimesFromLastWorkout.push(pacePerMile);
                foundCardio = true;
              }
            }
          }
        }
        if (foundCardio) break;
      } catch (err) {
        console.error(`Error fetching exercises for workout ${workout.id}:`, err);
      }
    }

    if (cardioTimesFromLastWorkout.length > 0) {
      mileTimeHistory.value = cardioTimesFromLastWorkout;
      const averagePace = cardioTimesFromLastWorkout.reduce((sum, pace) => sum + pace, 0) / cardioTimesFromLastWorkout.length;
      averageMileTime.value = formatTimeMinutes(averagePace);
    }
  } catch (err) {
    console.error("Error fetching cardio stats:", err);
  }
};

const fetchLiftingStats = async (workouts) => {
  try {
    const completedWorkouts = workouts
      .filter((w) => w.date != null)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (completedWorkouts.length === 0) return;

    const lastWorkout = completedWorkouts[0];
    const exercisesResponse = await apiClient.get(`workout/${lastWorkout.id}/exercises`);
    const exercises = Array.isArray(exercisesResponse.data) ? exercisesResponse.data : [];

    const records = {};

    for (const exercise of exercises) {
      if (exercise.exerciseTemplate?.type !== "cardio") {
        const setsResponse = await apiClient.get(`exercise/${exercise.id}/sets`);
        const sets = Array.isArray(setsResponse.data) ? setsResponse.data : [];

        const maxWeight = Math.max(
          ...sets.map((s) => s.actual_weight || 0).filter((w) => w > 0)
        );

        if (maxWeight > 0) {
          const exerciseName = exercise.exerciseTemplate?.name || "Unknown Exercise";
          records[exerciseName] = maxWeight;
        }
      }
    }

    personalRecords.value = records;
  } catch (err) {
    console.error("Error fetching lifting stats:", err);
  }
};

const fetchAllStatistics = async () => {
  isLoading.value = true;
  loadError.value = null;

  try {
    const { userId } = resolveUserContext();
    if (!userId) {
      loadError.value = "User not logged in. Please log in again";
      isLoading.value = false;
      return;
    }

    const workouts = await fetchWeeklyStats(userId);
    await Promise.all([
      fetchCardioStats(workouts),
      fetchLiftingStats(workouts)
    ]);

  } catch (err) {
    console.error("Error loading statistics:", err);
    loadError.value =
      err?.response?.data?.message || "Unable to load statistics. Please refresh and try again.";
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchAllStatistics);
</script>

<style scoped>
.v-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.v-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.text-h5 {
  font-size: 1.25rem;
}

.text-body-2 {
  font-size: 0.9rem;
}

.v-container {
  max-width: 600px;
  margin: auto;
}
</style>