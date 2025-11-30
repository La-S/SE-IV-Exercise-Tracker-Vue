<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import apiClient from "../services/services";
import { useRouter } from "vue-router";

const teams = ref([]);

const selectedTeam = ref(null);

const availableAthletes = ref([]);

const teamCreationError = ref(null);
const teamUpdateError = ref(null);
const addAthletesError = ref(null);

const router = useRouter();

const athleteSearch = ref("");

const selectedTeamKey = reactive({ type: "team", id: teams.value[0]?.id ?? null });

const getAthletesOnTeam = async () => {
  if (!selectedTeam) return;
  let athleteArray = [];
  if (selectedTeam.value){
    const response = await apiClient.get(`team/${selectedTeam.value.id}/users`);
    
    if (response.status != 200){
      throw Error("Status not 200.")
    }
    selectedTeam.value.athletes = []
    response.data.forEach((athlete) =>{
      selectedTeam.value.athletes.push({id: athlete.id, firstName: athlete.first_name, lastName: athlete.last_name, email: athlete.email, role: athlete.role});
      selectedTeam.value.athletes.sort(athleteSort);
    })
  }
};

const getAllAthletes = async () => {
  const response = await apiClient.get(`users`);
  if (response.status != 200){
    throw Error("status not 200.")
  }
  availableAthletes.value = []
  response.data.forEach((athlete) =>{
    availableAthletes.value.push({id: athlete.id, firstName: athlete.first_name, lastName: athlete.last_name, email: athlete.email})
  })
};

const teamSelected = (teamId) => {
  if (!selectedTeamKey.id) {
    selectedTeam.value = null;
  }
  const collection = teams.value;
  selectedTeamKey.id = teamId;
  selectedTeam.value = collection.find((team) => team.id === selectedTeamKey.id) ?? null;

  try {
    getAthletesOnTeam()
  } catch (e) {
    console.log("Error getting the athletes on the team.")
  }
}

const loadTeams = async () => {
  const response = await apiClient.get("team");
  const data = response.data;
  if (Array.isArray(data)) {
    teams.value = data.map((template) =>  {return {name: template.name, id: template.id, athletes: []} });
    sortTeams();
  } else {
    teams.value = [];
  }
};

function sortTeams(){
  teams.value.sort(teamSort);
}
function teamSort(a, b){
  if (a.name.toUpperCase() < b.name.toUpperCase()) return -1;
  else return 1;
}

function athleteSort(a, b){
  if (a.role ==="coach"){ 
    if (b.role !== "coach"){
      return -1;
    }
    if (a.firstName.toUpperCase() < b.firstName.toUpperCase()) return -1;
    else return 1;
  }
  if (b.role === "coach") return 1; // first block handles a coach case
  if (a.firstName.toUpperCase() < b.firstName.toUpperCase()) return -1;
  else return 1;
}

onMounted(() => {
  loadTeams();
  getAllAthletes();
});

watch(
  () => [teams.value.length],
  () => {
    if (selectedTeamKey.id) {
      if (selectedTeam.value === null) {
        teamSelected(selectedTeamKey.id);
      }
      return
    };
    const defaultTeam = teams.value[0] ?? teams.value[0];
    if (defaultTeam) {
      selectedTeamKey.type = teams.value.find((team) => team.id === defaultTeam.id)
        ? "team"
        : "others";
      selectedTeamKey.id = defaultTeam.id;
      teamSelected(selectedTeamKey.type, selectedTeamKey.id);
    }
  },
  { immediate: true }
);

const newTeamDialog = ref(false);
const editTeamDialog = ref(false);
const addAthletesToTeamDialog = ref(false);
const selectedAthleteIds = ref([]);
const newTeam = reactive({
  id: undefined,
  type: "team",
  name: "",
  athletes: []
});

const resetNewTeam = () => {
  newTeam.id = undefined;
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
    const response = await apiClient.post("team", payload);
    const createdTeam = {
      "id": response.data.id,
      "name": response.data.name,
      "athletes": []
    }
    teams.value.push(createdTeam);
    resetNewTeam();
    newTeamDialog.value = false
    teamCreationError.value = null;
  } catch (error) {
    console.error("Failed to create exercise team", error);
    teamCreationError.value = error?.response?.data?.message || "Unable to create the Team. Please check the name or try again later.";
  }
  sortTeams();
};

const updateTeam = async function() {
  if (!newTeam.name.trim()) { return; }

  const payload = {"name": newTeam.name.trim()}

  try {
    const response = await apiClient.put(`team/${newTeam.id}`, payload);
    if (response.status != 200) {
      throw Error("Team failed to be created!")
    }
    selectedTeam.value.name = newTeam.name.trim();
    resetNewTeam();
    editTeamDialog.value = false
    teamUpdateError.value = null;
  } catch (error) {
    console.error("Failed to update team", error);
    teamUpdateError.value = error?.response?.data?.message || "Unable to save the exercise. Please check the details and try again.";
  }
  sortTeams();
};

function isAthleteOnTeam(athleteId) {
  let isOnTeam = !!getCopyOfAthletesForTeam().find((a) => a.id === athleteId);
  return isOnTeam;
}

function getCopyOfAthletesForTeam() {
  return JSON.parse(JSON.stringify(selectedTeam.value.athletes));
}

const addAthletesToTeam = async () => {
  if (!selectedTeam || !selectedAthleteIds.value.length) return;

  const teamAthletes = selectedTeam.value.athletes;
  const existingAthletes = new Set(teamAthletes.map((athletes) => athletes.id));

  try {
    const response = await apiClient.post(`team/${selectedTeam.value.id}/users`, selectedAthleteIds.value);
    if (response.status != 200){
      throw Error("status not 200.")
    }
    // add the athletes to the list.
    selectedAthleteIds.value.forEach((exerciseId) => {
      const athlete = availableAthletes.value.find((item) => item.id === exerciseId);
      if (athlete && !existingAthletes.has(athlete.id)) {
        teamAthletes.push(JSON.parse(JSON.stringify(athlete)));
        existingAthletes.add(athlete.id);
      }
    });

    selectedAthleteIds.value = []
    addAthletesToTeamDialog.value = false;
    addAthletesError.value = null;
  } catch (error) {
    console.error("Failed to add athlete to team", error);
    addAthletesError.value = error?.response?.data?.message || "Unable to add the athletes to your team. Please check your connection and try again later.";
  }
};

const deleteTeam = async (team) => {
  try {
    let response = await apiClient.delete(`team/${team.id}`);
    if (response.status != 200) {
      throw Error("ERROR!")
    }
    let teamIndex = teams.value.find((findTeam) => { return findTeam.name == team.name; })
    let idx = teams.value.indexOf(teamIndex);
    teams.value.splice(idx, 1);
    teamSelected('team', undefined);
    selectedTeam.value = teams.value.at(0);
  } catch (error) {
    console.error(`Failed to delete plan ${team.id}`, error);
  }
};


const confirmTeamDeletion = (team) => {
  if (!team) return;
  const confirmation = window.confirm(
    `Delete team "${team.name}"? This action cannot be undone.`
  );
  if (confirmation) {
    deleteTeam(team);
  }
};

const removeAthleteFromTeam = async (athleteId) => { // todo maybe add warning if this fails.
  if (!selectedTeam) return;

  const response = await apiClient.delete(`team/${selectedTeam.value.id}/users`, {data: [athleteId]});
  if (response.status != 200){
    throw Error("status not 200.")
  }
  selectedTeam.value.athletes = selectedTeam.value.athletes.filter(
    (item) => item.id !== athleteId
  );
};

const email = (email) => {
  window.location.href = `mailto:${email}`
}

const viewAthleteInfo = (athlete) => {
   router.push({ path: `athlete-info/${athlete.id}`,  });
}

const sortedAthletes = computed(() => selectedTeam.value.athletes.sort(athleteSort));
const searchableAthletes = computed(() => {
  const term = athleteSearch.value.trim().toLowerCase();
  return availableAthletes.value.filter((athlete) => {
    if (selectedTeam.value.athletes.find((a) => {return a == athlete})) {
      return false;
    }
    
    if (!term) {
       return true;
    }
    let athleteSearchable = athlete.firstName + " " + athlete.lastName + " " + athlete.email
    athleteSearchable = athleteSearchable.toLowerCase();
    if (athleteSearchable.indexOf(term) != -1) {
      return true;
    }
  }).sort(athleteSort);
});

</script>

<template>
  <v-container fluid class="pa-6">
    <v-row align="stretch" justify="center" no-gutters>
      <v-col cols="12" lg="3" class="pr-lg-4">
        <v-card class="h-100 d-flex flex-column">
          <v-card-title class="d-flex align-center">
            Teams
            <v-spacer />
            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              prepend-icon="mdi-plus"
              @click="newTeamDialog = true"
            >
              Create Team
            </v-btn>
          </v-card-title>

          <v-divider />

          <v-card-text class="flex-grow-1 overflow-y-auto pr-2">
            <v-list density="compact" nav>
                <span v-if="teams.length > 0">
                  <div class="text-uppercase font-weight-medium">                    
                    Teams
                  </div>
                  <v-alert v-if="teams.length === 0" variant="tonal" type="info">
                    There are not any teams. Use the + button to create one.
                  </v-alert>
                  <v-list-item
                    v-for="team in teams"
                    :key="team.id"
                    :active="selectedTeamKey.id === team.id"
                    rounded
                    @click="teamSelected(team.id);"
                  >
                    <v-list-item-title>{{ team.name }}</v-list-item-title>
                  </v-list-item>
                </span>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6" class="px-lg-4 mt-6 mt-lg-0">
        <v-card class="h-100">
          <template v-if="selectedTeam">
            <v-card-title class="d-flex flex-wrap align-start">
              <div class="flex-grow-1 d-flex flex-column pr-4">
                <span class="text-h5">{{ selectedTeam.name }}</span>
              </div>
              <div class="d-flex align-center mt-3 mt-sm-0">
              <v-btn
                  variant="tonal"
                  color="primary"
                  size="small"
                  class="mr-2"
                  prepend-icon="mdi-pencil"
                  @click="newTeam.name = selectedTeam.name; newTeam.type = selectedTeam.type; newTeam.id = selectedTeam.id;  editTeamDialog = true"
                >
                  Edit
                </v-btn>
                <v-btn
                  variant="text"
                  color="error"
                  size="small"
                  prepend-icon="mdi-delete"
                  @click="confirmTeamDeletion(selectedTeam)"
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
                    {{ `There are ${selectedTeam.athletes.length} athletes on this team.` }}
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
                    @click="addAthletesToTeamDialog = true"
                  >
                    Add User
                  </v-btn>
                </div>
                <v-alert v-if="!selectedTeam.athletes?.length" variant="tonal" type="info">
                  No users on the team. Use the Add User button to get started.
                </v-alert>

                <v-expansion-panels v-else>
                  <v-expansion-panel
                    v-for="athlete in sortedAthletes ?? []"
                    :key="athlete.id"
                  >
                    <v-expansion-panel-title>
                      <div class="d-flex flex-column">
                        <span class="font-weight-medium">{{ athlete.role === "coach" ? 'Coach ' + athlete.firstName : athlete.firstName }} {{ athlete.lastName }}</span>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-btn
                        color="primary"
                        variant="text"
                        @click="email(athlete.email)"
                      >
                        Contact User
                      </v-btn>
                      <br/>
                      <br/>
                      <v-btn
                        color="error"
                        variant="text"
                        @click="removeAthleteFromTeam(athlete.id)"
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
              <p class="text-body-1">Create a team to get started, or select one from the sidebar.</p>
              <v-btn color="primary" class="mt-4" @click="newTeamDialog = true">
                New Team
              </v-btn>
            </v-card-text>
          </template>
        </v-card>
      </v-col>

      <v-col cols="12" lg="3" class="pl-lg-4 mt-6 mt-lg-0">
        <!-- add a third column for looks ;) -->
      </v-col>
    </v-row>

    <v-dialog v-model="addAthletesToTeamDialog" max-width="560">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Select Athletes to add to '{{ selectedTeam.name }}'</span>
        </v-card-title>
        <v-card-text>
            <v-row class="mb-3" dense>
            <v-text-field
                v-model="athleteSearch"
                label="Search athletes"
                prepend-inner-icon="mdi-magnify"
                density="comfortable"
            />
          </v-row>
          <v-list
            v-if="searchableAthletes.length > 0"
            density="comfortable"
            lines="two"
            style="max-height: 360px; overflow-y: auto;"
          >
            <v-item-group v-model="selectedAthleteIds" multiple>
              <template v-for="athlete in searchableAthletes" :key="athlete.id">
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
                    <v-list-item-title>{{ athlete.firstName }} {{ athlete.lastName }}</v-list-item-title>
                  </v-list-item>
                </v-item>
              </template>
            </v-item-group>
          </v-list>
          <v-alert v-else type="info" variant="tonal">
            No more athletes are available. Tell your athlete to create an account or change your search term.
          </v-alert>
          <v-alert v-if="addAthletesError" type="error" variant="tonal">
           {{addAthletesError}}
          </v-alert>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="addAthletesToTeamDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :disabled="!selectedAthleteIds.length"
            @click="addAthletesToTeam"
          >
            Add to Team
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
          <v-alert v-if="teamCreationError" type="error" variant="tonal">
           {{teamCreationError}}
          </v-alert>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editTeamDialog" max-width="520">
      <v-card>
        <v-card-title>Edit Team</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="updateTeam">
            <v-text-field
              v-model="newTeam.name"
              label="Team name"
              prepend-inner-icon="mdi-file-document-edit"
              required
            />
            <v-card-actions class="mt-2">
              <v-spacer />
              <v-btn variant="text" @click="editTeamDialog = false">Cancel</v-btn>
              <v-btn type="submit" color="primary">Update</v-btn>
            </v-card-actions>
          </v-form>
          <v-alert v-if="teamUpdateError" type="error" variant="tonal">
           {{teamUpdateError}}
          </v-alert>
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
