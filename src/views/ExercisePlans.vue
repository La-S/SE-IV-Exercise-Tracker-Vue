<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import apiClient from "../services/services.js";
import Utils from "../config/utils.js";

const DEFAULT_REST_TIMER = 90;

const muscleFocusOrder = [
  "Core",
  "Chest",
  "Bicep",
  "Tricep",
  "Forearm",
  "Shoulder",
  "Back",
  "Hamstring",
  "Calf",
  "Quad",
  "Glute",
  "Cardio",
  "Other",
];

const plans = ref([]);

const plansLoading = ref(true);
const planLoadError = ref(null);
const planMutationPending = ref(false);
const planMutationError = ref(null);

const availableExercises = ref([]);
const exercisesLoading = ref(true);
const exerciseLoadError = ref(null);
const exerciseMutationError = ref(null);
const exerciseMutationPending = ref(false);

const addExerciseDialog = ref(false);
const selectedExerciseIds = ref([]);
const showInlineExerciseForm = ref(false);
const exerciseSearch = ref("");
const exerciseFocusFilter = ref("all");

const newPlanDialog = ref(false);
const editPlanDialog = ref(false);
const editExerciseDialog = ref(false);
const addSetDialog = ref(false);

const newPlan = reactive({
  focusArea: "",
  notes: "",
  expectedDate: "",
  date: "",
});

const editPlan = reactive({
  id: null,
  focusArea: "",
  notes: "",
  expectedDate: "",
  date: "",
});

const inlineExercise = reactive({
  name: "",
  type: "",
  muscleGroup: "",
});

const editExercise = reactive({
  templateId: null,
  assignmentId: null,
  source: "library",
  planId: null,
  name: "",
  type: "",
  muscleGroup: "",
  restTimer: DEFAULT_REST_TIMER,
  notes: "",
});

const setFormContext = reactive({
  planId: null,
  exerciseAssignmentId: null,
  exerciseType: "",
});

const newSet = reactive({
  completed: false,
  goalWeight: null,
  goalReps: null,
  goalTime: null,
  goalDist: null,
  actualWeight: null,
  actualReps: null,
  actualTime: null,
  actualDist: null,
  distUnits: "",
});

const exerciseFocusOptions = computed(() => [
  { label: "All", value: "all" },
  ...muscleFocusOrder.map((focus) => ({
    label: focus,
    value: focus.toLowerCase(),
  })),
]);

let templateLookup = new Map();
let setsByExerciseId = new Map();

const formatLabel = (value) => {
  if (!value && value !== 0) return "";
  const label = String(value);
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().slice(0, 10);
};

const formatDateLabel = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
};

const parseNumericId = (value) => {
  if (value === null || value === undefined) return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};


const resolveUserContext = () => {
  const stored = Utils.getStore("user") || {};
  const rawUserId = stored.userId ?? stored.user_id ?? stored.id;
  const userId = parseNumericId(rawUserId);
  const rawCoachId = stored.coachId ?? stored.coach_id;
  const coachId = parseNumericId(rawCoachId) ?? userId; 
  return { userId, coachId };
};

const selectedPlanId = ref(null);

const selectedPlan = computed(() => {
  if (!selectedPlanId.value) return null;
  return plans.value.find((plan) => plan.id === selectedPlanId.value) ?? null;
});

const ensureSelectedPlan = () => {
  if (selectedPlanId.value) {
    const exists = plans.value.some((plan) => plan.id === selectedPlanId.value);
    if (exists) {
      return;
    }
  }
  selectedPlanId.value = plans.value[0]?.id ?? null;
};

watch(
  () => plans.value.length,
  () => {
    ensureSelectedPlan();
  },
  { immediate: true }
);

onMounted(() => {
  loadPlans();
});

const setTemplateLookup = () => {
  templateLookup = new Map(availableExercises.value.map((exercise) => [exercise.id, exercise]));
};

const mapTemplateToExercise = (template) => ({
  id: template.id,
  name: template.name ?? "Unnamed Exercise",
  type: formatLabel(template.type ?? "other"),
  muscleGroup: template.muscle_group ? formatLabel(template.muscle_group) : "",
  notes: "",
});

const mapWorkoutToPlan = (workout) => {
  return {
    id: workout.id,
    parentId: workout.parent_id ?? null,
    userId: workout.user_id ?? null,
    coachId: workout.coach_id ?? null,
    notes: workout.notes ?? "",
    expectedDate: toDateInputValue(workout.expected_date),
    date: toDateInputValue(workout.date),
    focusArea: workout.focus_area ?? "",
    exercises: [],
  };
};

const mapSetToPlanSet = (set) => ({
  id: set.id,
  completed: !!set.completed,
  goalWeight: set.goal_weight ?? null,
  goalReps: set.goal_reps ?? null,
  goalTime: set.goal_time ?? null,
  goalDist: set.goal_dist ?? null,
  actualWeight: set.actual_weight ?? null,
  actualReps: set.actual_reps ?? null,
  actualTime: set.actual_time ?? null,
  actualDist: set.actual_dist ?? null,
  distUnits: set.dist_units ?? null,
});

const mapAssignmentToPlanExercise = (assignment) => {
  const template = templateLookup.get(assignment.exercise_template_id);
  const restValue = Number(assignment.rest_timer);
  const sets = setsByExerciseId.get(assignment.id) ?? [];
  return {
    assignmentId: assignment.id,
    templateId: assignment.exercise_template_id,
    name: template?.name ?? `Exercise #${assignment.exercise_template_id}`,
    type: template?.type ?? "Other",
    muscleGroup: template?.muscleGroup ?? "",
    restTimer: Number.isFinite(restValue) ? restValue : 0,
    notes: assignment.notes ?? "",
    sets,
  };
};

const propagateTemplateToPlans = (template) => {
  plans.value.forEach((plan) => {
    plan.exercises.forEach((exercise) => {
      if (exercise.templateId === template.id) {
        exercise.name = template.name;
        exercise.type = template.type;
        exercise.muscleGroup = template.muscleGroup;
      }
    });
  });
};

const removePlanExercisesByTemplate = (templateId) => {
  plans.value.forEach((plan) => {
    plan.exercises = plan.exercises.filter((exercise) => exercise.templateId !== templateId);
  });
};

const collectAssignmentIdsByTemplate = (templateId) => {
  const assignmentIds = [];
  plans.value.forEach((plan) => {
    plan.exercises.forEach((exercise) => {
      if (exercise.templateId === templateId && exercise.assignmentId) {
        assignmentIds.push(exercise.assignmentId);
      }
    });
  });
  return assignmentIds;
};

const loadPlans = async () => {
  plansLoading.value = true;
  exercisesLoading.value = true;
  planLoadError.value = null;
  exerciseLoadError.value = null;

  try {
    const [workoutResponse, exerciseResponse, templateResponse, setResponse] = await Promise.all([
      apiClient.get("workout"),
      apiClient.get("exercise"),
      apiClient.get("exerciseTemplate"),
      apiClient.get("set"),
    ]);

    const templates = Array.isArray(templateResponse.data) ? templateResponse.data : [];
    availableExercises.value = templates.map(mapTemplateToExercise);
    setTemplateLookup();

    const workouts = Array.isArray(workoutResponse.data) ? workoutResponse.data : [];
    const assignments = Array.isArray(exerciseResponse.data) ? exerciseResponse.data : [];
    const sets = Array.isArray(setResponse.data) ? setResponse.data : [];

    setsByExerciseId = new Map();
    sets.forEach((set) => {
      const list = setsByExerciseId.get(set.exercise_id) ?? [];
      list.push(mapSetToPlanSet(set));
      setsByExerciseId.set(set.exercise_id, list);
    });

    const { coachId: currentCoachId } = resolveUserContext();
    const filteredWorkouts =
      Number.isFinite(currentCoachId) && currentCoachId !== null
        ? workouts.filter((workout) => workout.coach_id === currentCoachId)
        : workouts;

    const plansById = new Map();
    const nextPlans = [];

    filteredWorkouts.forEach((workout) => {
      const plan = mapWorkoutToPlan(workout);
      plansById.set(plan.id, plan);
      nextPlans.push(plan);
    });

    assignments.forEach((assignment) => {
      const plan = plansById.get(assignment.workout_id);
      if (plan) {
        plan.exercises.push(mapAssignmentToPlanExercise(assignment));
      }
    });

    plans.value = nextPlans;
    ensureSelectedPlan();
  } catch (error) {
    console.error("Failed to load plans", error);
    const message =
      error?.response?.data?.message ||
      "Unable to load plans. Please refresh and try again.";
    planLoadError.value = message;
    exerciseLoadError.value = message;
    plans.value = [];
    availableExercises.value = [];
  } finally {
    setTemplateLookup();
    plansLoading.value = false;
    exercisesLoading.value = false;
  }
};

const resetInlineExercise = () => {
  Object.assign(inlineExercise, {
    name: "",
    type: "",
    muscleGroup: "",
  });
};

const toggleInlineExerciseForm = () => {
  exerciseMutationError.value = null;
  exerciseMutationPending.value = false;
  showInlineExerciseForm.value = !showInlineExerciseForm.value;
  if (!showInlineExerciseForm.value) {
    resetInlineExercise();
  }
};

const normalizeTemplateFields = (exercise) => {
  const typeValue = (exercise.type || "").toString().trim().toLowerCase();
  const muscleValue = (exercise.muscleGroup || "").toString().trim().toLowerCase();
  return {
    name: exercise.name.trim(),
    type: typeValue || "other",
    muscleGroup: muscleValue || "other",
  };
};

const toTemplatePayload = (exercise) => ({
  name: exercise.name,
  type: exercise.type,
  muscle_group: exercise.muscleGroup,
});

const resetNewSet = () => {
  newSet.completed = false;
  newSet.goalWeight = null;
  newSet.goalReps = null;
  newSet.goalTime = null;
  newSet.goalDist = null;
  newSet.actualWeight = null;
  newSet.actualReps = null;
  newSet.actualTime = null;
  newSet.actualDist = null;
  newSet.distUnits = "";
};

const openAddSetDialog = (planId, exercise) => {
  exerciseMutationError.value = null;
  exerciseMutationPending.value = false;
  resetNewSet();
  setFormContext.planId = planId;
  setFormContext.exerciseAssignmentId = exercise.assignmentId;
  setFormContext.exerciseType = (exercise.type || "").toString().toLowerCase();
  addSetDialog.value = true;
};

const createSetForExercise = async () => {
  if (
    !setFormContext.planId ||
    !setFormContext.exerciseAssignmentId ||
    exerciseMutationPending.value
  ) {
    return;
  }

  const payload = {
    completed: newSet.completed,
    goalWeight: newSet.goalWeight != null ? Number(newSet.goalWeight) : null,
    goalReps: newSet.goalReps != null ? Number(newSet.goalReps) : null,
    goalTime: newSet.goalTime != null ? Number(newSet.goalTime) : null,
    goalDist: newSet.goalDist != null ? Number(newSet.goalDist) : null,
    actualWeight: newSet.actualWeight != null ? Number(newSet.actualWeight) : null,
    actualReps: newSet.actualReps != null ? Number(newSet.actualReps) : null,
    actualTime: newSet.actualTime != null ? Number(newSet.actualTime) : null,
    actualDist: newSet.actualDist != null ? Number(newSet.actualDist) : null,
    distUnits: newSet.distUnits || null,
    exerciseId: setFormContext.exerciseAssignmentId,
  };

  try {
    exerciseMutationError.value = null;
    exerciseMutationPending.value = true;
    const response = await apiClient.post("set", payload);
    const created = mapSetToPlanSet(response.data);
    const plan = plans.value.find((p) => p.id === setFormContext.planId);
    const targetExercise = plan?.exercises.find(
      (e) => e.assignmentId === setFormContext.exerciseAssignmentId
    );
    if (targetExercise) {
      if (!Array.isArray(targetExercise.sets)) {
        targetExercise.sets = [];
      }
      targetExercise.sets.push(created);
    }
    addSetDialog.value = false;
    resetNewSet();
  } catch (error) {
    console.error("Failed to create set", error);
    exerciseMutationError.value =
      error?.response?.data?.message ||
      "Unable to create the set. Please check the values and try again.";
  } finally {
    exerciseMutationPending.value = false;
  }
};

const deleteSetFromExercise = async (planId, exercise, setId) => {
  if (!setId || exerciseMutationPending.value) {
    return;
  }
  try {
    exerciseMutationError.value = null;
    exerciseMutationPending.value = true;
    await apiClient.delete(`set/${setId}`);
    const plan = plans.value.find((p) => p.id === planId);
    const targetExercise = plan?.exercises.find(
      (e) => e.assignmentId === exercise.assignmentId
    );
    if (targetExercise && Array.isArray(targetExercise.sets)) {
      targetExercise.sets = targetExercise.sets.filter((set) => set.id !== setId);
    }
  } catch (error) {
    console.error(`Failed to delete set ${setId}`, error);
    exerciseMutationError.value =
      error?.response?.data?.message ||
      "Unable to delete the set. Please try again.";
  } finally {
    exerciseMutationPending.value = false;
  }
};

const createInlineExercise = async () => {
  if (!inlineExercise.name.trim() || exerciseMutationPending.value) {
    return;
  }

  const normalized = normalizeTemplateFields(inlineExercise);
  const payload = toTemplatePayload(normalized);

  try {
    exerciseMutationError.value = null;
    exerciseMutationPending.value = true;
    const response = await apiClient.post("exerciseTemplate", payload);
    const createdExercise = mapTemplateToExercise(response.data);
    availableExercises.value.push(createdExercise);
    setTemplateLookup();
    toggleInlineExerciseForm();
    selectedExerciseIds.value = Array.from(
      new Set([...selectedExerciseIds.value, createdExercise.id])
    );
  } catch (error) {
    console.error("Failed to create exercise template", error);
    exerciseMutationError.value =
      error?.response?.data?.message ||
      "Unable to save the exercise. Please check the details and try again.";
  } finally {
    exerciseMutationPending.value = false;
  }
};

const sortedExercises = computed(() => {
  const term = exerciseSearch.value.trim().toLowerCase();
  const focus = exerciseFocusFilter.value !== "all" ? exerciseFocusFilter.value : null;

  return availableExercises.value.filter((exercise) => {
    const name = exercise.name.toLowerCase();
    const type = exercise.type.toLowerCase();
    const muscle = (exercise.muscleGroup || "").toLowerCase();
    const notes = (exercise.notes || "").toLowerCase();

    const matchesSearch =
      !term ||
      name.includes(term) ||
      type.includes(term) ||
      muscle.includes(term) ||
      notes.includes(term);

    if (!matchesSearch) {
      return false;
    }

    if (focus && muscle !== focus) {
      return false;
    }

    return true;
  });
});

const addExercisesToPlan = async () => {
  const plan = selectedPlan.value;
  if (!plan || !selectedExerciseIds.value.length || exerciseMutationPending.value) {
    return;
  }

  try {
    exerciseMutationError.value = null;
    exerciseMutationPending.value = true;
    const payload = selectedExerciseIds.value.map((templateId) => ({
      workoutId: plan.id,
      exerciseTemplateId: templateId,
      notes: "",
      restTimer: DEFAULT_REST_TIMER,
    }));

    const response = await apiClient.post(`exercise/workout/${plan.id}`, payload);
    const createdExercises = Array.isArray(response.data) ? response.data : [];

    createdExercises.forEach((assignment) => {
      plan.exercises.push(mapAssignmentToPlanExercise(assignment));
    });

    addExerciseDialog.value = false;
  } catch (error) {
    console.error("Failed to add exercises to plan", error);
    exerciseMutationError.value =
      error?.response?.data?.message ||
      "Unable to add the selected exercises. Please try again.";
  } finally {
    exerciseMutationPending.value = false;
  }
};

const removeExerciseFromPlan = async (assignmentId) => {
  if (!assignmentId || exerciseMutationPending.value) {
    return;
  }

  try {
    exerciseMutationError.value = null;
    exerciseMutationPending.value = true;
    await apiClient.delete(`exercise/${assignmentId}`);
    plans.value.forEach((plan) => {
      plan.exercises = plan.exercises.filter(
        (exercise) => exercise.assignmentId !== assignmentId
      );
    });
  } catch (error) {
    console.error("Failed to remove exercise", error);
    exerciseMutationError.value =
      error?.response?.data?.message ||
      "Unable to remove the exercise. Please try again.";
  } finally {
    exerciseMutationPending.value = false;
  }
};

const resetEditExercise = () => {
  editExercise.templateId = null;
  editExercise.assignmentId = null;
  editExercise.source = "library";
  editExercise.planId = null;
  editExercise.name = "";
  editExercise.type = "";
  editExercise.muscleGroup = "";
  editExercise.restTimer = DEFAULT_REST_TIMER;
  editExercise.notes = "";
};

const openLibraryExerciseEditor = (exercise) => {
  exerciseMutationError.value = null;
  exerciseMutationPending.value = false;
  editExercise.templateId = exercise.id;
  editExercise.assignmentId = null;
  editExercise.source = "library";
  editExercise.planId = null;
  editExercise.name = exercise.name ?? "";
  editExercise.type = exercise.type ?? "";
  editExercise.muscleGroup = exercise.muscleGroup ?? "";
  editExercise.restTimer = DEFAULT_REST_TIMER;
  editExercise.notes = "";
  editExerciseDialog.value = true;
};

const openPlanExerciseEditor = (planId, exercise) => {
  exerciseMutationError.value = null;
  exerciseMutationPending.value = false;
  editExercise.templateId = exercise.templateId;
  editExercise.assignmentId = exercise.assignmentId;
  editExercise.source = "plan";
  editExercise.planId = planId;
  editExercise.name = exercise.name ?? "";
  editExercise.type = exercise.type ?? "";
  editExercise.muscleGroup = exercise.muscleGroup ?? "";
  editExercise.restTimer = exercise.restTimer ?? DEFAULT_REST_TIMER;
  editExercise.notes = exercise.notes ?? "";
  editExerciseDialog.value = true;
};

const updatePlanExercisesFromTemplate = (template) => {
  plans.value.forEach((plan) => {
    plan.exercises.forEach((exercise) => {
      if (exercise.templateId === template.id) {
        exercise.name = template.name;
        exercise.type = template.type;
        exercise.muscleGroup = template.muscleGroup;
      }
    });
  });
};

const normalizeAssignmentFields = (exercise) => {
  const restValue = Number(exercise.restTimer);
  return {
    restTimer: Number.isFinite(restValue) ? restValue : 0,
    notes: exercise.notes?.trim() ?? "",
  };
};

const applyAssignmentUpdates = (assignmentId, updates) => {
  plans.value.forEach((plan) => {
    const target = plan.exercises.find((exercise) => exercise.assignmentId === assignmentId);
    if (target) {
      Object.assign(target, updates);
    }
  });
};

const updateExercise = async () => {
  if (!editExercise.templateId || exerciseMutationPending.value) {
    return;
  }

  if (editExercise.source === "library") {
    const normalized = normalizeTemplateFields(editExercise);
    const payload = toTemplatePayload(normalized);
    try {
      exerciseMutationError.value = null;
      exerciseMutationPending.value = true;
      const response = await apiClient.put(
        `exerciseTemplate/${editExercise.templateId}`,
        payload
      );
      const updated = mapTemplateToExercise(response.data);
      const index = availableExercises.value.findIndex((item) => item.id === updated.id);
      if (index === -1) {
        availableExercises.value.push(updated);
      } else {
        availableExercises.value[index] = updated;
      }
      setTemplateLookup();
      updatePlanExercisesFromTemplate(updated);
      editExerciseDialog.value = false;
      resetEditExercise();
    } catch (error) {
      console.error(`Failed to update exercise template ${editExercise.templateId}`, error);
      exerciseMutationError.value =
        error?.response?.data?.message ||
        "Unable to update the exercise. Please adjust the values and try again.";
    } finally {
      exerciseMutationPending.value = false;
    }
    return;
  }

  if (!editExercise.assignmentId) {
    return;
  }

  const updates = normalizeAssignmentFields(editExercise);
  try {
    exerciseMutationError.value = null;
    exerciseMutationPending.value = true;
    await apiClient.put(`exercise/${editExercise.assignmentId}` , updates);
    applyAssignmentUpdates(editExercise.assignmentId, {
      restTimer: updates.restTimer,
      notes: updates.notes,
    });
    editExerciseDialog.value = false;
    resetEditExercise();
  } catch (error) {
    console.error(`Failed to update exercise ${editExercise.assignmentId}`, error);
    exerciseMutationError.value =
      error?.response?.data?.message ||
      "Unable to update the exercise. Please adjust the values and try again.";
  } finally {
    exerciseMutationPending.value = false;
  }
};

const deleteAvailableExercise = async (exerciseId) => {
  if (exerciseMutationPending.value) {
    return;
  }
  const assignmentIds = collectAssignmentIdsByTemplate(exerciseId);
  try {
    exerciseMutationError.value = null;
    exerciseMutationPending.value = true;
    for (const assignmentId of assignmentIds) {
      await apiClient.delete(`exercise/${assignmentId}`);
    }
    await apiClient.delete(`exerciseTemplate/${exerciseId}`);
    availableExercises.value = availableExercises.value.filter((exercise) => exercise.id !== exerciseId);
    setTemplateLookup();
    removePlanExercisesByTemplate(exerciseId);
    selectedExerciseIds.value = selectedExerciseIds.value.filter((id) => id !== exerciseId);
    if (
      editExerciseDialog.value &&
      editExercise.templateId === exerciseId &&
      editExercise.source === "library"
    ) {
      editExerciseDialog.value = false;
      resetEditExercise();
    }
  } catch (error) {
    console.error(`Failed to delete exercise template ${exerciseId}`, error);
    exerciseMutationError.value =
      error?.response?.data?.message ||
      "Unable to delete the exercise. Remove it from the plans and try again.";
  } finally {
    exerciseMutationPending.value = false;
  }
};

const confirmAvailableExerciseDeletion = (exercise) => {
  if (!exercise) return;
  const confirmation = window.confirm(
    `Delete exercise "${exercise.name}" from the library? This will remove it from any plans using it.`
  );
  if (confirmation) {
    deleteAvailableExercise(exercise.id);
  }
};

const resetNewPlan = () => {
  newPlan.focusArea = "";
  newPlan.notes = "";
  newPlan.expectedDate = "";
  newPlan.date = "";
};

const resetEditPlan = () => {
  editPlan.id = null;
  editPlan.focusArea = "";
  editPlan.notes = "";
  editPlan.expectedDate = "";
  editPlan.date = "";
};

const openEditPlan = (plan) => {
  if (!plan) return;
  planMutationError.value = null;
  editPlan.id = plan.id;
  editPlan.focusArea = plan.focusArea ?? "";
  editPlan.notes = plan.notes ?? "";
  editPlan.expectedDate = plan.expectedDate ?? "";
  editPlan.date = plan.date ?? "";
  editPlanDialog.value = true;
};

const applyPlanUpdates = (plan, updates) => {
  plan.focusArea = updates.focusArea?.trim() ?? "";
  plan.notes = updates.notes?.trim() ?? "";
  plan.expectedDate = updates.expectedDate || "";
  plan.date = updates.date || "";
};

const buildPlanPayload = (plan) => {
  const ids = resolveUserContext();
  if (!Number.isFinite(ids.userId)) {
    return null;
  }
  return {
    userId: ids.userId,
    coachId: ids.coachId ?? ids.userId,
    expectedDate: plan.expectedDate || null,
    date: plan.date || null,
    focusArea: plan.focusArea?.trim() ?? "",
    notes: plan.notes?.trim() ?? "",
  };
};

const createPlan = async () => {
  if (!newPlan.focusArea.trim() || planMutationPending.value) {
    return;
  }

  const payload = buildPlanPayload(newPlan);
  if (!payload) {
    planMutationError.value = "A numeric user ID is required to create plans.";
    return;
  }

  try {
    planMutationError.value = null;
    planMutationPending.value = true;
    const response = await apiClient.post("workout", payload);
    const createdPlan = mapWorkoutToPlan(response.data);
    plans.value.push(createdPlan);
    selectedPlanId.value = createdPlan.id;
    newPlanDialog.value = false;
    resetNewPlan();
  } catch (error) {
    console.error("Failed to create plan", error);
    planMutationError.value =
      error?.response?.data?.message || "Unable to create the plan. Please try again.";
  } finally {
    planMutationPending.value = false;
  }
};

const updatePlan = async () => {
  if (!editPlan.id || !editPlan.focusArea.trim() || planMutationPending.value) {
    return;
  }

  const plan = plans.value.find((item) => item.id === editPlan.id);
  if (!plan) {
    return;
  }

  const payload = buildPlanPayload(editPlan);
  if (!payload) {
    planMutationError.value = "A numeric user ID is required to update plans.";
    return;
  }

  try {
    planMutationError.value = null;
    planMutationPending.value = true;
    await apiClient.put(`workout/${editPlan.id}`, payload);
    applyPlanUpdates(plan, editPlan);
    ensureSelectedPlan();
    editPlanDialog.value = false;
    resetEditPlan();
  } catch (error) {
    console.error(`Failed to update plan ${editPlan.id}`, error);
    planMutationError.value =
      error?.response?.data?.message || "Unable to update the plan. Please try again.";
  } finally {
    planMutationPending.value = false;
  }
};

const deletePlan = async (planId) => {
  if (planMutationPending.value) {
    return;
  }

  const plan = plans.value.find((item) => item.id === planId);
  if (!plan) {
    return;
  }

  try {
    planMutationError.value = null;
    planMutationPending.value = true;
    if (plan.exercises.length) {
      await Promise.all(
        plan.exercises
          .filter((exercise) => exercise.assignmentId)
          .map((exercise) => apiClient.delete(`exercise/${exercise.assignmentId}`))
      );
    }
    await apiClient.delete(`workout/${planId}`);
    const index = plans.value.findIndex((item) => item.id === planId);
    if (index !== -1) {
      plans.value.splice(index, 1);
    }
    ensureSelectedPlan();
    if (editPlanDialog.value && editPlan.id === planId) {
      editPlanDialog.value = false;
      resetEditPlan();
    }
  } catch (error) {
    console.error(`Failed to delete plan ${planId}`, error);
    planMutationError.value =
      error?.response?.data?.message || "Unable to delete the plan. Please try again.";
  } finally {
    planMutationPending.value = false;
  }
};

const confirmPlanDeletion = (plan) => {
  if (!plan) return;
  const confirmation = window.confirm(
    `Delete workout #${plan.id}? This action cannot be undone.`
  );
  if (confirmation) {
    deletePlan(plan.id);
  }
};

watch(addExerciseDialog, (isOpen) => {
  if (!isOpen) {
    selectedExerciseIds.value = [];
    showInlineExerciseForm.value = false;
    resetInlineExercise();
    exerciseSearch.value = "";
    exerciseFocusFilter.value = "all";
    exerciseMutationError.value = null;
    exerciseMutationPending.value = false;
  }
});

watch(editExerciseDialog, (isOpen) => {
  if (!isOpen) {
    resetEditExercise();
    exerciseMutationError.value = null;
    exerciseMutationPending.value = false;
  }
});
</script>

<template>
  <v-container fluid class="pa-6">
    <v-row align="stretch" justify="center" no-gutters>
      <v-col cols="12" lg="3" class="pr-lg-4">
        <v-card class="h-100 d-flex flex-column">
          <v-card-title class="d-flex align-center justify-space-between flex-wrap gap-2">
            <span class="text-h6 text-sm-h5">Exercise Plans</span>
            <v-btn
              variant="tonal"
              color="primary"
              size="small"
              prepend-icon="mdi-plus"
              class="text-none"
              @click="newPlanDialog = true"
            >
              Create Plan
            </v-btn>
          </v-card-title>

          <v-divider />

          <v-card-text class="flex-grow-1 overflow-y-auto pr-2">
            <v-alert
              v-if="planLoadError"
              type="error"
              variant="tonal"
              class="mb-4"
            >
              {{ planLoadError }}
            </v-alert>
            <div v-else-if="plansLoading" class="d-flex justify-center py-6">
              <v-progress-circular indeterminate color="primary" />
            </div>
            <template v-else>
              <v-list v-if="plans.length" density="compact" nav>
                <v-list-item
                  v-for="plan in plans"
                  :key="plan.id"
                  :active="selectedPlanId === plan.id"
                  rounded
                  class="mb-2"
                  @click="selectedPlanId = plan.id"
                >
                  <v-list-item-title class="font-weight-medium">
                    {{ plan.focusArea }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ plan.notes || "No notes yet" }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
              <v-alert
                v-else
                type="info"
                variant="tonal"
                density="comfortable"
              >
                No workouts yet. Create one to get started.
              </v-alert>
            </template>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6" class="px-lg-4 mt-6 mt-lg-0">
        <v-card class="h-100">
          <template v-if="plansLoading">
            <v-card-text class="text-center py-12">
              <v-progress-circular indeterminate color="primary" />
              <p class="text-body-2 mt-4">Loading plans...</p>
            </v-card-text>
          </template>
          <template v-else-if="selectedPlan">
            <v-card-title class="d-flex flex-wrap align-start">
              <div class="flex-grow-1 d-flex flex-column pr-4">
                <span class="text-h5">{{ selectedPlan.focusArea }}</span>
              </div>
              <div class="d-flex align-center mt-3 mt-sm-0">
                <v-btn
                  variant="tonal"
                  color="primary"
                  size="small"
                  class="mr-2"
                  prepend-icon="mdi-pencil"
                  :disabled="planMutationPending"
                  @click="openEditPlan(selectedPlan)"
                >
                  Edit
                </v-btn>
                <v-btn
                  variant="text"
                  color="error"
                  size="small"
                  prepend-icon="mdi-delete"
                  :disabled="planMutationPending"
                  @click="confirmPlanDeletion(selectedPlan)"
                >
                  Delete
                </v-btn>
              </div>
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-alert
                v-if="planMutationError"
                type="error"
                variant="tonal"
                class="mb-4"
              >
                {{ planMutationError }}
              </v-alert>
              <v-row>
                <v-col cols="12" md="6">
                  <p class="text-body-2 mb-2">
                    <strong>Expected Date:</strong> {{ formatDateLabel(selectedPlan.expectedDate) }}
                  </p>
                </v-col>
                <v-col cols="12" md="6">
                  <v-alert
                    v-if="selectedPlan.notes"
                    border="start"
                    color="primary"
                    variant="tonal"
                    density="comfortable"
                  >
                    {{ selectedPlan.notes }}
                  </v-alert>
                  <v-alert
                    v-else
                    variant="tonal"
                    type="info"
                    density="comfortable"
                  >
                    No notes have been added for this workout.
                  </v-alert>
                </v-col>
              </v-row>

              <v-divider class="my-4" />

              <div>
                <div class="d-flex align-center justify-space-between mb-4 flex-wrap">
                  <h3 class="text-subtitle-1 font-weight-medium mb-0">Plan Exercises</h3>
                  <v-btn
                    color="primary"
                    variant="tonal"
                    size="small"
                    prepend-icon="mdi-plus"
                    :disabled="exerciseMutationPending"
                    @click="addExerciseDialog = true"
                  >
                    Add Exercises
                  </v-btn>
                </div>
                <v-alert
                  v-if="exerciseMutationError && !addExerciseDialog && !editExerciseDialog"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                >
                  {{ exerciseMutationError }}
                </v-alert>
                <v-alert v-if="!selectedPlan.exercises.length" variant="tonal" type="info">
                  No exercises have been added yet. Use the Add Exercises button to include one.
                </v-alert>

                <v-expansion-panels v-else>
                  <v-expansion-panel
                    v-for="exercise in selectedPlan.exercises"
                    :key="exercise.assignmentId || exercise.templateId"
                  >
                    <v-expansion-panel-title>
                      <div class="d-flex flex-column">
                        <span class="font-weight-medium">{{ exercise.name }}</span>
                        <span class="text-body-2 text-medium-emphasis">
                          {{ exercise.type }} • {{ exercise.muscleGroup || "General" }}
                        </span>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-row>
                        <v-col cols="12" md="8">
                          <p class="text-body-2 mb-2">{{ exercise.notes || "No notes" }}</p>
                        </v-col>
                        <v-col cols="12" md="4" class="d-flex flex-column align-start">
                          <v-chip color="secondary" variant="elevated" class="mb-2">
                            Rest: {{ exercise.restTimer }}s
                          </v-chip>
                          <v-btn
                            color="primary"
                            variant="text"
                            class="mb-2"
                            :disabled="exerciseMutationPending"
                            @click="openPlanExerciseEditor(selectedPlan.id, exercise)"
                          >
                            Edit
                          </v-btn>
                          <v-btn
                            color="error"
                            variant="text"
                            :disabled="exerciseMutationPending"
                            @click="removeExerciseFromPlan(exercise.assignmentId)"
                          >
                            Remove
                          </v-btn>
                        </v-col>
                      </v-row>
                      <v-row class="mt-4">
                        <v-col cols="12">
                          <div class="d-flex justify-space-between align-center mb-2">
                            <h4 class="text-subtitle-2 font-weight-medium mb-0">Sets</h4>
                            <v-btn
                              variant="text"
                              size="small"
                              color="primary"
                              :disabled="exerciseMutationPending"
                              @click.stop="openAddSetDialog(selectedPlan.id, exercise)"
                            >
                              Add Set
                            </v-btn>
                          </div>

                          <v-alert
                            v-if="!exercise.sets || !exercise.sets.length"
                            type="info"
                            variant="tonal"
                            density="comfortable"
                            class="mb-2"
                          >
                            No sets defined for this exercise.
                          </v-alert>

                          <v-table
                            v-else
                            density="compact"
                            class="text-body-2"
                          >
                            <thead>
                              <tr>
                                <th class="text-left">#</th>
                                <th class="text-left">Goal</th>
                                <th class="text-left">Actual</th>
                                <th class="text-left">Units</th>
                                <th class="text-left">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(set, idx) in exercise.sets" :key="set.id ?? idx">
                                <td>{{ idx + 1 }}</td>
                                <td>
                                  <span v-if="exercise.type.toLowerCase() === 'strength'">
                                    {{ set.goalWeight ?? "-" }} lbs × {{ set.goalReps ?? "-" }} reps
                                  </span>
                                  <span v-else-if="exercise.type.toLowerCase() === 'cardio'">
                                    {{ set.goalDist ?? "-" }} {{ set.distUnits || "" }} in
                                    {{ set.goalTime ?? "-" }} s
                                  </span>
                                  <span v-else>
                                    {{ set.goalReps ?? set.goalTime ?? "-" }}
                                  </span>
                                </td>
                                <td>
                                  <span v-if="exercise.type.toLowerCase() === 'strength'">
                                    {{ set.actualWeight ?? "-" }} lbs × {{ set.actualReps ?? "-" }} reps
                                  </span>
                                  <span v-else-if="exercise.type.toLowerCase() === 'cardio'">
                                    {{ set.actualDist ?? "-" }} {{ set.distUnits || "" }} in
                                    {{ set.actualTime ?? "-" }} s
                                  </span>
                                  <span v-else>
                                    {{ set.actualReps ?? set.actualTime ?? "-" }}
                                  </span>
                                </td>
                                <td>{{ set.distUnits || "-" }}</td>
                                <td>
                                  <v-btn
                                    icon
                                    variant="text"
                                    color="error"
                                    size="small"
                                    :disabled="exerciseMutationPending"
                                    @click.stop="deleteSetFromExercise(selectedPlan.id, exercise, set.id)"
                                  >
                                    <v-icon size="18">mdi-delete</v-icon>
                                  </v-btn>
                                </td>
                              </tr>
                            </tbody>
                          </v-table>
                        </v-col>
                      </v-row>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </v-card-text>
          </template>
          <template v-else>
            <v-card-text class="text-center py-12">
              <v-icon size="56" class="mb-3" color="primary">mdi-view-dashboard-outline</v-icon>
              <p class="text-body-1">Create a plan to get started, or select one from the sidebar.</p>
              <v-btn color="primary" class="mt-4" @click="newPlanDialog = true">
                New Plan
              </v-btn>
            </v-card-text>
          </template>
        </v-card>
      </v-col>

      <v-col cols="12" lg="3" class="pl-lg-4 mt-6 mt-lg-0">
      </v-col>
    </v-row>

    <v-dialog v-model="addExerciseDialog" max-width="560">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Select Exercises</span>
          <v-btn
            size="small"
            variant="text"
            color="primary"
            :prepend-icon="showInlineExerciseForm ? 'mdi-close-circle-outline' : 'mdi-plus'"
            @click="toggleInlineExerciseForm"
          >
            {{ showInlineExerciseForm ? "Close Form" : "New Exercise" }}
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-expand-transition>
            <div v-if="showInlineExerciseForm" class="mb-4">
              <v-form @submit.prevent="createInlineExercise" class="d-flex flex-column">
                <v-text-field
                  v-model="inlineExercise.name"
                  label="Exercise name"
                  prepend-inner-icon="mdi-dumbbell"
                  density="comfortable"
                  required
                  class="mb-3"
                />
                <v-select
                  v-model="inlineExercise.type"
                  :items="['Strength', 'Cardio', 'Mobility', 'Other']"
                  label="Type"
                  prepend-inner-icon="mdi-format-list-bulleted"
                  density="comfortable"
                  class="mb-3"
                />
                <v-text-field
                  v-model="inlineExercise.muscleGroup"
                  label="Muscle group"
                  prepend-inner-icon="mdi-dna"
                  density="comfortable"
                  class="mb-3"
                />
                <div class="d-flex justify-end mt-2">
                  <v-btn variant="text" @click="toggleInlineExerciseForm">
                    Cancel
                  </v-btn>
                  <v-btn
                    type="submit"
                    color="primary"
                    prepend-icon="mdi-content-save"
                    :loading="exerciseMutationPending"
                    :disabled="exerciseMutationPending"
                  >
                    Create Exercise
                  </v-btn>
                </div>
              </v-form>
            </div>
          </v-expand-transition>
          <v-row class="mb-3" dense>
            <v-col cols="12" md="8">
              <v-text-field
                v-model="exerciseSearch"
                label="Search exercises"
                prepend-inner-icon="mdi-magnify"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model="exerciseFocusFilter"
                :items="exerciseFocusOptions"
                item-title="label"
                item-value="value"
                label="Focus filter"
                prepend-inner-icon="mdi-dna"
                density="comfortable"
              />
            </v-col>
          </v-row>
          <v-alert
            v-if="exerciseLoadError"
            type="error"
            variant="tonal"
            density="comfortable"
            class="mb-4"
          >
            {{ exerciseLoadError }}
          </v-alert>
          <div v-else-if="exercisesLoading" class="d-flex justify-center py-6">
            <v-progress-circular indeterminate color="primary" />
          </div>
          <v-list
            v-else-if="sortedExercises.length"
            density="comfortable"
            lines="two"
            style="max-height: 360px; overflow-y: auto;"
          >
            <v-item-group v-model="selectedExerciseIds" multiple>
              <template v-for="exercise in sortedExercises" :key="exercise.id">
                <v-item :value="exercise.id" v-slot="{ isSelected, toggle }">
                  <v-list-item @click="toggle" class="rounded-lg">
                    <template #prepend>
                      <v-checkbox
                        :model-value="isSelected"
                        density="compact"
                        hide-details
                        @click.stop="toggle"
                      />
                    </template>
                    <v-list-item-title>{{ exercise.name }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ exercise.type }} &bull; {{ exercise.muscleGroup || "General" }}
                    </v-list-item-subtitle>
                    <template #append>
                      <div class="d-flex align-center">
                        <v-btn
                          icon
                          variant="text"
                          color="primary"
                          size="small"
                          @click.stop="openLibraryExerciseEditor(exercise)"
                        >
                          <v-icon size="18">mdi-pencil</v-icon>
                        </v-btn>
                        <v-btn
                          icon
                          variant="text"
                          color="error"
                          size="small"
                          @click.stop="confirmAvailableExerciseDeletion(exercise)"
                        >
                          <v-icon size="18">mdi-delete</v-icon>
                        </v-btn>
                      </div>
                    </template>
                  </v-list-item>
                </v-item>
              </template>
            </v-item-group>
          </v-list>

          <v-alert v-else type="info" variant="tonal">
            No results found for this muscle focus.
          </v-alert>

          <v-alert
            v-if="exerciseMutationError"
            type="error"
            variant="tonal"
            density="comfortable"
            class="mt-4"
          >
            {{ exerciseMutationError }}
          </v-alert>

        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="addExerciseDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :disabled="!selectedExerciseIds.length || exerciseMutationPending"
            :loading="exerciseMutationPending"
            @click="addExercisesToPlan"
          >
            Add to Plan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editExerciseDialog" max-width="520">
      <v-card>
        <v-card-title>Edit Exercise</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="updateExercise">
            <v-alert
              v-if="editExercise.source === 'library'"
              type="info"
              variant="tonal"
              class="mb-4"
            >
              Updating this exercise will also update any plans using it.
            </v-alert>
            <v-alert
              v-else
              type="info"
              variant="tonal"
              class="mb-4"
            >
              Template fields are locked here. Adjust the rest timer or notes for this plan.
            </v-alert>
            <v-alert
              v-if="exerciseMutationError"
              type="error"
              variant="tonal"
              class="mb-4"
            >
              {{ exerciseMutationError }}
            </v-alert>
            <v-text-field
              v-model="editExercise.name"
              label="Exercise name"
              prepend-inner-icon="mdi-dumbbell"
              :disabled="editExercise.source === 'plan'"
              required
            />
            <v-select
              v-model="editExercise.type"
              :items="['Strength', 'Cardio', 'Mobility', 'Other']"
              label="Type"
              prepend-inner-icon="mdi-format-list-bulleted"
              :disabled="editExercise.source === 'plan'"
            />
            <v-text-field
              v-model="editExercise.muscleGroup"
              label="Muscle group"
              prepend-inner-icon="mdi-dna"
              :disabled="editExercise.source === 'plan'"
            />
            <v-text-field
              v-if="editExercise.source === 'plan'"
              v-model="editExercise.restTimer"
              label="Rest timer (seconds)"
              type="number"
              min="0"
              prepend-inner-icon="mdi-timer-outline"
              density="comfortable"
              class="mt-3"
            />
            <v-textarea
              v-if="editExercise.source === 'plan'"
              v-model="editExercise.notes"
              label="Notes"
              rows="3"
              auto-grow
              prepend-inner-icon="mdi-note-text"
              density="comfortable"
              class="mt-3"
            />
            <v-card-actions class="mt-2">
              <v-spacer />
              <v-btn variant="text" @click="editExerciseDialog = false">
                Cancel
              </v-btn>
              <v-btn
                type="submit"
                color="primary"
                :disabled="!editExercise.name || exerciseMutationPending"
                :loading="exerciseMutationPending"
              >
                Save
              </v-btn>
            </v-card-actions>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="addSetDialog" max-width="480">
      <v-card>
        <v-card-title>Add Set</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="createSetForExercise">
            <v-alert
              v-if="exerciseMutationError && addSetDialog"
              type="error"
              variant="tonal"
              class="mb-4"
            >
              {{ exerciseMutationError }}
            </v-alert>
            <v-text-field
              v-model="newSet.goalWeight"
              label="Goal weight (lbs)"
              type="number"
              prepend-inner-icon="mdi-weight-lifter"
              density="comfortable"
            />
            <v-text-field
              v-model="newSet.goalReps"
              label="Goal reps"
              type="number"
              prepend-inner-icon="mdi-counter"
              density="comfortable"
            />
            <v-text-field
              v-model="newSet.goalDist"
              label="Goal distance"
              type="number"
              prepend-inner-icon="mdi-ruler"
              density="comfortable"
            />
            <v-text-field
              v-model="newSet.goalTime"
              label="Goal time (seconds)"
              type="number"
              prepend-inner-icon="mdi-timer-outline"
              density="comfortable"
            />
            <v-text-field
              v-model="newSet.distUnits"
              label="Distance units (mi, m, km, feet, laps)"
              prepend-inner-icon="mdi-ruler-square"
              density="comfortable"
            />
            <v-card-actions class="mt-2">
              <v-spacer />
              <v-btn variant="text" @click="addSetDialog = false">
                Cancel
              </v-btn>
              <v-btn
                type="submit"
                color="primary"
                :disabled="exerciseMutationPending"
                :loading="exerciseMutationPending"
              >
                Save
              </v-btn>
            </v-card-actions>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="newPlanDialog" max-width="520">
      <v-card>
        <v-card-title>Create New Plan</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="createPlan">
            <v-alert
              v-if="planMutationError && newPlanDialog"
              type="error"
              variant="tonal"
              class="mb-4"
            >
              {{ planMutationError }}
            </v-alert>
            <v-text-field
              v-model="newPlan.focusArea"
              label="Focus area"
              prepend-inner-icon="mdi-crosshairs-gps"
              required
            />
            <v-textarea
              v-model="newPlan.notes"
              label="Notes"
              rows="3"
              auto-grow
              prepend-inner-icon="mdi-note-outline"
            />
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newPlan.expectedDate"
                  label="Expected date"
                  type="date"
                  prepend-inner-icon="mdi-calendar-clock"
                />
              </v-col>
            </v-row>
            <v-card-actions class="mt-2">
              <v-spacer />
              <v-btn variant="text" @click="newPlanDialog = false">Cancel</v-btn>
              <v-btn
                type="submit"
                color="primary"
                :disabled="planMutationPending"
                :loading="planMutationPending"
              >
                Create
              </v-btn>
            </v-card-actions>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editPlanDialog" max-width="520">
      <v-card>
        <v-card-title>Edit Plan</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="updatePlan">
            <v-alert
              v-if="planMutationError && editPlanDialog"
              type="error"
              variant="tonal"
              class="mb-4"
            >
              {{ planMutationError }}
            </v-alert>
            <v-text-field
              v-model="editPlan.focusArea"
              label="Focus area"
              prepend-inner-icon="mdi-crosshairs-gps"
              required
            />
            <v-textarea
              v-model="editPlan.notes"
              label="Notes"
              rows="3"
              auto-grow
              prepend-inner-icon="mdi-note-outline"
            />
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editPlan.expectedDate"
                  label="Expected date"
                  type="date"
                  prepend-inner-icon="mdi-calendar-clock"
                />
              </v-col>

            </v-row>
            <v-card-actions class="mt-2">
              <v-spacer />
              <v-btn variant="text" @click="editPlanDialog = false; resetEditPlan();">
                Cancel
              </v-btn>
              <v-btn
                type="submit"
                color="primary"
                :disabled="!editPlan.focusArea || planMutationPending"
                :loading="planMutationPending"
              >
                Save
              </v-btn>
            </v-card-actions>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.h-100 {
  height: 100%;
}

.overflow-y-auto {
  overflow-y: auto;
}
</style>
