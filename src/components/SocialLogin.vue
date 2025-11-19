<script setup>
import { ref, onMounted } from "vue";
import AuthServices from "../services/authServices";
import Utils from "../config/utils.js";
import { useRouter } from "vue-router";

const router = useRouter();
const fName = ref("");
const lName = ref("");
const role = ref("");
const user = ref({});

const loginWithGoogle = () => {
  window.handleCredentialResponse = handleCredentialResponse;
  const client = import.meta.env.VITE_APP_CLIENT_ID;
  console.log(client);
  window.google.accounts.id.initialize({
    client_id: client,
    cancel_on_tap_outside: false,
    auto_select: true,
    callback: window.handleCredentialResponse,
  });
  window.google.accounts.id.renderButton(document.getElementById("parent_id"), {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "signup_with",
    width: 400,
  });
};

const handleCredentialResponse = async (response) => {
  let token = {
    credential: response.credential,
  };
  await AuthServices.loginUser(token)
    .then((response) => {
      user.value = response.data;
      Utils.setStore("user", user.value);
      fName.value = user.value.firstName;
      lName.value = user.value.lastName;
      role.value = user.value.role
      if (role.value == "user"){ 
        router.push({ name: "athlete-homepage"})
      }
      else{
        router.push({ name: "dashboard" });
      }
    })
    .catch((error) => {
      console.log("error", error);
    });
};

onMounted(async () => {
  let user = Utils.getStore("user");
  console.log(user);
  if (user) {
    try {
      let response = await AuthServices.authenticateSession(user);
      console.log(response);
      if (response.status == 200) {
        if (user.role == "user") {
          router.push({ name: "athlete-homepage" })
        }
        else {
          router.push({ name: "dashboard" });
        }
      }
    }
    catch(err){
      console.log("error", err);
    }
  }
  loginWithGoogle();
  
});
</script>

<template>
  <div class="signup-buttons">
    <v-row justify="center">
      <div display="flex" id="parent_id"></div>
    </v-row>
  </div>
</template>
