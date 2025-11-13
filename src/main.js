import { createApp } from "vue";
import App from "./App.vue";
import router from "./router.js";
import vuetify from "./plugins/vuetify.js";
import Utils from "./config/utils"; 

const ensureMockUser = () => {
  const existingUser = Utils.getStore("user");
  if (existingUser) {
    return;
  }

  const mockUser = {
    fName: "Guest",
    lName: "Coach",
    email: "guest@example.com",
  };

  Utils.setStore("user", mockUser);
};

ensureMockUser();

createApp(App).use(vuetify).use(router).mount("#app");
