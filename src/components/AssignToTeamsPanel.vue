<script setup>
const props = defineProps({
  teams: {
    type: Array,
    default: () => [],
  },
  selectedTeamIds: {
    type: Array,
    default: () => [],
  },
  assignmentDate: {
    type: String,
    default: "",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabledReason: {
    type: String,
    default: "",
  },
  error: {
    type: String,
    default: null,
  },
  successMessage: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:selectedTeamIds", "update:assignmentDate", "assign"]);

const toggleTeam = (teamId) => {
  const current = props.selectedTeamIds ?? [];
  if (current.includes(teamId)) {
    emit("update:selectedTeamIds", current.filter((id) => id !== teamId));
  } else {
    emit("update:selectedTeamIds", [...current, teamId]);
  }
};

const updateDate = (value) => emit("update:assignmentDate", value);
const assign = () => emit("assign");
</script>

<template>
  <v-card class="h-100">
    <v-card-title class="text-subtitle-1 font-weight-medium">
      Assign to Teams
    </v-card-title>
    <v-divider />
    <v-card-text>
      <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
        {{ error }}
      </v-alert>
      <v-alert v-if="successMessage" type="success" variant="tonal" density="comfortable" class="mb-3">
        {{ successMessage }}
      </v-alert>

      <div class="text-body-2 text-medium-emphasis mb-2">Teams</div>
      <v-list v-if="teams.length" density="compact">
        <v-list-item
          v-for="team in teams"
          :key="team.id"
          rounded
          class="mb-1"
          @click="toggleTeam(team.id)"
        >
          <template #prepend>
            <v-checkbox
              :model-value="selectedTeamIds.includes(team.id)"
              density="compact"
              hide-details
              @click.stop="toggleTeam(team.id)"
            />
          </template>
          <v-list-item-title>{{ team.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
      <v-alert v-else type="info" variant="tonal" density="comfortable" class="mb-3">
        No teams available.
      </v-alert>

      <v-text-field
        :model-value="assignmentDate"
        type="date"
        label="Assignment date"
        prepend-inner-icon="mdi-calendar"
        density="comfortable"
        class="mt-2"
        @update:model-value="updateDate"
      />

      <v-alert
        v-if="disabledReason && !loading"
        type="info"
        variant="tonal"
        density="comfortable"
        class="mt-3"
      >
        {{ disabledReason }}
      </v-alert>
    </v-card-text>
    <v-card-actions class="px-4 pb-4">
      <v-btn
        block
        color="primary"
        :disabled="!!disabledReason || loading"
        :loading="loading"
        @click="assign"
      >
        Assign Workout
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
