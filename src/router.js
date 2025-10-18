import { createRouter, createWebHistory } from "vue-router";

import Login from "./views/Login.vue";

import Dashboard from "./views/Dashboard.vue";
import Utils from "./config/utils";

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
