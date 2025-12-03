<script setup>
    const props = defineProps({
        personalRecords: { type: Object, default: {} },
        liftingSubtext: { type: String, default: ""},
    });
</script>

<template>
    <v-card class="pa-3 elevation-2" rounded="xl">
        <v-card-title class="text-subtitle-1 font-weight-bold">
        Lifting History
        </v-card-title>
        <v-card-text class="pt-2">
        <div
            v-if="Object.keys(personalRecords).length > 0"
            v-for="(weight, exercise) in personalRecords"
            :key="exercise"
            class="d-flex justify-space-between text-body-2 mb-1"
        >
            <span>{{ exercise }}</span>
            <span class="font-weight-medium">{{ weight }} lbs</span>
        </div>
        <div class="d-flex flex-column align-center text-center mt-2">
            <div class="text-caption grey--text">
            {{ liftingSubtext }}
            </div>
        </div>
        </v-card-text>
    </v-card>
</template>