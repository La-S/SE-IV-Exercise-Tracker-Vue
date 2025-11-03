import { createRouter, createWebHistory } from "vue-router";

import Login from "./views/Login.vue";

import Dashboard from "./views/Dashboard.vue";
import ExercisePlans from "./views/ExercisePlans.vue";
import Utils from "./config/utils";
import AthleteHomePage from "./views/AthleteHomePage.vue";

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
      name: "athelete-homepage",
      component: AthleteHomePage,
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
