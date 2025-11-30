<script setup>
import { computed } from "vue";
import SetTable from "./SetTable.vue";

const props = defineProps({
  exercise: {
    type: Object,
    required: true,
  },
  mutationPending: {
    type: Boolean,
    default: false,
  },
  showActualResults: {
    type: Boolean,
    default: false
  },
  showMutationOptions: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(["edit", "edit-sets", "remove"]);

const normalizedType = computed(() => (props.exercise.type || "").toString().toLowerCase());
</script>

<template>
  <v-expansion-panel>
    <v-expansion-panel-title>
      <div class = "d-flex flex-column">
        <span class = "font-weight-medium">{{ exercise.name }}</span>
        <span class = "text-body-2 text-medium-emphasis">
          {{ exercise.type }} • {{ exercise.muscleGroup || "General" }}
        </span>
      </div>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <v-row>
        <v-col cols = "12" md="8">
          <p class = "text-body-2 mb-2">{{ exercise.notes || "No notes" }}</p>
        </v-col>
        <v-col cols = "12" md = "4" class = "d-flex flex-column align-end text-right">
          <v-chip color = "secondary" variant = "elevated" class = "mb-2">
            Rest: {{ exercise.restTimer }}s
          </v-chip>
          <v-btn
            v-if = "showMutationOptions"
            color = "primary"
            variant = "text"
            class = "mb-2 wrap-btn"
            :disabled = "mutationPending"
            @click.stop = "emit('edit')"
          >
            <span class = "btn-lines">Edit<br />Exercise</span>
          </v-btn>
          <v-btn
            v-if = "showMutationOptions"
            color = "error"
            variant = "text"
            :disabled = "mutationPending"
            @click.stop = "emit('remove')"
          >
            delete
          </v-btn>
        </v-col>
      </v-row>
      <v-row class = "mt-4">
        <v-col cols = "12">
          <div class = "d-flex justify-space-between align-center mb-2">
            <h4 class = "text-subtitle-2 font-weight-medium mb-0">Sets</h4>
            <v-btn
              v-if = "showMutationOptions"
              variant = "text"
              size = "small"
              color = "primary"
              :disabled = "mutationPending"
              @click.stop = "emit('edit-sets')"
            >
              Edit Sets
            </v-btn>
          </div>

          <v-alert
            v-if ="!exercise.sets || !exercise.sets.length"
            type = "info"
            variant = "tonal"
            density = "comfortable"
            class = "mb-2"
          >
            No sets defined for this exercise.
          </v-alert>

          <set-table
            v-else
            :sets = "exercise.sets"
            :type = "normalizedType"
            :show-actual = "showActualResults"
          />
        </v-col>
      </v-row>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<style scoped>
.wrap-btn {
  white-space: normal;
  line-height: 1.1;
  height: auto;
  padding-top: 6px;
  padding-bottom: 6px;
  min-width: 0;
}

.btn-lines {
  display: inline-block;
  text-align: center;
}
</style>
