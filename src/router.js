import { createMemoryHistory, createRouter } from "vue-router";

import Login from "./views/Login.vue";

import Dashboard from "./views/Dashboard.vue";
import ExercisePlans from "./views/ExercisePlans.vue";
import Utils from "./config/utils";
import Teams from "./views/Teams.vue";

const router = createRouter({
  history: createMemoryHistory(),
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
      path: "/teams",
      name: "teams",
      component: Teams,
    },
    {
      path: "/login",
      name: "login",
      component: Login,
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
