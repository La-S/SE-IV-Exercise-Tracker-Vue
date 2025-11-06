<script setup>
import { computed, reactive, ref, watch } from "vue";

const teamPlans = ref([
  {
    id: 1,
    name: "Weight Training",
    focusArea: "Strength & Conditioning",
    description: "High intensity compound lifts with progressive load.",
    notes: "Testing team notes",
    exercises: [],
  },
]);

const individualPlans = ref([
  {
    id: 101,
    name: "Mobility",
    focusArea: "Active Mobility",
    description: "Low impact mobility circuit for post-competition day.",
    notes: "testing indiv notes",
    exercises: [],
  },
]);

const availableExercises = ref([
  {
    id: 501,
    name: "Back Squat",
    type: "Strength",
    muscleGroup: "Quad",
    restTimer: 120,
    notes: "3 warmup sets before working weight.",
  },
  {
    id: 502,
    name: "Sprints",
    type: "Cardio",
    muscleGroup: "Cardio",
    restTimer: 60,
    notes: "5 mile run",
  },
]);

const planSections = computed(() => [
  { label: "Team Plans", type: "team", plans: teamPlans.value },
  { label: "Individual Plans", type: "individual", plans: individualPlans.value },
]);

const getPlansByType = (type) =>
  type === "team" ? teamPlans.value : individualPlans.value;

const selectedPlanKey = reactive({ type: "team", id: teamPlans.value[0]?.id ?? null });

const ensureSelectedPlan = () => {
  if (selectedPlanKey.id) {
    const currentCollection = getPlansByType(selectedPlanKey.type);
    if (currentCollection.some((plan) => plan.id === selectedPlanKey.id)) {
      return;
    }
  }
  const fallbackPlan = teamPlans.value[0] ?? individualPlans.value[0] ?? null;
  if (fallbackPlan) {
    selectedPlanKey.type = teamPlans.value.find(function(plan) {
      return plan.id===fallbackPlan.id;
    })
      ? "team"
      : "individual";
    selectedPlanKey.id = fallbackPlan.id;
  } else {
    selectedPlanKey.id = null;
  }
};

watch(
  () => [teamPlans.value.length, individualPlans.value.length],
  () => {
    ensureSelectedPlan();
  },
  { immediate: true }
);

const selectedPlan = computed(function () {
  if (!selectedPlanKey.id) return null;
  const collection = getPlansByType(selectedPlanKey.type);
  return collection.find((plan) => plan.id === selectedPlanKey.id) ?? null;
});

const muscleFocusOrder = [
  "Core",
  "Chest",
  "Bicep",
  "Tricep",
  "Forearm",
  "Shoulder",
  "Back",
  "Hamstring",
  "Calf",
  "Quad",
  "Glute",
  "Cardio",
  "Other"
];

const newPlanDialog = ref(false);
const newPlan = reactive({
  type: "team",
  name: "",
  focusArea: "",
  description: "",
  notes: "",
});

const resetNewPlan = () => {
  newPlan.type = "team";
  newPlan.name = "";
  newPlan.focusArea = "";
  newPlan.description = "";
  newPlan.notes = "";
};

const createPlan = function() {
  if(!newPlan.name.trim()) {
    return;
  }

  const targetCollection = newPlan.type === "team" ? teamPlans.value:individualPlans.value;
  const plan = {
    id: Date.now(),
    name: newPlan.name.trim(),
    focusArea: newPlan.focusArea.trim(),
    description: newPlan.description.trim(),
    notes: newPlan.notes.trim(),
    exercises: [],
  };

  targetCollection.push(plan);
  selectedPlanKey.type = newPlan.type;
  selectedPlanKey.id = plan.id;

  newPlanDialog.value = false;
  resetNewPlan();
};

const editPlanDialog = ref(false);
const editPlan = reactive({
  id: null,
  type: "team",
  name: "",
  focusArea: "",
  description: "",
  notes: "",
});

const resetEditPlan = () => {
  editPlan.id = null;
  editPlan.type = "team";
  editPlan.name = "";
  editPlan.focusArea = "";
  editPlan.description = "";
  editPlan.notes = "";
};

const openEditPlan = (plan, type) => {
  if (!plan) return;
  editPlan.id = plan.id;
  editPlan.type = type;
  editPlan.name = plan.name ?? "";
  editPlan.focusArea = plan.focusArea ?? "";
  editPlan.description = plan.description ?? "";
  editPlan.notes = plan.notes ?? "";
  editPlanDialog.value = true;
};

const applyPlanUpdates = (plan, updates) => {
  Object.assign(plan, {
    name: updates.name.trim(),
    focusArea: updates.focusArea.trim(),
    description: updates.description.trim(),
    notes: updates.notes.trim(),
  });
};

const updatePlan = function() {
  if(!editPlan.id||!editPlan.name.trim()) {
    return;
  }

  const collection=getPlansByType(editPlan.type);
  const plan=collection.find((item) => item.id===editPlan.id);
  if(plan) {
    applyPlanUpdates(plan, editPlan);
    ensureSelectedPlan();
  }
  editPlanDialog.value=false;
  resetEditPlan();
};

const deletePlan = function(planId, type) {
  const collection=getPlansByType(type);
  const index=collection.findIndex((plan) => plan.id===planId);
  if(index===-1)
    return;

  collection.splice(index, 1);
  if(selectedPlanKey.type === type && selectedPlanKey.id === planId) {
    ensureSelectedPlan();
  }
  if(editPlanDialog.value&&editPlan.id===planId) {
    editPlanDialog.value=false;
    resetEditPlan();
  }
};

const confirmPlanDeletion = function(plan, type) {
  if(!plan)
    return;
  const planLabel=type==="team"? "team":"individual";
  const confirmation=window.confirm(
    `Delete ${planLabel} plan "${plan.name}"? This action cannot be undone.`
  );
  if(confirmation) {
    deletePlan(plan.id, type);
  }
};

const newExercise = reactive({
  name: "",
  type: "",
  muscleGroup: "",
  restTimer: 90,
  notes: "",
});

const normalizeExerciseFields = (exercise) => {
  const restTimerValue = Number(exercise.restTimer);
  return {
    name: exercise.name.trim(),
    type: exercise.type.trim() || "Other",
    muscleGroup: exercise.muscleGroup.trim(),
    restTimer: Number.isFinite(restTimerValue) ? restTimerValue : 0,
    notes: exercise.notes.trim(),
  };
};

const appendExercise = (exercise) => {
  const createdExercise = {
    id: Date.now(),
    ...normalizeExerciseFields(exercise),
  };

  availableExercises.value.push(createdExercise);
  return createdExercise;
};

const updateExerciseAssignments = function(exerciseId, updates) {
  const planCollections=[teamPlans.value, individualPlans.value];
  planCollections.forEach((plans) => {
    plans.forEach((plan) => {
      const target=plan.exercises.find((item) => item.id===exerciseId);
      if(target) {
        Object.assign(target, updates);
      }
    });
  });
};

const removeExerciseAssignments = function(exerciseId) {
  const planCollections=[teamPlans.value, individualPlans.value];
  planCollections.forEach(function(plans) {
    plans.forEach(function(plan) {
      plan.exercises=plan.exercises.filter((exercise) => exercise.id!==exerciseId);
    });
  });
};

const createExercise = function() {
  if(!newExercise.name.trim()) {
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
const exerciseSearch = ref("");
const exerciseFocusFilter = ref("all");
const exerciseFocusOptions = computed(() => [
  { label: "All", value: "all" },
  ...muscleFocusOrder.map((focus) => ({
    label: focus,
    value: focus.toLowerCase(),
  })),
]);

const inlineExercise = reactive({
  name: "",
  type: "",
  muscleGroup: "",
  restTimer: 90,
  notes: "",
});

const resetInlineExercise = function() {
  Object.assign(inlineExercise, {
    name: "",
    type: "",
    muscleGroup: "",
    restTimer: 90,
    notes: "",
  });
};

watch(addExerciseDialog, function(isOpen) {
    if(!isOpen) {
      selectedExerciseIds.value = [];
      showInlineExerciseForm.value = false;
      resetInlineExercise();
      exerciseSearch.value = "";
      exerciseFocusFilter.value = "all";
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

const createInlineExercise = function() {
  if(!inlineExercise.name.trim()) {
    return;
  }

  const createdExercise=appendExercise(inlineExercise);
  toggleInlineExerciseForm();
  selectedExerciseIds.value=Array.from(
    new Set([selectedExerciseIds.value, createdExercise.id])
  );
};

const sortedExercises = computed(function() {
  const term=exerciseSearch.value.trim().toLowerCase();

  const filterFocus=exerciseFocusFilter.value!=="all"? exerciseFocusFilter.value:null;

  const filtered=availableExercises.value.filter(function(exercise) {
    const name=exercise.name.toLowerCase();
    const type=exercise.type.toLowerCase();
    const muscle=(exercise.muscleGroup||"").toLowerCase();
    const notes=(exercise.notes||"").toLowerCase();

    const matchesSearch=!term||name.includes(term)||type.includes(term)||muscle.includes(term)||notes.includes(term);

    if(!matchesSearch)
      return false;

    if(filterFocus&&muscle!==filterFocus) {
      return false;
    }

    return true;
  });

  return filtered;
});

const addExercisesToPlan = function() {
  if(!selectedPlan.value||!selectedExerciseIds.value.length)
    return;

  const planExercises=selectedPlan.value.exercises;
  const existingIds=new Set(planExercises.map((exercise) => exercise.id));

  selectedExerciseIds.value.forEach(function(exerciseId) {
    const exercise=availableExercises.value.find(function(item) {
      return item.id === exerciseId;
    });
    if(exercise&&!existingIds.has(exercise.id)) {
      planExercises.push({ ...exercise });
      existingIds.add(exercise.id);
    }
  });

  addExerciseDialog.value = false;
};

const removeExerciseFromPlan = function(exerciseId) {
  if(!selectedPlan.value)
    return;
  selectedPlan.value.exercises=selectedPlan.value.exercises.filter(
    function(item) {
      return item.id!==exerciseId;
    }
  );
};

const editExerciseDialog = ref(false);
const editExercise = reactive({
  id: null,
  source: "library",
  planType: null,
  planId: null,
  name: "",
  type: "",
  muscleGroup: "",
  restTimer: 90,
  notes: "",
});

const resetEditExercise = function() {
  editExercise.id=null;
  editExercise.source="library";
  editExercise.planType=null;
  editExercise.planId=null;
  editExercise.name="";
  editExercise.type="";
  editExercise.muscleGroup="";
  editExercise.restTimer=90;
  editExercise.notes="";
};

const openLibraryExerciseEditor = function(exercise) {
  editExercise.id = exercise.id;
  editExercise.source = "library";
  editExercise.planType = null;
  editExercise.planId = null;
  editExercise.name = exercise.name??"";
  editExercise.type = exercise.type??"";
  editExercise.muscleGroup = exercise.muscleGroup??"";
  editExercise.restTimer = exercise.restTimer??0;
  editExercise.notes = exercise.notes??"";
  editExerciseDialog.value = true;
};

const openPlanExerciseEditor = function(planType, planId, exercise) {
  editExercise.id = exercise.id;
  editExercise.source = "plan";
  editExercise.planType = planType;
  editExercise.planId = planId;
  editExercise.name = exercise.name ?? "";
  editExercise.type = exercise.type ?? "";
  editExercise.muscleGroup = exercise.muscleGroup ?? "";
  editExercise.restTimer = exercise.restTimer ?? 0;
  editExercise.notes = exercise.notes ?? "";
  editExerciseDialog.value = true;
};

const applyExerciseUpdates = function(targetId, updates, options={ source: "library" }) {
  if(options.source === "library") {
    const exercise = availableExercises.value.find(function(item) {
      return item.id === targetId;
    });
    if(!exercise)
      return;
    Object.assign(exercise, updates);
    updateExerciseAssignments(targetId, updates);
  } else if(options.source === "plan" && options.planType && options.planId) {
    const planCollection=getPlansByType(options.planType);
    const plan=planCollection.find(function(item) {
      return item.id === options.planId;
    });
    if(!plan)
      return;
    const exercise = plan.exercises.find(function(item) {
      return item.id === targetId;
    });
    if(exercise) {
      Object.assign(exercise, updates);
    }
  }
};

const updateExercise = function() {
  if(!editExercise.id||!editExercise.name.trim()) {
    return;
  }

  const updates=normalizeExerciseFields(editExercise);
  applyExerciseUpdates(editExercise.id, updates, {
    source: editExercise.source,
    planType: editExercise.planType,
    planId: editExercise.planId,
  });

  editExerciseDialog.value = false;
  resetEditExercise();
};

const deleteAvailableExercise = function(exerciseId) {
  availableExercises.value=availableExercises.value.filter(
    (exercise) => exercise.id!==exerciseId
  );
  removeExerciseAssignments(exerciseId);
  selectedExerciseIds.value=selectedExerciseIds.value.filter((id) => id!==exerciseId);
  if(editExerciseDialog.value && editExercise.id === exerciseId && editExercise.source === "library") {
    editExerciseDialog.value = false;
    resetEditExercise();
  }
};

const confirmAvailableExerciseDeletion = function(exercise) {
  if(!exercise)
    return;
  const confirmation=window.confirm(
    `Delete exercise "${exercise.name}" from the library? This will remove it from any plans using it.`
  );
  if(confirmation) {
    deleteAvailableExercise(exercise.id);
  }
};

watch(editExerciseDialog, (isOpen) => {
  if (!isOpen) {
    resetEditExercise();
  }
});
</script>

<template>
  <v-container fluid class="pa-6">
    <v-row align="stretch" justify="center" no-gutters>
      <v-col cols="12" lg="3" class="pr-lg-4">
        <v-card class="h-100 d-flex flex-column">
          <v-card-title class="d-flex align-center">
            Exercise Plans
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
                  @click= "selectedPlanKey.type = section.type; selectedPlanKey.id = plan.id;" >
                  <v-list-item-title>{{ plan.name }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ plan.focusArea || "General focus" }}
                  </v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6" class="px-lg-4 mt-6 mt-lg-0">
        <v-card class="h-100">
          <template v-if="selectedPlan">
            <v-card-title class="d-flex flex-wrap align-start">
              <div class="flex-grow-1 d-flex flex-column pr-4">
                <span class="text-h5">{{ selectedPlan.name }}</span>
                <span class="text-subtitle-2 text-medium-emphasis">
                  {{ selectedPlan.focusArea || "General focus" }}
                </span>
              </div>
              <div class="d-flex align-center mt-3 mt-sm-0">
                <v-btn
                  variant="tonal"
                  color="primary"
                  size="small"
                  class="mr-2"
                  prepend-icon="mdi-pencil"
                  @click="openEditPlan(selectedPlan, selectedPlanKey.type)"
                >
                  Edit
                </v-btn>
                <v-btn
                  variant="text"
                  color="error"
                  size="small"
                  prepend-icon="mdi-delete"
                  @click="confirmPlanDeletion(selectedPlan, selectedPlanKey.type)"
                >
                  Delete
                </v-btn>
              </div>
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-row>
                <v-col cols="12" md="7">
                  <p class="text-body-2 mb-4">
                    {{ selectedPlan.description || "Add notes to describe this plan." }}
                  </p>
                </v-col>
                <v-col cols="12" md="5">
                  <v-alert
                    v-if="selectedPlan.notes"
                    border="start"
                    color="primary"
                    variant="tonal"
                    density="comfortable"
                  >
                    {{ selectedPlan.notes }}
                  </v-alert>
                </v-col>
              </v-row>

              <v-divider class="my-4" />

              <div>
                <div class="d-flex align-center justify-space-between mb-4 flex-wrap">
                  <h3 class="text-subtitle-1 font-weight-medium mb-0">Plan Exercises</h3>
                  <v-btn
                    color="primary"
                    variant="tonal"
                    size="small"
                    prepend-icon="mdi-plus"
                    @click="addExerciseDialog = true"
                  >
                    Add Exercises
                  </v-btn>
                </div>
                <v-alert v-if="!selectedPlan.exercises.length" variant="tonal" type="info">
                  No exercises have been added yet. Use the Add Exercises button to include one.
                </v-alert>

                <v-expansion-panels v-else>
                  <v-expansion-panel
                    v-for="exercise in selectedPlan.exercises"
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
                          <p class="text-body-2 mb-2">{{ exercise.notes || "No notes" }}</p>
                        </v-col>
                        <v-col cols="12" md="4" class="d-flex flex-column align-start">
                          <v-chip color="secondary" variant="elevated" class="mb-2">
                            Rest: {{ exercise.restTimer }}s
                          </v-chip>
                          <v-btn
                            color="primary"
                            variant="text"
                            class="mb-2"
                            @click="openPlanExerciseEditor(selectedPlanKey.type, selectedPlan.id, exercise)"
                          >
                            Edit
                          </v-btn>
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

      <v-col cols="12" lg="3" class="pl-lg-4 mt-6 mt-lg-0">
      </v-col>
    </v-row>

    <v-dialog v-model="addExerciseDialog" max-width="560">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Select Exercises</span>
          <v-btn
            size="small"
            variant="text"
            color="primary"
            :prepend-icon="showInlineExerciseForm ? 'mdi-close-circle-outline' : 'mdi-plus'"
            @click="toggleInlineExerciseForm"
          >
            {{ showInlineExerciseForm ? "Close Form" : "New Exercise" }}
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
          <v-row class="mb-3" dense>
            <v-col cols="12" md="8">
              <v-text-field
                v-model="exerciseSearch"
                label="Search exercises"
                prepend-inner-icon="mdi-magnify"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model="exerciseFocusFilter"
                :items="exerciseFocusOptions"
                item-title="label"
                item-value="value"
                label="Focus filter"
                prepend-inner-icon="mdi-dna"
                density="comfortable"
              />
            </v-col>
          </v-row>
          <v-list
            v-if="sortedExercises.length"
            density="comfortable"
            lines="two"
            style="max-height: 360px; overflow-y: auto;"
          >
            <v-item-group v-model="selectedExerciseIds" multiple>
              <template v-for="exercise in sortedExercises" :key="exercise.id">
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
                    <v-list-item-subtitle>
                      {{ exercise.type }} &bull; {{ exercise.muscleGroup || "General" }}
                    </v-list-item-subtitle>
                    <template #append>
                      <div class="d-flex align-center">
                        <v-chip size="x-small" color="primary" variant="outlined" class="mr-2">
                          Rest {{ exercise.restTimer }}s
                        </v-chip>
                        <v-btn
                          icon
                          variant="text"
                          color="primary"
                          size="small"
                          @click.stop="openLibraryExerciseEditor(exercise)"
                        >
                          <v-icon size="18">mdi-pencil</v-icon>
                        </v-btn>
                        <v-btn
                          icon
                          variant="text"
                          color="error"
                          size="small"
                          @click.stop="confirmAvailableExerciseDeletion(exercise)"
                        >
                          <v-icon size="18">mdi-delete</v-icon>
                        </v-btn>
                      </div>
                    </template>
                  </v-list-item>
                </v-item>
              </template>
            </v-item-group>
          </v-list>

          <v-alert v-else type="info" variant="tonal">
            No results found for this muscle focus.
          </v-alert>

        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="addExerciseDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :disabled="!selectedExerciseIds.length"
            @click="addExercisesToPlan"
          >
            Add to Plan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editExerciseDialog" max-width="520">
      <v-card>
        <v-card-title>Edit Exercise</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="updateExercise">
            <v-alert
              v-if="editExercise.source === 'library'"
              type="info"
              variant="tonal"
              class="mb-4"
            >
              Updating this exercise will also update any plans using it.
            </v-alert>
            <v-alert
              v-else
              type="info"
              variant="tonal"
              class="mb-4"
            >
              Changes apply only within this plan.
            </v-alert>
            <v-text-field
              v-model="editExercise.name"
              label="Exercise name"
              prepend-inner-icon="mdi-dumbbell"
              required
            />
            <v-select
              v-model="editExercise.type"
              :items="['Strength', 'Cardio', 'Mobility', 'Other']"
              label="Type"
              prepend-inner-icon="mdi-format-list-bulleted"
            />
            <v-text-field
              v-model="editExercise.muscleGroup"
              label="Muscle group"
              prepend-inner-icon="mdi-dna"
            />
            <v-text-field
              v-model="editExercise.restTimer"
              label="Rest timer (seconds)"
              type="number"
              min="0"
              prepend-inner-icon="mdi-timer-outline"
            />
            <v-textarea
              v-model="editExercise.notes"
              label="Notes"
              rows="3"
              auto-grow
              prepend-inner-icon="mdi-note-text"
            />
            <v-card-actions class="mt-2">
              <v-spacer />
              <v-btn variant="text" @click="editExerciseDialog = false">
                Cancel
              </v-btn>
              <v-btn type="submit" color="primary" :disabled="!editExercise.name">
                Save
              </v-btn>
            </v-card-actions>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="newPlanDialog" max-width="520">
      <v-card>
        <v-card-title>Create New Plan</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="createPlan">
            <v-radio-group
              v-model="newPlan.type"
              label="Plan type"
              inline
              class="mb-4"
            >
              <v-radio label="Team" value="team" />
              <v-radio label="Individual" value="individual" />
            </v-radio-group>
            <v-text-field
              v-model="newPlan.name"
              label="Plan name"
              prepend-inner-icon="mdi-file-document-edit"
              required
            />
            <v-text-field
              v-model="newPlan.focusArea"
              label="Focus area"
              prepend-inner-icon="mdi-crosshairs-gps"
            />
            <v-textarea
              v-model="newPlan.description"
              label="Description"
              rows="3"
              auto-grow
              prepend-inner-icon="mdi-text"
            />
            <v-textarea
              v-model="newPlan.notes"
              label="Coach notes"
              rows="2"
              auto-grow
              prepend-inner-icon="mdi-note-outline"
            />
            <v-card-actions class="mt-2">
              <v-spacer />
              <v-btn variant="text" @click="newPlanDialog = false">Cancel</v-btn>
              <v-btn type="submit" color="primary">Create</v-btn>
            </v-card-actions>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editPlanDialog" max-width="520">
      <v-card>
        <v-card-title>Edit Plan</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="updatePlan">
            <v-chip
              class="mb-4 text-uppercase"
              color="primary"
              variant="tonal"
            >
              {{ editPlan.type === "team" ? "Team Plan" : "Individual Plan" }}
            </v-chip>
            <v-text-field
              v-model="editPlan.name"
              label="Plan name"
              prepend-inner-icon="mdi-file-document-edit"
              required
            />
            <v-text-field
              v-model="editPlan.focusArea"
              label="Focus area"
              prepend-inner-icon="mdi-crosshairs-gps"
            />
            <v-textarea
              v-model="editPlan.description"
              label="Description"
              rows="3"
              auto-grow
              prepend-inner-icon="mdi-text"
            />
            <v-textarea
              v-model="editPlan.notes"
              label="Coach notes"
              rows="2"
              auto-grow
              prepend-inner-icon="mdi-note-outline"
            />
            <v-card-actions class="mt-2">
              <v-spacer />
              <v-btn variant="text" @click="editPlanDialog = false; resetEditPlan();">
                Cancel
              </v-btn>
              <v-btn type="submit" color="primary" :disabled="!editPlan.name">
                Save
              </v-btn>
            </v-card-actions>
          </v-form>
        </v-card-text>
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
