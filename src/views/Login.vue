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
  min-height:100vh;
  max-width:90vw;
  margin-bottom:0;
  padding-bottom:0;
  padding-top:39px; /* this is the best way I could find to make it pad properly*/
  overflow:hidden;
  overflow-y: hidden;
}
</style>