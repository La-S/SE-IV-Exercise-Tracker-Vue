<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../services/services';
import dayjs from 'dayjs';

const route = useRoute();
let athleteId = route.params.id
let athleteInfo = ref(null)
let exercises = ref([])
let shouldShowExerciseDialog = ref(false)
let dialogExercise = ref(null)
let dialogExerciseIsCompleted = ref(false)

async function getAthleteInfo() {
  const response = await apiClient.get(`users/${athleteId}`);
  if (response.status != 200){
    throw Error("status not 200.")
  }
  athleteInfo.value = {id: response.data.id, firstName: response.data.first_name, lastName: response.data.last_name, email: response.data.email}
  console.log(athleteInfo.value)
}

async function getExercises() {
  const body = {"startDate": '2025-01-01', "endDate": '2025-12-31'}
  const response = await apiClient.post(`/workout/user/${athleteId}/dated`, body);
  if (response.status != 200){
    throw Error("status not 200.")
  }
  exercises.value = [];
  for (const exercise of response.data) {
    console.log(exercise)
    exercises.value.push({notes: exercise.notes, expectedDate:  new Date(Date.parse(exercise.expected_date)), id: exercise.id, focusArea: exercise.focus_area, date: exercise.date, totalTime: exercise.total_time })
  }
  console.log('data', response.data)
}

function getPrettyDate(dateStr) {
  const day = dayjs(dateStr)
  if (dayjs().isSame(day, "day")) {
    return "Today";
  }
  if (dayjs().isSame(day.subtract(1, "day"), "day")) {
    return "Tomorrow";
  }
  if (dayjs().isSame(day.add(1, "day"), "day")) {
    return "Yesterday";
  }
  // if day == today then return today instaed.

  return day.format('MM/DD/YYYY');
}

function showExercise(exerciseId) {
  console.log("should be showing...")
  dialogExercise = exercises.value.find((exercise) => {return exercise.id == exerciseId});
  dialogExerciseIsCompleted.value = dialogExercise.date != null;
  shouldShowExerciseDialog.value = true;
  console.log(dialogExercise.expectedDate)

}

getAthleteInfo()
getExercises()


</script>

<template>
  <v-container fluid class="pa-6">
    <v-row align="stretch" justify="center" no-gutters>
      <v-col cols="12" lg="3" class="pl-lg-4 mt-6 mt-lg-0">
        <!-- add a first column for looks ;) -->
      </v-col>

      <v-col cols="12" lg="6" class="px-lg-4 mt-6 mt-lg-0">
        <v-card class="h-100">
          <template v-if="athleteInfo">
            <v-card-title class="d-flex flex-wrap align-start">
              <div class="flex-grow-1 d-flex flex-column pr-4">
                <span class="text-h5">{{ athleteInfo.firstName }} {{ athleteInfo.lastName }}</span>
              </div>
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-row>
                <v-col cols="12" md="7">
                  <p class="text-body-2 mb-4">
                     {{ athleteInfo.email }}
                  </p>
                </v-col>
              </v-row>

              <v-divider class="my-4" />

              <div>
                <div class="d-flex align-center justify-space-between mb-4 flex-wrap">
                  <h3 class="text-subtitle-1 font-weight-medium mb-0">Exercises</h3>
                  <v-btn
                    color="primary"
                    variant="tonal"
                    size="small"
                    prepend-icon="mdi-plus"
                    @click="addAthletesToTeamDialog = true"
                  >
                    Add Workouts???
                  </v-btn>
                </div>
                <v-alert v-if="!exercises.length" variant="tonal" type="info">
                  No exercises assigned to this athlete. Add Workout?
                </v-alert>
                  <v-container>
                    <v-row>
                      <v-col sm="4" v-for="exercise in exercises ?? []" :key="exercise.id" >
                        <v-card
                          :title="exercise.focusArea"
                          :text="getPrettyDate(exercise.expectedDate)"
                          variant="tonal"
                          height="100px"
                          @click="showExercise(exercise.id)"
                        >
                        </v-card>
                      </v-col>
                    </v-row>
                  </v-container>
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

    <v-dialog v-model="shouldShowExerciseDialog" max-width="560">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>{{ dialogExercise.focusArea}}</span>
        </v-card-title>
        <v-card-text>
          <v-text-field
            :disabled="dialogExerciseIsCompleted"
            v-model="dialogExercise.focusArea"
            label="Focus Area"
            prepend-inner-icon="mdi-crosshairs-gps"
            required
          />
          <v-text-field
            :disabled="dialogExerciseIsCompleted"
            v-model="dialogExercise.notes"
            label="Notes"
            prepend-inner-icon="mdi-note"
            required
          />
          <!-- ugh gotta format these properly...-->
          <v-text-field
          :disabled="dialogExerciseIsCompleted" 
            v-model="dialogExercise.expectedDate"
            label="Expected date"
            type="date"
            prepend-inner-icon="mdi-calendar-clock"
            required
          />
          <v-text-field
            :disabled="dialogExerciseIsCompleted"
            v-model="dialogExercise.date"
            label="Completion date"
            type="date"
            prepend-inner-icon="mdi-calendar-clock"
            required
          />
          <v-text-field
            :disabled="dialogExerciseIsCompleted"
            v-model="dialogExercise.totalTime"
            label="Elapsed Workout Time"
            prepend-inner-icon="mdi-timer"
            suffix="minutes"
            required
          />
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="shouldShowExerciseDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            @click=""
          >
            Add to Team
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
