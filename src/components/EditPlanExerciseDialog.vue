<script setup>
import { computed } from "vue";
const cardioDistanceUnits = ["mi", "km", "m", "feet", "laps"];

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  draft: { type: Object, default: () => ({ sets: [] }) },
  pending: { type: Boolean, default: false },
  error: { type: String, default: "" },
  validation: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "add-set", "remove-set", "save", "cancel"]);

const close = () => emit("update:modelValue", false);
const addSet = () => emit("add-set");
const removeSet = (index) => emit("remove-set", index);
const save = () => emit("save");
const cancel = () => {
  close();
  emit("cancel");
};

const isStrength = computed(() => props.draft?.templateType === "strength");
const isCardio = computed(() => props.draft?.templateType === "cardio");
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="900" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>Edit Exercise</v-card-title>
      <v-card-text>
        <v-alert v-if = "error" type = "error" variant = "tonal" density = "comfortable" class = "mb-4">
          {{ error }}
        </v-alert>

        <div class = "mb-4">
          <div class = "text-subtitle-1 font-weight-medium">
            {{ draft.templateName }}
          </div>
          <div class = "text-body-2 text-medium-emphasis">
            {{ draft.templateLabel }} • {{ draft.muscleGroupLabel || "General" }}
          </div>
        </div>

        <v-row>
          <v-col cols = "12" md = "4">
            <v-text-field
              v-model = "draft.restTimer"
              label = "Rest timer (seconds)"
              type = "number"
              min = "0"
              prepend-inner-icon = "mdi-timer-outline"
              density = "comfortable"
            />
          </v-col>
          <v-col cols = "12" md = "8">
            <v-textarea
              v-model = "draft.notes"
              label = "Notes"
              rows = "2"
              auto-grow
              prepend-inner-icon = "mdi-note-text"
              density = "comfortable"
            />
          </v-col>
        </v-row>

        <v-divider class = "my-4" />

        <div class = "d-flex justify-space-between align-center mb-2">
          <h4 class = "text-subtitle-2 font-weight-medium mb-0">Sets</h4>
          <v-btn variant = "text" size = "small" color = "primary" @click = "addSet">Add Set</v-btn>
        </div>

        <v-alert v-if = "!draft.sets?.length" type = "info" variant = "tonal" density = "comfortable" class = "mb-2">
          No sets added yet.
        </v-alert>

        <div v-else>
          <div
            v-for = "(set, index) in draft.sets"
            :key = "index"
            class = "pa-3 rounded-lg mb-3"
            style = "background-color: rgba(255, 255, 255, 0.04);"
          >
            <div class = "d-flex justify-space-between align-center mb-2">
              <span class = "text-body-2 font-weight-medium">Set {{ index + 1 }}</span>
              <v-btn variant = "tonal" color = "error" size = "small" prepend-icon = "mdi-delete" @click = "removeSet(index)">
                Remove
              </v-btn>
            </div>
            <v-row>
              <v-col cols = "12" md = "4" v-if = "isStrength">
                <v-text-field v-model = "set.goalWeight" label = "Goal weight (lbs)" type = "number" prepend-inner-icon = "mdi-weight-lifter" density = "comfortable" />
              </v-col>
              <v-col cols = "12" md = "4" v-if = "isStrength">
                <v-text-field v-model = "set.goalReps" label = "Goal reps" type = "number" prepend-inner-icon = "mdi-counter" density = "comfortable" />
              </v-col>

              <v-col cols = "12" md = "4" v-if = "isCardio">
                <v-text-field v-model = "set.goalDist" label = "Goal distance" type = "number" prepend-inner-icon = "mdi-ruler" density = "comfortable" />
              </v-col>
              <v-col cols = "12" md = "4" v-if = "isCardio">
                <v-select
                  v-model = "set.distUnits"
                  :items = "cardioDistanceUnits"
                  label = "Distance units"
                  prepend-inner-icon = "mdi-ruler-square"
                  density = "comfortable"
                />
              </v-col>
              <v-col cols = "12" md = "4" v-if = "!isStrength && !isCardio">
                <v-text-field v-model = "set.goalReps" label = "Goal reps" type = "number" prepend-inner-icon = "mdi-counter" density = "comfortable" />
              </v-col>
            </v-row>
          </div>
        </div>

        <v-alert v-if = "validation" type = "error" variant = "tonal" density = "comfortable" class = "mt-2">
          {{ validation }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant = "text" @click = "cancel">Cancel</v-btn>
        <v-btn color = "primary" :disabled = "pending" :loading = "pending" @click = "save">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
