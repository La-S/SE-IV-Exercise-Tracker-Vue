import { createRouter, createWebHistory } from "vue-router";

import Login from "./views/Login.vue";

import Dashboard from "./views/Dashboard.vue";
import ExercisePlans from "./views/ExercisePlans.vue";
import Utils from "./config/utils";
import AthleteHomePage from "./views/AthleteHomePage.vue";
import CurrentWorkout from "./views/CurrentWorkout.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/dashboard",
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: Dashboard,
    },
    {
      path: "/exercise-plans",
      name: "exercise-plans",
      component: ExercisePlans,
    },
    {
      path: "/login",
      name: "login",
      component: Login,
    },
    {
      path: "/athlete-homepage",
      name: "athlete-homepage",
      component: AthleteHomePage,
    },
    {
      path: "/current-workout",
      name: "current-workout",
      component: CurrentWorkout,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/dashboard",
    },
  ],
});

router.beforeEach((to, from, next) => {
  const user = Utils.getStore("user");

  if (user && to.name === "login") {
    return next({ name: "dashboard" });
  }

  return next();
});

export default router;
