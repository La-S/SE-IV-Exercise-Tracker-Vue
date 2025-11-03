<script setup>
import { computed, reactive, ref, watch } from "vue";

const teamPlans = ref([
  {
    id: 1,
    name: "OC Cross Country",
    // description: "High intensity compound lifts with progressive load.",
    // notes: "Testing team notes",
    // exercises: [],
  },
]);

const individualPlans = ref([
  {
    id: 101,
    name: "OC Football",
    // focusArea: "Active Recovery",
    // description: "Low impact mobility circuit for post-competition day.",
    // notes: "testing indiv notes",
    // exercises: [],
  },
]);

const availableExercises = ref([
  {
    id: 501,
    name: "Lance Skinner",
  },
  {
    id: 502,
    name: "Gus Cordero",
  },
]);

const planSections = computed(() => [
  { label: "Your Teams", type: "team", plans: teamPlans.value },
  { label: "All Teams", type: "individual", plans: individualPlans.value },
]);

const selectedPlanKey = reactive({ type: "team", id: teamPlans.value[0]?.id ?? null });

watch(
  () => [teamPlans.value.length, individualPlans.value.length],
  () => {
    if (selectedPlanKey.id) return;
    const defaultPlan =
      teamPlans.value[0] ??
      individualPlans.value[0] ??
      null;
    if (defaultPlan) {
      selectedPlanKey.type = teamPlans.value.find((plan) => plan.id === defaultPlan.id)
        ? "team"
        : "individual";
      selectedPlanKey.id = defaultPlan.id;
    }
  },
  { immediate: true }
);

const selectedPlan = computed(() => {
  if (!selectedPlanKey.id) return null;
  const collection =
    selectedPlanKey.type === "team" ? teamPlans.value : individualPlans.value;
  return collection.find((plan) => plan.id === selectedPlanKey.id) ?? null;
});

const newPlanDialog = ref(false);
const newPlan = reactive({
  type: "team",
  name: "",
  focusArea: "",
  notes: "",
});

const resetNewPlan = () => {
  newPlan.type = "team";
  newPlan.name = "";
  newPlan.focusArea = "";
  newPlan.notes = "";
};

const createPlan = () => {
  if (!newPlan.name.trim()) {
    return;
  }

  const targetCollection = newPlan.type === "team" ? teamPlans.value : individualPlans.value;
  const plan = {
    id: Date.now(),
    name: newPlan.name.trim(),
    focusArea: newPlan.focusArea.trim(),
    notes: newPlan.notes.trim(),
    exercises: [],
  };

  targetCollection.push(plan);
  selectedPlanKey.type = newPlan.type;
  selectedPlanKey.id = plan.id;

  newPlanDialog.value = false;
  resetNewPlan();
};

const newExercise = reactive({
  name: "",
  type: "",
  muscleGroup: "",
  restTimer: 90,
  notes: "",
});

const appendExercise = (exercise) => {
  const restTimerValue = Number(exercise.restTimer);
  const createdExercise = {
    id: Date.now(),
    name: exercise.name.trim(),
    type: exercise.type.trim() || "General",
    muscleGroup: exercise.muscleGroup.trim(),
    restTimer: Number.isFinite(restTimerValue) ? restTimerValue : 0,
    notes: exercise.notes.trim(),
  };

  availableExercises.value.push(createdExercise);
  return createdExercise;
};

const createExercise = () => {
  if (!newExercise.name.trim()) {
    return;
  }

  appendExercise(newExercise);

  Object.assign(newExercise, {
    name: "",
    type: "",
    muscleGroup: "",
    restTimer: 90,
    notes: "",
  });
};

const addExerciseDialog = ref(false);
const selectedExerciseIds = ref([]);
const showInlineExerciseForm = ref(false);

const inlineExercise = reactive({
  name: "",
  type: "",
  muscleGroup: "",
  restTimer: 90,
  notes: "",
});

const resetInlineExercise = () => {
  Object.assign(inlineExercise, {
    name: "",
    type: "",
    muscleGroup: "",
    restTimer: 90,
    notes: "",
  });
};

watch(addExerciseDialog, (isOpen) => {
  if (!isOpen) {
    selectedExerciseIds.value = [];
    showInlineExerciseForm.value = false;
    resetInlineExercise();
  }
});

const toggleInlineExerciseForm = () => {
  if (showInlineExerciseForm.value) {
    showInlineExerciseForm.value = false;
    resetInlineExercise();
  } else {
    showInlineExerciseForm.value = true;
  }
};

const createInlineExercise = () => {
  if (!inlineExercise.name.trim()) {
    return;
  }

  const createdExercise = appendExercise(inlineExercise);
  toggleInlineExerciseForm();
  selectedExerciseIds.value = Array.from(
    new Set([...selectedExerciseIds.value, createdExercise.id])
  );
};

const addAthletesToTeam = () => {
  if (!selectedPlan.value || !selectedExerciseIds.value.length) return;

  const planExercises = selectedPlan.value.exercises;
  const existingIds = new Set(planExercises.map((exercise) => exercise.id));

  selectedExerciseIds.value.forEach((exerciseId) => {
    const exercise = availableExercises.value.find((item) => item.id === exerciseId);
    if (exercise && !existingIds.has(exercise.id)) {
      planExercises.push({ ...exercise });
      existingIds.add(exercise.id);
    }
  });

  addExerciseDialog.value = false;
};

const removeExerciseFromPlan = (exerciseId) => {
  if (!selectedPlan.value) return;
  selectedPlan.value.exercises = selectedPlan.value.exercises.filter(
    (item) => item.id !== exerciseId
  );
};
</script>

<template>
  <v-container fluid class="pa-6">
    <v-row align="stretch" justify="center" no-gutters>
      <v-col cols="12" lg="3" class="pr-lg-4">
        <v-card class="h-100 d-flex flex-column">
          <v-card-title class="d-flex align-center">
            Teams
            <v-spacer />
            <v-btn icon variant="text" color="primary" @click="newPlanDialog = true">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </v-card-title>

          <v-divider />

          <v-card-text class="flex-grow-1 overflow-y-auto pr-2">
            <v-list density="compact" nav>
              <template v-for="section in planSections" :key="section.type">
                <v-subheader class="text-uppercase font-weight-medium">
                  {{ section.label }}
                </v-subheader>
                <v-list-item
                  v-for="plan in section.plans"
                  :key="plan.id"
                  :active="selectedPlanKey.type === section.type && selectedPlanKey.id === plan.id"
                  rounded
                  @click="selectedPlanKey.type = section.type; selectedPlanKey.id = plan.id;"
                >
                  <v-list-item-title>{{ plan.name }}</v-list-item-title>
                </v-list-item>
              </template>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6" class="px-lg-4 mt-6 mt-lg-0">
        <v-card class="h-100">
          <template v-if="selectedPlan">
            <v-card-title class="d-flex flex-column align-start">
              <span class="text-h5">{{ selectedPlan.name }}</span>
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-row>
                <v-col cols="12" md="7">
                  <p class="text-body-2 mb-4">
                    {{ "There are 34 athletes on this team." }}
                  </p>
                </v-col>
              </v-row>

              <v-divider class="my-4" />

              <div>
                <div class="d-flex align-center justify-space-between mb-4 flex-wrap">
                  <h3 class="text-subtitle-1 font-weight-medium mb-0">Athletes on Team</h3>
                  <v-btn
                    color="primary"
                    variant="tonal"
                    size="small"
                    prepend-icon="mdi-plus"
                    @click="addExerciseDialog = true"
                  >
                    Add Athlete
                  </v-btn>
                </div>
                <v-alert v-if="!selectedPlan.exercises?.length" variant="tonal" type="info">
                  No athletes on the team. Use the Add Athlete button to get started.
                </v-alert>

                <v-expansion-panels v-else>
                  <v-expansion-panel
                    v-for="exercise in selectedPlan.exercises ?? []"
                    :key="exercise.id"
                  >
                    <v-expansion-panel-title>
                      <div class="d-flex flex-column">
                        <span class="font-weight-medium">{{ exercise.name }}</span>
                        <span class="text-body-2 text-medium-emphasis">
                          {{ exercise.type }} • {{ exercise.muscleGroup || "General" }}
                        </span>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-row>
                        <v-col cols="12" md="8">
                          <p class="text-body-2 mb-2">{{ exercise.notes || "No notes provided." }}</p>
                        </v-col>
                        <v-col cols="12" md="4" class="d-flex flex-column align-start">
                          <v-chip color="secondary" variant="elevated" class="mb-2">
                            Rest: {{ exercise.restTimer }}s
                          </v-chip>
                          <v-btn
                            color="error"
                            variant="text"
                            @click="removeExerciseFromPlan(exercise.id)"
                          >
                            Remove
                          </v-btn>
                        </v-col>
                      </v-row>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </v-card-text>
          </template>
          <template v-else>
            <v-card-text class="text-center py-12">
              <v-icon size="56" class="mb-3" color="primary">mdi-view-dashboard-outline</v-icon>
              <p class="text-body-1">Create a plan to get started, or select one from the sidebar.</p>
              <v-btn color="primary" class="mt-4" @click="newPlanDialog = true">
                New Plan
              </v-btn>
            </v-card-text>
          </template>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="addExerciseDialog" max-width="560">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Select Athletes</span>
          <v-btn
            size="small"
            variant="text"
            color="primary"
           :prepend-icon="showInlineExerciseForm ? 'mdi-close-circle-outline' : 'mdi-plus'"
            @click="toggleInlineExerciseForm"
          >
            {{ showInlineExerciseForm ? "Close Form" : "New Athlete??" }}
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-expand-transition>
            <div v-if="showInlineExerciseForm" class="mb-4">
              <v-form @submit.prevent="createInlineExercise" class="d-flex flex-column">
                <v-text-field
                  v-model="inlineExercise.name"
                  label="Exercise name"
                  prepend-inner-icon="mdi-dumbbell"
                  density="comfortable"
                  required
                  class="mb-3"
                />
                <v-select
                  v-model="inlineExercise.type"
                  :items="['Strength', 'Cardio', 'Mobility', 'Other']"
                  label="Type"
                  prepend-inner-icon="mdi-format-list-bulleted"
                  density="comfortable"
                  class="mb-3"
                />
                <v-text-field
                  v-model="inlineExercise.muscleGroup"
                  label="Muscle group"
                  prepend-inner-icon="mdi-dna"
                  density="comfortable"
                  class="mb-3"
                />
                <v-text-field
                  v-model="inlineExercise.restTimer"
                  label="Rest timer (seconds)"
                  type="number"
                  min="0"
                  prepend-inner-icon="mdi-timer-outline"
                  density="comfortable"
                  class="mb-3"
                />
                <v-textarea
                  v-model="inlineExercise.notes"
                  label="Notes"
                  rows="3"
                  auto-grow
                  prepend-inner-icon="mdi-note-text"
                  density="comfortable"
                  class="mb-3"
                />
                <div class="d-flex justify-end mt-2">
                  <v-btn variant="text" @click="toggleInlineExerciseForm">
                    Cancel
                  </v-btn>
                  <v-btn type="submit" color="primary" prepend-icon="mdi-content-save">
                    Save Exercise
                  </v-btn>
                </div>
              </v-form>
            </div>
          </v-expand-transition>
          <v-list
            v-if="availableExercises.length"
            density="comfortable"
            lines="two"
            style="max-height: 360px; overflow-y: auto;"
          >
            <v-item-group v-model="selectedExerciseIds" multiple>
              <template v-for="exercise in availableExercises" :key="exercise.id">
                <v-item :value="exercise.id" v-slot="{ isSelected, toggle }">
                  <v-list-item @click="toggle" class="rounded-lg">
                    <template #prepend>
                      <v-checkbox
                        :model-value="isSelected"
                        density="compact"
                        hide-details
                        @click.stop="toggle"
                      />
                    </template>
                    <v-list-item-title>{{ exercise.name }}</v-list-item-title>
                  </v-list-item>
                </v-item>
              </template>
            </v-item-group>
          </v-list>
          <v-alert v-else type="info" variant="tonal">
            No athletes are available yet. Use New Athlete?? to create one.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="addExerciseDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :disabled="!selectedExerciseIds.length"
            @click="addAthletesToTeam"
          >
            Add to "{{selectedPlan.name}}"
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.h-100 {
  height: 100%;
}

.overflow-y-auto {
  overflow-y: auto;
}
</style>
