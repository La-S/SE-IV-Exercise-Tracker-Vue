<script setup>

const props = defineProps({
    mileTimeSubtext: { type: String, default: "" },
    averageMileTime: { type: String, default: "--:--" },
    mileTimeHistory: { type: Array, default: []},
});
</script>

<template>
    <v-card class="pa-3 elevation-2" rounded="xl">
        <v-card-title class="text-subtitle-1 font-weight-bold">
        Average Mile Time
        </v-card-title>
        <v-card-text class="pt-2">
        <div class="d-flex flex-column align-center text-center">
            <div class="text-h5 font-weight-bold">{{ averageMileTime }}</div>
            <div class="text-caption grey--text mb-2">
            {{ mileTimeSubtext }}
            </div>
        </div>
        <div v-if="mileTimeHistory.length === 0" class="text-caption text-center grey--text">
            No cardio data available for the week
        </div>
        </v-card-text>
    </v-card>
</template>