<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import apiClient from "../services/services";

const yourTeams = ref([]);

const otherTeams = ref([
  {
    id: 101,
    name: "OC Football",
    athletes: []
  },
]);

let selectedTeam = ref(null);

const availableAthletes = ref([
  {
    id: 501,
    name: "Lance Skinner",
  },
  {
    id: 502,
    name: "Gus Cordero",
  },
]);

const teamSections = computed(() => [
  { label: "Your Teams", type: "team", plans: yourTeams.value },
  { label: "Other Teams", type: "individual", plans: otherTeams.value },
]);

const selectedTeamKey = reactive({ type: "team", id: yourTeams.value[0]?.id ?? null });

const getAthletesOnTeam = async () => { // todo all of these should be in a service file
  console.log("getAthletesOnTeam")
  if (!selectedTeam) return;

  // const teamAthletes = selectedTeam.value.athletes;
  // const existingAthletes = new Set(teamAthletes.map((athletes) => athletes.id));

  try {
    // exerciseMutationError.value = null;
    // exerciseMutationPending.value = true;
    const response = await apiClient.get(`team/${selectedTeam.value.id}/users`);
    if (response.status != 200){
      throw Error("status not 200.")
    }
    selectedTeam.value.athletes = []
    response.data.forEach((athlete) =>{
      selectedTeam.value.athletes.push({id: athlete.id, name: athlete.first_name})
    })
    console.log(selectedTeam.value.athletes)
    // selectedAthleteIds.value = []
    // addExerciseDialog.value = false;
  } catch (error) {
    // console.error("Failed to create exercise template", error);
    // exerciseMutationError.value =
    //   error?.response?.data?.message ||
    //   "Unable to save the exercise. Please check the details and try again.";
  } finally {
    // exerciseMutationPending.value = false;
  }
};

const getAllAthletes = async () => { // todo all of these should be in a service file
  console.log("getAllAthletes")

  // const teamAthletes = selectedTeam.value.athletes;
  // const existingAthletes = new Set(teamAthletes.map((athletes) => athletes.id));

  try {
    // exerciseMutationError.value = null;
    // exerciseMutationPending.value = true;
    const response = await apiClient.get(`users`);
    if (response.status != 200){
      throw Error("status not 200.")
    }
    availableAthletes.value = []
    response.data.forEach((athlete) =>{
      availableAthletes.value.push({id: athlete.id, name: athlete.first_name})
    })
    console.log(availableAthletes.value)

    // selectedAthleteIds.value = []
    // addExerciseDialog.value = false;
  } catch (error) {
    // console.error("Failed to create exercise template", error);
    // exerciseMutationError.value =
    //   error?.response?.data?.message ||
    //   "Unable to save the exercise. Please check the details and try again.";
  } finally {
    // exerciseMutationPending.value = false;
  }
};

const teamSelected = (type, planId) => {
  console.log("teamSelected", type, planId)
  if (!selectedTeamKey.id) {
    selectedTeam.value = null;
  }
  const collection = type === "team" ? yourTeams.value : otherTeams.value;
  selectedTeamKey.id = planId;
  selectedTeamKey.type = type;
  selectedTeam.value = collection.find((plan) => plan.id === selectedTeamKey.id) ?? null;
  console.log(selectedTeam.value)
    console.log("getAthletesOnTeam")

  getAthletesOnTeam()
}

const loadTeams = async () => {
  // exercisesLoading.value = true;
  // exerciseLoadError.value = null;
  try {
    console.log("getting some teams")
    const response = await apiClient.get("team");
    const data = response.data;
    if (Array.isArray(data)) {
      yourTeams.value = data.map((template) =>  {return {name: template.name, id: template.id, athletes: []} });
    } else {
      yourTeams.value = [];
    }
  } catch (error) {
    // console.error("Failed to load exercise templates", error);
    // exerciseLoadError.value =
    //   "Unable to load available exercises. Please try again later.";
  } finally {
    // exercisesLoading.value = false;
  }
};

onMounted(() => {
  console.log("load some teams")
  loadTeams();
  getAllAthletes();
});

watch(
  () => [yourTeams.value.length, otherTeams.value.length],
  () => {
    if (selectedTeamKey.id) {
      if (selectedTeam.value === null) {
        teamSelected(selectedTeamKey.id);
      }
      return
    };
    const defaultPlan =
      yourTeams.value[0] ??
      otherTeams.value[0] ??
      null;
    if (defaultPlan) {
      selectedTeamKey.type = yourTeams.value.find((plan) => plan.id === defaultPlan.id)
        ? "team"
        : "individual";
      selectedTeamKey.id = defaultPlan.id;
    }
  },
  { immediate: true }
);

const newTeamDialog = ref(false);
const newTeam = reactive({
  type: "team",
  name: "",
  athletes: []
});

const resetNewTeam = () => {
  newTeam.type = "team";
  newTeam.name = "";
  newTeam.athletes = [];
};


const createTeam = async function() {
  if (!newTeam.name.trim()) {
    return;
  }

  const payload = {"name": newTeam.name.trim()}

  try {
    // exerciseMutationError.value = null;
    // exerciseMutationPending.value = true;
    const response = await apiClient.post("team", payload);
    const createdTeam = {
      "id": response.data.id,
      "name": response.data.name,
      "athletes": []
    }
    yourTeams.value.push(createdTeam);
    resetNewTeam();
    newTeamDialog.value = false
  } catch (error) {
    // console.error("Failed to create exercise template", error);
    // exerciseMutationError.value =
    //   error?.response?.data?.message ||
    //   "Unable to save the exercise. Please check the details and try again.";
  } finally {
    // exerciseMutationPending.value = false;
  }
};

const newExercise = reactive({
  name: "",
  type: "",
  muscleGroup: "",
  restTimer: 90,
  notes: "",
});


const appendAthlete = (exercise) => {
  const restTimerValue = Number(exercise.restTimer);
  const createdAthlete = {
    id: Date.now(),
    name: exercise.name.trim(),
    type: exercise.type.trim() || "General",
    muscleGroup: exercise.muscleGroup.trim(),
    restTimer: Number.isFinite(restTimerValue) ? restTimerValue : 0,
    notes: exercise.notes.trim(),
  };

  availableAthletes.value.push(createdAthlete);
  return createdAthlete;
};

function isAthleteOnTeam(athleteId) {
  let isOnTeam = !!getCopyOfAthletesForTeam().find((a) => a.id === athleteId);
  return isOnTeam;
}

function getCopyOfAthletesForTeam() {
  return JSON.parse(JSON.stringify(selectedTeam.value.athletes));
}

const createAthlete = () => {
  if (!newExercise.name.trim()) {
    return;
  }

  appendAthlete(newExercise);

  Object.assign(newExercise, {
    name: "",
    type: "",
    muscleGroup: "",
    restTimer: 90,
    notes: "",
  });
};

const addExerciseDialog = ref(false);
const selectedAthleteIds = ref([]);
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
    selectedAthleteIds.value = [];
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

  const createdExercise = appendAthlete(inlineExercise);
  toggleInlineExerciseForm();
  selectedAthleteIds.value = Array.from(
    new Set([...selectedAthleteIds.value, createdExercise.id])
  );
};

const addAthletesToTeam = async () => {
  if (!selectedTeam || !selectedAthleteIds.value.length) return;

  const teamAthletes = selectedTeam.value.athletes;
  const existingAthletes = new Set(teamAthletes.map((athletes) => athletes.id));

  try {
    // exerciseMutationError.value = null;
    // exerciseMutationPending.value = true;
    const response = await apiClient.post(`team/${selectedTeam.value.id}/users`, selectedAthleteIds.value);
    if (response.status != 200){
      throw Error("status not 200.")
    }
    console.log(response)
    // add the athletes to the list.
    selectedAthleteIds.value.forEach((exerciseId) => {
      const athlete = availableAthletes.value.find((item) => item.id === exerciseId);
      if (athlete && !existingAthletes.has(athlete.id)) {
        teamAthletes.push(JSON.parse(JSON.stringify(athlete)));
        existingAthletes.add(athlete.id);
      }
    });

    selectedAthleteIds.value = []
    addExerciseDialog.value = false;
  } catch (error) {
    console.error("Failed to add athlete to team", error);
    // exerciseMutationError.value =
    //   error?.response?.data?.message ||
    //   "Unable to save the exercise. Please check the details and try again.";
  } finally {
    // exerciseMutationPending.value = false;
  }
};


const removeExerciseFromPlan = (exerciseId) => {
  if (!selectedTeam) return;
  selectedTeam.exercises = selectedTeam.exercises.filter(
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
            <v-btn icon variant="text" color="primary" @click="newTeamDialog = true">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </v-card-title>

          <v-divider />

          <v-card-text class="flex-grow-1 overflow-y-auto pr-2">
            <v-list density="compact" nav>
              <template v-for="section in teamSections" :key="section.type">
                <v-subheader class="text-uppercase font-weight-medium">
                  {{ section.label }}
                </v-subheader>
                <v-alert v-if="section.plans.length === 0" variant="tonal" type="info">
                  You don't have any teams. Use the + button to get started.
                </v-alert>
                <v-list-item
                  v-for="plan in section.plans"
                  :key="plan.id"
                  :active="selectedTeamKey.type === section.type && selectedTeamKey.id === plan.id"
                  rounded
                  @click="teamSelected(section.type, plan.id);"
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
          <template v-if="selectedTeam">
            <v-card-title class="d-flex flex-column align-start">
              <span class="text-h5">{{ selectedTeam.name }}</span>
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
                <v-alert v-if="!selectedTeam.athletes?.length" variant="tonal" type="info">
                  No athletes on the team. Use the Add Athlete button to get started.
                </v-alert>

                <v-expansion-panels v-else>
                  <v-expansion-panel
                    v-for="athlete in selectedTeam.athletes ?? []"
                    :key="athlete.id"
                  >
                    <v-expansion-panel-title>
                      <div class="d-flex flex-column">
                        <span class="font-weight-medium">{{ athlete.name }}</span>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-btn
                        color="primary"
                        variant="text"
                        @click="removeExerciseFromPlan(athlete.id)"
                      >
                        Contact Athlete
                      </v-btn>
                      <br/>
                      <br/>
                      <v-btn
                        color="error"
                        variant="text"
                        @click="removeExerciseFromPlan(athlete.id)"
                      >
                        Remove
                      </v-btn>
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
              <v-btn color="primary" class="mt-4" @click="newTeamDialog = true">
                New Plan
              </v-btn>
            </v-card-text>
          </template>
        </v-card>
      </v-col>

      <v-col cols="12" lg="3" class="pl-lg-4 mt-6 mt-lg-0">
        <!-- add a third column for looks ;) -->
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
            v-if="selectedTeam.athletes.length < availableAthletes.length"
            density="comfortable"
            lines="two"
            style="max-height: 360px; overflow-y: auto;"
          >
            <v-item-group v-model="selectedAthleteIds" multiple>
              <template v-for="athlete in availableAthletes" :key="athlete.id">
                <v-item :value="athlete.id" v-if="!isAthleteOnTeam(athlete.id)" v-slot="{ isSelected, toggle }">
                  <v-list-item @click="toggle" class="rounded-lg">
                    <template #prepend>
                      <v-checkbox
                        :model-value="isSelected"
                        density="compact"
                        hide-details
                        @click.stop="toggle"
                      />
                    </template>
                    <v-list-item-title>{{ athlete.name }}</v-list-item-title>
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
            :disabled="!selectedAthleteIds.length"
            @click="addAthletesToTeam"
          >
            Add to "{{selectedTeam.name}}"
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="newTeamDialog" max-width="520">
      <v-card>
        <v-card-title>Create New Team</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="createTeam">
            <v-text-field
              v-model="newTeam.name"
              label="Team name"
              prepend-inner-icon="mdi-file-document-edit"
              required
            />
            <v-card-actions class="mt-2">
              <v-spacer />
              <v-btn variant="text" @click="newTeamDialog = false">Cancel</v-btn>
              <v-btn type="submit" color="primary">Create</v-btn>
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
