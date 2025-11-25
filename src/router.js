import { createMemoryHistory, createRouter, createWebHashHistory, createWebHistory } from "vue-router";

import Login from "./views/Login.vue";

import Dashboard from "./views/Dashboard.vue";
import ExercisePlans from "./views/ExercisePlans.vue";
import AdminUserList from "./views/AdminUserList.vue"
import AdminTeamList from "./views/AdminTeamList.vue"
import Utils from "./config/utils";
import Teams from "./views/Teams.vue";
import AthleteHomePage from "./views/AthleteHomePage.vue";
import CurrentWorkout from "./views/CurrentWorkout.vue";
import CoachLayout from "./layouts/CoachLayout.vue";
import AthleteLayout from "./layouts/AthleteLayout.vue";
import AthleteInfo from "./views/AthleteInfo.vue";
import AdminLayout from "./layouts/AdminLayout.vue";


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/login",
    },
    {
      path: "/admin",
      component: AdminLayout,
      children: [
        {
          path: "users",
          name: "userList",
          component: AdminUserList
        },
        {
          path: "teams",
          name: "teamList",
          component: AdminTeamList
        }
      ]
    },
    {
      path: "/coach",
      component: CoachLayout,
      children: [
        {
          path: "dashboard",
          name: "dashboard",
          component: Dashboard,
        },
        {
          path: "exercise-plans",
          name: "exercise-plans",
          component: ExercisePlans,
        },
        {
          path: "teams",
          name: "teams",
          component: Teams,
        },
        {
          path: "athlete-info/:id",
          name: "athlete-info",
          component: AthleteInfo,
        },
      ],
    },
    {
      path: "/athlete",
      component: AthleteLayout,
      children: [
        {
          path: "homepage",
          name: "athlete-homepage",
          component: AthleteHomePage,
        },
        {
          path: "current-workout",
          name: "current-workout",
          component: CurrentWorkout,
        },
      ],
    },
    {
      path: "/login",
      name: "login",
      component: Login,
    },
    {
      path: "/:pathMatch(.)",
      redirect: "/coach/dashboard",
    },
  ],
});

export default router;