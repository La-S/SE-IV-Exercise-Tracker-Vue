<script setup>
import ExerciseLogo from "../assets/exercise_icon.png";
import { ref, onMounted, computed } from "vue";
import Utils from "../config/utils";
import AuthServices from "../services/authServices";
import { useRouter, useRoute } from "vue-router";
import { useTheme } from "vuetify";

const router = useRouter();
const route = useRoute();
const theme = useTheme();

const user = ref(null);
const title = ref("Exercise Tracker");
const initials = ref("");
const name = ref("");
const logoURL = ref("");

const isCoachView = computed(() =>
  ["dashboard", "exercise-plans"].includes(route.name)
);

const resetMenu = () => {
  user.value = Utils.getStore("user") || {
    fName: "Guest",
    lName: "Coach",
    email: "test@coach.com"
  };

  const fName = user.value.fName ?? "";
  const lName = user.value.lName ?? "";
  const composedName = `${fName} ${lName}`.trim();
  initials.value =
    `${fName.charAt(0)}${lName.charAt(0)}` || "?";
  name.value = composedName || user.value.email || "User";
};


const logout = () => {
  AuthServices.logoutUser(user.value)
    .then(() => {
      Utils.removeItem("user");
      router.push({ name: "login" });
    })
    .catch((error) => console.log("error", error));
};

const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? "light" : "dark";
};

const navItems = [
  { label: "Dashboard", name: "dashboard" },
  { label: "Exercise Plans", name: "exercise-plans" },
];

onMounted(() => {
  logoURL.value = ExerciseLogo;
  resetMenu();
 
});
</script>