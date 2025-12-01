<script setup>
import { computed } from 'vue';

const props = defineProps({
    completedWorkouts: { type: Number, default: 0 },
    totalWorkouts: { type: Number, default: 0 },
});

let weeklyCompletionRate = computed(() => {
    if (props.totalWorkouts === 0) return 0;
    return parseInt((props.completedWorkouts/props.totalWorkouts)*100, 10);
})
</script>

<template>
    <v-card class="pa-3 elevation-2" rounded="xl">
        <v-card-title class="text-subtitle-1 font-weight-bold">
        Workouts Completed This Week
        </v-card-title>
        <v-card-text class="pt-2">
        <div class="d-flex flex-column align-center text-center">
            <div class="text-body-2 mb-2">
            {{ completedWorkouts }} / {{ totalWorkouts }} Workouts
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
</template>