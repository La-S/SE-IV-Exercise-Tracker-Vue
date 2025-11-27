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
});

const normalizedType = computed(() => (props.type || "").toString().toLowerCase());
</script>

<template>
  <v-table density="compact" class="text-body-2">
    <thead>
      <tr>
        <th class="text-left">#</th>
        <th class="text-left">Goal</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(set, idx) in sets" :key="set.id ?? idx">
        <td>{{ idx + 1 }}</td>
        <td>
          <span v-if="normalizedType === 'strength'">
            {{ set.goalWeight ?? "-" }} lbs × {{ set.goalReps ?? "-" }} reps
          </span>
          <span v-else-if="normalizedType === 'cardio'">
            {{ set.goalDist ?? "-" }} {{ set.distUnits || "" }}
          </span>
          <span v-else>
            {{ set.goalReps ?? set.goalTime ?? "-" }}
          </span>
        </td>
      </tr>
    </tbody>
  </v-table>
</template>
