<script setup>
import { computed, onMounted, ref } from "vue";
import Utils from "../config/utils";
import apiClient from "../services/services.js";

const user = ref(Utils.getStore("user"));
const workouts = ref([]);
const loading = ref(false);
const loadError = ref("");
const lastUpdated = ref(null);

const resolvedCoachId = computed(() => {
  const raw =
    user.value?.coachId ?? user.value?.userId ?? user.value?.id ?? user.value?.user_id ?? null;
  if (raw === null || raw === undefined) return null;
  const numericValue = Number(raw);
  if (Number.isFinite(numericValue) && numericValue > 0) return numericValue;
  const trimmed = String(raw).trim();
  return trimmed.length ? trimmed : null;
});

const safeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeWorkout = (workout) => ({
  id: workout.id,
  athleteId: workout.user_id ?? null,
  coachId: workout.coach_id ?? null,
  expectedDate: safeDate(workout.expected_date),
  completedOn: safeDate(workout.date),
});

const normalizedWorkouts = computed(() => workouts.value.map(normalizeWorkout));

const matchesId = (candidate, target) => {
  if (candidate === null || candidate === undefined || target === null || target === undefined) {
    return false;
  }
  if (typeof target === "number") {
    return Number(candidate) === target;
  }
  return String(candidate) === String(target);
};

const coachWorkouts = computed(() => {
  if (!resolvedCoachId.value) return normalizedWorkouts.value;
  return normalizedWorkouts.value.filter((workout) =>
    [workout.coachId, workout.athleteId].some((candidate) =>
      matchesId(candidate, resolvedCoachId.value)
    )
  );
});

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const statusCounts = computed(() => {
  const counts = { completed: 0, upcoming: 0, overdue: 0 };
  const today = startOfToday();
  coachWorkouts.value.forEach((workout) => {
    if (workout.completedOn) {
      counts.completed += 1;
      return;
    }
    if (!workout.expectedDate) {
      counts.upcoming += 1;
      return;
    }
    if (workout.expectedDate >= today) {
      counts.upcoming += 1;
    } else {
      counts.overdue += 1;
    }
  });
  return counts;
});

const hasWorkouts = computed(() => coachWorkouts.value.length > 0);

const loadWorkouts = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    const response = await apiClient.get("workout");
    const data = Array.isArray(response.data) ? response.data : [];
    workouts.value = data;
    lastUpdated.value = new Date();
  } catch (error) {
    console.error("Failed to load workouts", error);
    loadError.value =
      error?.response?.data?.message || "Unable to load workouts. Please try again.";
  } finally {
    loading.value = false;
  }
};

const refreshDashboard = () => {
  if (!loading.value) {
    loadWorkouts();
  }
};

onMounted(() => {
  user.value = Utils.getStore("user");
  loadWorkouts();
});
</script>

<template>
  <v-container fluid class="py-6 px-4 px-md-8">
    <v-toolbar color="transparent" elevation="0" class="px-0">
      <div>
        <div class="text-h5 font-weight-bold">Coach Dashboard</div>
        <div class="text-body-2 text-medium-emphasis">
          Monitor your team's workload and upcoming coaching commitments.
        </div>
      </div>
      <v-spacer />
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-refresh"
        :loading="loading"
        @click="refreshDashboard"
      >
        Refresh
      </v-btn>
    </v-toolbar>

    <v-alert
      v-if="loadError"
      type="error"
      variant="tonal"
      class="mb-4"
      border="start"
      density="comfortable"
    >
      {{ loadError }}
    </v-alert>

    <div v-if="loading && !hasWorkouts" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate size="56" color="primary" />
    </div>

    <div v-else>
      <v-row class="mb-4" dense>
        <v-col cols="12" sm="6" lg="4">
          <v-card class="pa-4 summary-card" elevation="1">
            <div class="text-caption text-medium-emphasis mb-1">Completed</div>
            <div class="summary-value">{{ statusCounts.completed }}</div>
            <div class="text-caption text-medium-emphasis">Marked as done</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="4">
          <v-card class="pa-4 summary-card" elevation="1">
            <div class="text-caption text-medium-emphasis mb-1">Upcoming</div>
            <div class="summary-value">{{ statusCounts.upcoming }}</div>
            <div class="text-caption text-medium-emphasis">Scheduled today or later</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="4">
          <v-card class="pa-4 summary-card" elevation="1">
            <div class="text-caption text-medium-emphasis mb-1">Overdue</div>
            <div class="summary-value">{{ statusCounts.overdue }}</div>
            <div class="text-caption text-medium-emphasis">Need attention</div>
          </v-card>
        </v-col>
      </v-row>

      <div v-if="!hasWorkouts && !loading" class="text-body-2 text-medium-emphasis">
        No workouts assigned yet. Create a plan to get started.
      </div>

    </div>
  </v-container>
</template>

<style scoped>
.summary-card {
  min-height: 128px;
}

.summary-value {
  font-size: 2.75rem;
  font-weight: 600;
  line-height: 1.2;
}
</style>
