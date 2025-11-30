<script setup>
import { reactive, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "Plan",
  },
  submitLabel: {
    type: String,
    default: "Save",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: "",
  },
  initialPlan: {
    type: Object,
    default: () => ({ focusArea: "", notes: "", id: null }),
  },
});

const emit = defineEmits(["update:modelValue", "submit", "cancel"]);

const form = reactive({
  id: null,
  focusArea: "",
  notes: "",
});

const syncForm = () => {
  form.id = props.initialPlan?.id ?? null;
  form.focusArea = props.initialPlan?.focusArea ?? "";
  form.notes = props.initialPlan?.notes ?? "";
};

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      syncForm();
    }
  },
  { immediate: true }
);

watch(
  () => props.initialPlan,
  () => {
    if (props.modelValue) {
      syncForm();
    }
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
  <v-dialog :model-value="modelValue" max-width="520" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submit">
          <v-alert v-if="error && modelValue" type="error" variant="tonal" class="mb-4">
            {{ error }}
          </v-alert>
          <v-text-field
            v-model="form.focusArea"
            label="Focus area"
            prepend-inner-icon="mdi-crosshairs-gps"
            required
          />
          <v-textarea
            v-model="form.notes"
            label="Notes"
            rows="3"
            auto-grow
            prepend-inner-icon="mdi-note-outline"
          />
          <v-card-actions class="mt-2">
            <v-spacer />
            <v-btn variant="text" @click="cancel">Cancel</v-btn>
            <v-btn type="submit" color="primary" :disabled="loading || !form.focusArea" :loading="loading">
              {{ submitLabel }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
