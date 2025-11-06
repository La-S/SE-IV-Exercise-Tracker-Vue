<template>
  <v-container class="py-4 px-3" fluid>
    <v-row class="mb-4" dense>
      <v-col cols="12">
        <v-card class="pa-3 elevation-2" rounded="xl">
          <v-card-title class="text-subtitle-1 font-weight-bold">
            This Week’s Workouts
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
    Current Streak
    </v-card-title>
    <v-card-text class="pt-2">
    <div class="d-flex flex-column align-center">
      <v-icon color="#58f707" size="40">mdi-fire</v-icon>
      <div class="text-h5 font-weight-bold mt-1">{{ streakDays }} Days</div>
      <div class="text-caption grey--text mt-1 text-center">
      {{ streakMessage }}
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
              <div class="text-caption grey--text mb-2">Based on recent runs</div>
            </div>
            <v-sparkline
              :value="mileTimeHistory"
              color="primary"
              height="60"
              smooth
              line-width="3"
              padding="8"
            ></v-sparkline>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row dense>
      <v-col cols="12">
        <v-card class="pa-3 elevation-2" rounded="xl">
          <v-card-title class="text-subtitle-1 font-weight-bold">
            Top PRs
          </v-card-title>
          <v-card-text>
            <v-divider class="mb-2"></v-divider>
            <div
              v-for="(weight, exercise) in personalRecords"
              :key="exercise"
              class="d-flex justify-space-between text-body-2 mb-1"
            >
              <span>{{ exercise }}</span>
              <span class="font-weight-medium">{{ weight }} lbs</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "AthleteStatistics",
  data() {
    return {
      completedThisWeek: 4,
      totalThisWeek: 5,
      streakDays: 5,
      averageMileTime: "7:42 / mile",
      mileTimeHistory: [8.1, 7.9, 7.8, 7.7, 7.5, 7.4, 7.42, 7.45],
      personalRecords: {
        "Bench Press": 135,
        "Squat": 185,
        "Deadlift": 225,
        "Overhead Press": 85,
      },
    };
  },
  computed: {
    weeklyCompletionRate() {
      return Math.round((this.completedThisWeek / this.totalThisWeek) * 100);
    },
    streakMessage() {
      if (this.streakDays >= 5) return "You’ve worked out every day this week!";
      if (this.streakDays >= 3) return "Solid progress—keep your streak going!";
      return "Let’s kick off a new streak!";
    },
  },
};
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