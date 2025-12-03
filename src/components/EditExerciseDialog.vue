<script setup>
import { reactive, watch } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  exercise: { type: Object, default: () => ({}) },
  pending: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "submit", "cancel"]);

const form = reactive({
  name: "",
  type: "",
  muscleGroup: "",
  restTimer: null,
  notes: "",
  source: "library",
});

const syncForm = () => {
  form.name = props.exercise?.name ?? "";
  form.type = props.exercise?.type ?? "";
  form.muscleGroup = props.exercise?.muscleGroup ?? "";
  form.restTimer = props.exercise?.restTimer ?? null;
  form.notes = props.exercise?.notes ?? "";
  form.source = props.exercise?.source ?? "library";
  form.assignmentId = props.exercise?.assignmentId ?? null;
  form.templateId = props.exercise?.templateId ?? null;
};

watch(
  () => props.modelValue,
  (open) => {
    if (open) syncForm();
  },
  { immediate: true }
);

watch(
  () => props.exercise,
  () => {
    if (props.modelValue) syncForm();
  },
  { deep: true }
);

const close = () => emit("update:modelValue", false);
const cancel = () => {
  close();
  emit("cancel");
};
const submit = () => {
  emit("submit", { ...form });
};
</script>

<template>
  <v-dialog :model-value = "modelValue" max-width = "520" @update:model-value = "emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>Edit Exercise</v-card-title>
      <v-card-text>
        <v-form @submit.prevent = "submit">
          <v-alert v-if = "error" type = "error" variant = "tonal" class = "mb-4">
            {{ error }}
          </v-alert>
          <v-alert v-if = "form.source === 'library'" type = "info" variant = "tonal" class = "mb-4">
            Updating this exercise will also update any plans using it.
          </v-alert>
          <v-alert v-else type = "info" variant = "tonal" class = "mb-4">
            Template fields are locked here. Adjust the rest timer or notes for this plan.
          </v-alert>

          <v-text-field
            v-model = "form.name"
            label = "Exercise name"
            prepend-inner-icon = "mdi-dumbbell"
            :disabled = "form.source === 'plan'"
            required
          />
          <v-select
            v-model = "form.type"
            :items = "['Strength', 'Cardio', 'Mobility', 'Other']"
            label = "Type"
            prepend-inner-icon = "mdi-format-list-bulleted"
            :disabled = "form.source === 'plan'"
          />
          <v-select
            v-model = "form.muscleGroup"
            :items = "['Chest','Back','Core','Shoulder','Tricep','Bicep','Forearm','Quad','Glute','Hamstring','Calf','Other']"
            label = "Muscle group"
            prepend-inner-icon = "mdi-dna"
            :disabled = "form.source === 'plan'"
          />
          <v-text-field
            v-if = "form.source === 'plan'"
            v-model = "form.restTimer"
            label = "Rest timer (seconds)"
            type = "number"
            min = "0"
            prepend-inner-icon = "mdi-timer-outline"
            density = "comfortable"
            class = "mt-3"
          />
          <v-textarea
            v-if = "form.source === 'plan'"
            v-model = "form.notes"
            label = "Notes"
            rows = "3"
            auto-grow
            prepend-inner-icon = "mdi-note-text"
            density = "comfortable"
            class = "mt-3"
          />
          <v-card-actions class = "mt-2">
            <v-spacer />
            <v-btn variant = "text" @click = "cancel">Cancel</v-btn>
            <v-btn type = "submit" color = "primary" :disabled = "!form.name || pending" :loading = "pending">
              Save
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
