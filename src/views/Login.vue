<script setup>
import SocialLogin from "../components/SocialLogin.vue";
import LoginMenu from "../components/LoginMenu.vue"
</script>

<template>
  <LoginMenu />
  <v-container class="login-container">
    <SocialLogin />
  </v-container>
</template>


<style scoped>
.login-container{
  margin-top:56px; /* 56 is toolbar height*/
  max-width:90vw;
  margin-bottom:0;
  padding:0;
  overflow:hidden;
}
</style>