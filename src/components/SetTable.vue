<script setup>
import { computed } from "vue";
const props = defineProps({
  sets: {
    type: Array,
    default: () => [],
  },
  type: {
    type: String,
    default: "",
  },
  showActual: {
    type: Boolean,
    default: false,
  },
});

const normalizedType = computed(() => (props.type || "").toString().toLowerCase());

const formatGoal = (set) => {
  if (normalizedType.value === "strength") {
    return `${set.goalWeight ?? "-"} lbs × ${set.goalReps ?? "-"} reps`;
  }
  if (normalizedType.value === "cardio") {
    return `${set.goalDist ?? "-"} ${set.distUnits || ""}`.trim();
  }
  return set.goalReps ?? set.goalTime ?? "-";
};

const formatActual = (set) => {
  if (normalizedType.value === "strength") {
    return `${set.actualWeight ?? "-"} lbs × ${set.actualReps ?? "-"} reps`;
  }
  if (normalizedType.value === "cardio") {
    return `${set.actualDist ?? "-"} ${set.distUnits || ""}`.trim();
  }
  return set.actualReps ?? set.actualTime ?? "-";
};
</script>

<template>
  <v-table density="compact" class="text-body-2">
    <thead>
      <tr>
        <th class="text-left">#</th>
        <th class="text-left">Goal</th>
        <th v-if="showActual" class="text-left">Actual</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(set, idx) in sets" :key="set.id ?? idx">
        <td>{{ idx + 1 }}</td>
        <td>{{ formatGoal(set) }}</td>
        <td v-if="showActual">{{ formatActual(set) }}</td>
      </tr>
    </tbody>
  </v-table>
</template>
