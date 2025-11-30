<script setup>
const props = defineProps({
  plans: {
    type: Array,
    default: () => [],
  },
  selectedPlanId: {
    type: [Number, String, null],
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["select", "create"]);

const handleSelect = (id) => emit("select", id);
const handleCreate = () => emit("create");
</script>

<template>
  <v-card class = "h-100 d-flex flex-column">
    <v-card-title class = "d-flex align-center justify-space-between flex-wrap gap-2">
      <span class = "text-h6 text-sm-h5">Exercise Plans</span>
      <v-btn
        variant = "tonal"
        color = "primary"
        size = "small"
        prepend-icon = "mdi-plus"
        class = "text-none"
        @click = "handleCreate"
      >
        Create Plan
      </v-btn>
    </v-card-title>

    <v-divider />

    <v-card-text class="flex-grow-1 overflow-y-auto pr-2">
      <v-alert
        v-if = "error"
        type = "error"
        variant = "tonal"
        class = "mb-4"
      >
        {{ error }}
      </v-alert>
      <div v-else-if = "loading" class = "d-flex justify-center py-6">
        <v-progress-circular indeterminate color = "primary" />
      </div>
      <template v-else>
        <v-list v-if = "plans.length" density = "compact" nav>
          <v-list-item
            v-for = "plan in plans"
            :key = "plan.id"
            :active = "selectedPlanId === plan.id"
            rounded
            class = "mb-2"
            @click = "handleSelect(plan.id)"
          >
            <v-list-item-title class = "font-weight-medium">
              {{ plan.focusArea }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ plan.notes || "No notes yet" }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
        <v-alert
          v-else
          type = "info"
          variant = "tonal"
          density = "comfortable"
        >
          No workouts yet. Create one to get started.
        </v-alert>
      </template>
    </v-card-text>
  </v-card>
</template>
