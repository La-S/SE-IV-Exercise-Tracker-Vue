<script setup>
import SocialLogin from "../components/SocialLogin.vue";
import LoginMenu from "../components/LoginMenu.vue"
</script>

<template>
  <v-container>
    <LoginMenu />
    <SocialLogin />
  </v-container>
</template>


<style scoped>
.v-container{
  min-width:unset;
  max-width:90vw;
  margin-bottom:0;
  padding-bottom:0;
  overflow:hidden;
}
</style>