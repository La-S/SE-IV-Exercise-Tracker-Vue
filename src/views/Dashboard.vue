<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "vue-chartjs";
import Utils from "../config/utils";
import apiClient from "../services/services.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const user = ref(Utils.getStore("user"));
const workouts = ref([]);
const athleteNames = reactive({});
const loading = ref(false);
const loadError = ref("");
const lastUpdated = ref(null);
const router = useRouter();

const pendingAthleteLookups = new Set();

const ensureAthleteName = async (athleteId) => {
  if (!athleteId || athleteNames[athleteId]) {
    return;
  }
  if (pendingAthleteLookups.has(athleteId)) {
    return;
  }
  pendingAthleteLookups.add(athleteId);
  try {
    const response = await apiClient.get(`/users/${athleteId}`);
    const person = response?.data;
    if (!person) {
      return;
    }
    const first = person.first_name ?? person.firstName ?? "";
    const last = person.last_name ?? person.lastName ?? "";
    const fullName = `${first} ${last}`.trim() || `Athlete ${athleteId}`;
    athleteNames[athleteId] = fullName;
  } catch (error) {
    console.error(`Failed to load athlete ${athleteId}`, error);
  } finally {
    pendingAthleteLookups.delete(athleteId);
  }
};

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
  updatedAt: safeDate(workout.updatedAt),
  title: workout.focus_area ?? `Workout #${workout.id}`,
  parentId: workout.parent_id ?? null,
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

const teamScopedWorkouts = computed(() => {
  if (selectedTeamId.value === "all") return coachWorkouts.value;
  const members = teamMembersCache.get(selectedTeamId.value) || [];
  if (!members.length) return [];
  return coachWorkouts.value.filter((workout) =>
    members.some((memberId) => matchesId(memberId, workout.athleteId))
  );
});

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const hasWorkouts = computed(() => teamScopedWorkouts.value.length > 0);
const workoutsWithoutSchedule = computed(() =>
  teamScopedWorkouts.value.filter(
    (workout) => workout.parentId && !workout.expectedDate && !workout.completedOn
  ).length
);

const weeklyWorkload = computed(() => {
  const today = startOfToday();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay()); 
  const dayCount = 8; 

  const days = Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      date,
      upcoming: 0,
      overdue: 0,
      completed: 0,
    };
  });

  teamScopedWorkouts.value.forEach((workout) => {
    if (!workout.expectedDate) return;
    const compare = new Date(workout.expectedDate);
    compare.setHours(0, 0, 0, 0);
    const diff = Math.round((compare - start) / 86400000);
    if (diff < 0 || diff >= dayCount) {
      return;
    }
    const bucket = days[diff];
    if (!bucket) return;
    if (workout.completedOn) {
      bucket.completed += 1;
    } else if (compare < today) {
      bucket.overdue += 1;
    } else {
      bucket.upcoming += 1;
    }
  });

  return days;
});

const upcomingAssignments = computed(() => {
  const today = startOfToday();
  return teamScopedWorkouts.value
    .filter(
      (workout) =>
        workout.expectedDate &&
        workout.expectedDate >= today &&
        !workout.completedOn
    )
    .map((workout) => {
      const sourcePlan = workout.parentId
        ? coachWorkouts.value.find((plan) => plan.id === workout.parentId)
        : workout;
      return {
        ...workout,
        teamName: sourcePlan && sourcePlan.focusArea ? sourcePlan.focusArea : null,
      };
    })
    .sort((a, b) => a.expectedDate - b.expectedDate)
    .slice(0, 5);
});

const recentlyCompleted = computed(() =>
  teamScopedWorkouts.value
    .filter((workout) => workout.completedOn && workout.parentId)
    .map((workout) => {
      const sourcePlan = workout.parentId
        ? teamScopedWorkouts.value.find((plan) => plan.id === workout.parentId)
        : workout;
      return {
        ...workout,
        teamName: sourcePlan && sourcePlan.focusArea ? sourcePlan.focusArea : null,
      };
    })
    .sort((a, b) => b.completedOn - a.completedOn)
    .slice(0, 5)
);

const weeklyChartData = computed(() => ({
  labels: weeklyWorkload.value.map((day) => day.label),
  datasets: [
    {
      label: "Completed",
      data: weeklyWorkload.value.map((day) => day.completed),
      backgroundColor: "#43a047",
      borderRadius: 8,
      barThickness: 20,
      stack: "week",
    },
    {
      label: "Upcoming",
      data: weeklyWorkload.value.map((day) => day.upcoming),
      backgroundColor: "#1976d2",
      borderRadius: 8,
      barThickness: 20,
      stack: "week",
    },
    {
      label: "Overdue",
      data: weeklyWorkload.value.map((day) => day.overdue),
      backgroundColor: "#fb8c00",
      borderRadius: 8,
      barThickness: 20,
      stack: "week",
    },
  ],
}));

const weeklyChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom" },
    tooltip: {
      callbacks: {
        label: (context) => `${context.dataset.label}: ${context.parsed.y}`,
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: { display: false },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      ticks: { precision: 0 },
      grid: { borderDash: [4, 4] },
    },
  },
};

const assignmentDetailsDialog = ref(false);
const assignmentDetailsLoading = ref(false);
const assignmentDetailsError = ref("");
const assignmentDetails = ref(null);
const assignmentExercises = ref([]);
const assignmentShowActuals = ref(false);
const assignmentTeamNames = ref([]);
const templateNameCache = new Map();
const teamListCache = ref([]);
const teamMembersCache = new Map();
const athleteTeamsCache = new Map();
const selectedTeamId = ref("all");
const teamsLoading = ref(false);

const coachTeams = computed(() => {
  if (!teamListCache.value.length) return [];
  const coachId = resolvedCoachId.value;
  if (!coachId) return [];
  return teamListCache.value.filter((team) => {
    const members = teamMembersCache.get(team.id) || [];
    return members.some((memberId) => matchesId(memberId, coachId));
  });
});

const teamFilterOptions = computed(() => {
  const options = [{ label: "All teams", value: "all" }];
  const teams = coachTeams.value;
  if (!teams.length) return options;
  return options.concat(
    teams.map((team) => ({
      label: team.name ?? `Team ${team.id}`,
      value: team.id,
    }))
  );
});

const resetAssignmentDetails = () => {
  assignmentDetails.value = null;
  assignmentExercises.value = [];
  assignmentDetailsError.value = "";
  assignmentTeamNames.value = [];
  assignmentShowActuals.value = false;
};

const openAssignmentDetails = async (assignment) => {
  if (!assignment) return;
  resetAssignmentDetails();
  assignmentDetailsDialog.value = true;
  assignmentDetailsLoading.value = true;
  assignmentDetails.value = assignment;
  assignmentShowActuals.value = Boolean(assignment.completedOn);
  try {
    assignmentTeamNames.value = await loadTeamNamesForAthlete(assignment.athleteId);
    const response = await apiClient.get(`workout/${assignment.id}/exercises`);
    const exercises = Array.isArray(response.data) ? response.data : [];
    assignmentExercises.value = await Promise.all(
      exercises.map(async (item) => {
        const templateId = item.exercise_template_id ?? item.exercise_template?.id;
        const name = await resolveExerciseName(item, templateId);
        return {
          id: item.id,
          name,
          type: item.exercise_template?.type ?? "",
          muscleGroup: item.exercise_template?.muscle_group ?? "",
          notes: item.notes ?? "",
          restTimer: item.rest_timer ?? item.restTimer ?? "",
          sets: Array.isArray(item.sets) ? item.sets : [],
        };
      })
    );
  } catch (error) {
    console.error(`Failed to load workout ${assignment.id} details`, error);
    assignmentDetailsError.value =
      error?.response?.data?.message || "Unable to load workout details.";
  } finally {
    assignmentDetailsLoading.value = false;
  }
};

const resolveExerciseName = async (exercise, templateId) => {
  if (exercise.exercise_template?.name) return exercise.exercise_template.name;
  if (exercise.name) return exercise.name;
  if (templateId) {
    if (templateNameCache.has(templateId)) {
      return templateNameCache.get(templateId);
    }
    try {
      const response = await apiClient.get(`exerciseTemplate/${templateId}`);
      const templateName = response.data?.name ?? `Exercise #${templateId}`;
      templateNameCache.set(templateId, templateName);
      return templateName;
    } catch (error) {
      console.error(`Failed to load template ${templateId}`, error);
      return `Exercise #${templateId}`;
    }
  }
  return `Exercise #${exercise.id}`;
};

const ensureTeamsLoaded = async () => {
  if (teamListCache.value.length) return;
  const response = await apiClient.get("team");
  teamListCache.value = Array.isArray(response.data) ? response.data : [];
};

const loadTeamNamesForAthlete = async (athleteId) => {
  if (!athleteId) return [];
  if (athleteTeamsCache.has(athleteId)) {
    return athleteTeamsCache.get(athleteId);
  }
  await ensureTeamsLoaded();
  await ensureAllTeamMembersLoaded();
  const teamNames = [];
  await Promise.all(
    teamListCache.value.map(async (team) => {
      try {
        let members = teamMembersCache.get(team.id) || [];
        if (members.some((memberId) => matchesId(memberId, athleteId))) {
          teamNames.push(team.name ?? `Team ${team.id}`);
        }
      } catch (error) {
        console.error(`Failed to load users for team ${team.id}`, error);
      }
    })
  );
  athleteTeamsCache.set(athleteId, teamNames);
  return teamNames;
};

const ensureAllTeamMembersLoaded = async () => {
  if (teamMembersCache.size && teamMembersCache.size === teamListCache.value.length) {
    return;
  }
  teamsLoading.value = true;
  try {
    await ensureTeamsLoaded();
    await Promise.all(
      teamListCache.value.map(async (team) => {
        if (teamMembersCache.has(team.id)) return;
        const resp = await apiClient.get(`team/${team.id}/users`);
        const members = Array.isArray(resp.data)
          ? resp.data.map((member) => member.id ?? member.user_id ?? member.userId)
          : [];
        teamMembersCache.set(team.id, members);
      })
    );
  } catch (error) {
    console.error("Failed to load team members", error);
  } finally {
    teamsLoading.value = false;
  }
};

const loadWorkouts = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    await ensureTeamsLoaded();
    await ensureAllTeamMembersLoaded();
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

const quickActions = [
  {
    label: "Create Plan",
    icon: "mdi-calendar-plus",
    color: "primary",
    description: "Start a new workout template for your athletes.",
    action: () => router.push({ name: "exercise-plans", query: { newPlan: "true" } }),
  },
  {
    label: "Assign Plan",
    icon: "mdi-account-multiple-plus",
    color: "primary",
    description: "Send a plan to one or more teams.",
    action: () => router.push({ name: "exercise-plans" }),
  },
  {
    label: "View Teams",
    icon: "mdi-account-group",
    color: "primary",
    description: "Check roster and readiness for each team.",
    action: () => router.push({ name: "teams" }),
  },
];

const runQuickAction = (action) => {
  try {
    action?.action?.();
  } catch (error) {
    console.error("Failed to run quick action", error);
  }
};

const formatDateLabel = (date) => {
  if (!date) return "Not scheduled";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const formatAthleteLabel = (assignment) => {
  if (assignment.teamName) {
    return assignment.teamName;
  }
  if (assignment.athleteId === null || assignment.athleteId === undefined) {
    return "Coach plan";
  }
  if (!athleteNames[assignment.athleteId]) {
    ensureAthleteName(assignment.athleteId);
  }
  return athleteNames[assignment.athleteId] ?? `Athlete ${assignment.athleteId}`;
};

const exerciseLines = (exercise) => {
  const lines = [];
  const setLines = formatSetsSummaryLines(exercise.sets, assignmentShowActuals.value);
  lines.push(...setLines);
  if (exercise.type || exercise.muscleGroup) {
    lines.push([exercise.type, exercise.muscleGroup].filter(Boolean).join(" • "));
  }
  if (exercise.restTimer) lines.push(`Rest ${exercise.restTimer}s`);
  if (exercise.notes) lines.push(exercise.notes);
  return lines;
};

const formatSetsSummaryLines = (sets, showActual) => {
  if (!Array.isArray(sets) || !sets.length) return [];
  const lines = [];
  sets.forEach((set, index) => {
    const goal = formatSetMetrics(set.goal_reps, set.goal_weight, set.goal_time, set.goal_dist, set.dist_units);
    const actual = showActual
      ? formatSetMetrics(
          set.actual_reps,
          set.actual_weight,
          set.actual_time,
          set.actual_dist,
          set.dist_units
        )
      : "";
    const label = sets.length > 1 ? `Set ${index + 1}` : "Set";
    const parts = [];
    if (goal) parts.push(`Goal: ${goal}`);
    if (actual) parts.push(`Actual: ${actual}`);
    if (parts.length) {
      lines.push(`${label}: ${parts.join(" • ")}`);
    }
  });
  return lines;
};

const formatSetMetrics = (reps, weight, time, dist, distUnits) => {
  const parts = [];
  if (reps) parts.push(`${reps} reps`);
  if (weight) parts.push(`@ ${weight}`);
  if (time) parts.push(`${time}s`);
  if (dist) {
    const units = distUnits ? ` ${distUnits}` : "";
    parts.push(`${dist}${units}`);
  }
  return parts.join(" ");
};

const assignmentStatusCounts = computed(() => {
  const counts = { upcoming: 0, completed: 0, overdue: 0 };
  const today = startOfToday();
  teamScopedWorkouts.value.forEach((workout) => {
    if (workout.completedOn) {
      counts.completed += 1;
    } else if (!workout.expectedDate) {
      counts.upcoming += 1;
    } else if (workout.expectedDate >= today) {
      counts.upcoming += 1;
    } else {
      counts.overdue += 1;
    }
  });
  return counts;
});

watch(
  () =>
    coachWorkouts.value
      .map((workout) => workout.athleteId)
      .filter((id) => id !== null && id !== undefined),
  (athleteIds) => {
    const uniqueIds = [...new Set(athleteIds)];
    uniqueIds.forEach((id) => {
      ensureAthleteName(id);
    });
  },
  { immediate: true }
);

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
      <v-row class="mb-2" dense>
        <v-col cols="12" md="4" lg="3">
          <v-select
            v-model="selectedTeamId"
            :items="teamFilterOptions"
            item-title="label"
            item-value="value"
            label="Filter by team"
            density="compact"
            variant="outlined"
            :loading="teamsLoading"
            hide-details
          />
        </v-col>
      </v-row>
      <v-row class="mb-4" dense>
        <v-col cols="12" md="8" lg="7">
          <v-card class="pa-4 chart-card" elevation="1">
            <div class="text-subtitle-1 font-weight-medium mb-4">
              Assigned Workout Plans
            </div>
            <div v-if="hasWorkouts" class="chart-wrapper">
              <Bar :data="weeklyChartData" :options="weeklyChartOptions" />
            </div>
            <div v-else class="text-body-2 text-medium-emphasis">
              Workouts will appear here once scheduled.
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4" lg="5">
          <v-card class="pa-4 h-100" elevation="1">
            <div class="text-subtitle-1 font-weight-medium mb-3">
              Quick actions
            </div>
            <div class="d-flex flex-column gap-3 quick-actions">
              <v-card
                v-for="action in quickActions"
                :key="action.label"
                class="mb-3"
                outlined
              >
                <v-list-item @click="runQuickAction(action)" lines="two">
                  <template #prepend>
                    <v-avatar size="36" :color="action.color" variant="tonal">
                      <v-icon>{{ action.icon }}</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-medium">
                    {{ action.label }}
                  </v-list-item-title>
                  <v-list-item-subtitle>{{ action.description }}</v-list-item-subtitle>
                </v-list-item>
              </v-card>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <div v-if="!hasWorkouts && !loading" class="text-body-2 text-medium-emphasis">
        No workouts assigned yet. Create a plan to get started.
      </div>

      <v-row class="mb-4" dense>
        <v-col cols="12" md="6">
          <v-card class="pa-4 h-100" elevation="1">
            <div class="text-subtitle-1 font-weight-medium mb-3">
              Upcoming assignments
            </div>
            <div class="d-flex gap-4 mb-3">
              <div class="text-center flex-grow-1">
                <div class="text-caption text-medium-emphasis">Upcoming</div>
                <div class="text-h5">{{ assignmentStatusCounts.upcoming }}</div>
              </div>
              <div class="text-center flex-grow-1">
                <div class="text-caption text-medium-emphasis">Completed</div>
                <div class="text-h5">{{ assignmentStatusCounts.completed }}</div>
              </div>
              <div class="text-center flex-grow-1">
                <div class="text-caption text-medium-emphasis">Overdue</div>
                <div class="text-h5">{{ assignmentStatusCounts.overdue }}</div>
              </div>
            </div>
            <v-list v-if="upcomingAssignments.length" density="compact">
              <v-list-item
                v-for="assignment in upcomingAssignments"
                :key="assignment.id"
                clickable
                @click="openAssignmentDetails(assignment)"
              >
                <v-list-item-title>
                  {{ assignment.title }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatDateLabel(assignment.expectedDate) }}
                  <span class="text-medium-emphasis"> • {{ formatAthleteLabel(assignment) }}</span>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <div v-else class="text-body-2 text-medium-emphasis">
              No future assignments scheduled.
            </div>
            <v-alert
              v-if="workoutsWithoutSchedule"
              type="warning"
              variant="tonal"
              density="comfortable"
              class="mt-3"
            >
              {{ workoutsWithoutSchedule }} plan(s) have no scheduled date.
            </v-alert>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card class="pa-4 h-100" elevation="1">
            <div class="text-subtitle-1 font-weight-medium mb-3">
              Recently completed
            </div>
            <v-list v-if="recentlyCompleted.length" density="compact">
              <v-list-item
                v-for="completed in recentlyCompleted"
                :key="completed.id"
                clickable
                @click="openAssignmentDetails(completed)"
              >
                <v-list-item-title>
                  {{ completed.title }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatDateLabel(completed.completedOn) }}
                  <span class="text-medium-emphasis"> • {{ formatAthleteLabel(completed) }}</span>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <div v-else class="text-body-2 text-medium-emphasis">
              No completions recorded yet.
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-dialog v-model="assignmentDetailsDialog" max-width="780">
        <v-card>
          <v-card-title class="text-subtitle-1 font-weight-medium">
            {{ assignmentDetails?.title || "Workout Details" }}
          </v-card-title>
          <v-card-subtitle class="text-body-2 text-medium-emphasis">
            {{ formatDateLabel(assignmentDetails?.expectedDate) }}
            <span v-if="assignmentDetails?.athleteId" class="text-medium-emphasis">
              • Athlete: {{ assignmentDetails?.athleteId }}
            </span>
            <span
              v-if="assignmentTeamNames.length"
              class="text-medium-emphasis d-block mt-1"
            >
              Team: {{ assignmentTeamNames.join(", ") }}
            </span>
          </v-card-subtitle>
          <v-divider />
          <v-card-text>
            <div v-if="assignmentDetailsLoading" class="d-flex justify-center py-6">
              <v-progress-circular indeterminate color="primary" />
            </div>
            <v-alert
              v-else-if="assignmentDetailsError"
              type="error"
              variant="tonal"
              density="comfortable"
              class="mb-3"
            >
              {{ assignmentDetailsError }}
            </v-alert>
            <div v-else>
              <div class="text-subtitle-2 mb-2">Exercises</div>
              <div v-if="assignmentExercises.length" class="exercise-list">
                <div
                  v-for="exercise in assignmentExercises"
                  :key="exercise.id"
                  class="exercise-item-block"
                >
                  <div class="exercise-title">
                    {{ exercise.name }}
                  </div>
                  <div
                    class="exercise-line"
                    v-for="(line, idx) in exerciseLines(exercise)"
                    :key="idx"
                  >
                    {{ line }}
                  </div>
                </div>
              </div>
              <div v-else class="text-body-2 text-medium-emphasis">
                No exercises listed for this workout.
              </div>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" color="primary" @click="assignmentDetailsDialog = false">
              Close
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

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

.chart-card {
  min-height: 320px;
}

.chart-wrapper {
  height: 240px;
}

.exercise-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.exercise-item-block {
  white-space: normal;
  word-break: break-word;
}

.exercise-title {
  font-weight: 600;
  margin-bottom: 4px;
  line-height: 1.35;
}

.exercise-line {
  white-space: normal;
  word-break: break-word;
  line-height: 1.35;
}

.quick-actions .v-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.quick-actions .v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}
</style>
