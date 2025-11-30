export const muscleFocusOrder = [
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

export const cardioDistanceUnits = ["mi", "km", "m", "feet", "laps"];

export const formatLabel = (value) => {
  if (!value && value !== 0) return "";
  const label = String(value);
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().slice(0, 10);
};

export const formatDateLabel = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
};
