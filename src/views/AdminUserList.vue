<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import apiClient from "../services/services";

const users = ref([]);
const totalUsers = ref(0);
const search = ref('');


const selectedUser = ref(null);
const headers = ref([
  {title: "id", align: "start", sortable: true, key:"id"},
  {title: "email", align: "end", sortable: true, key:"email"},
  {title: "First Name", align: "end", sortable: true, key:"firstName"},
  {title: "Last Name", align: "end", sortable: true, key:"lastName"},
  {title: "Role", align: "end", sortable: true, key:"role"},
  {title: "Save Role Change", align:"start", key:"save"}
])

const loadUsers = async () => {
  const response = await apiClient.get("users");
  const data = response.data;
  if (Array.isArray(data)) {
    users.value = data.map(
      (template) =>  {return {id: template.id, firstName: template.first_name, lastName: template.last_name, email: template.email, role: template.role} });
  } else {
    users.value = [];
  }
  totalUsers.value = users.length
};

onMounted(() => {
  loadUsers();
});

const saveRole = (user) =>{
  let userValues = user.columns;
  let id = userValues.id;
  let role = userValues.role;
  let body = {};
  body.role = role;
  apiClient.put(`users/${id}/role`, body);
}

</script>

<template>
  <v-container>
    <v-container class="user-table-title">
      <v-text-field
          v-model="search"
          label="Search"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          flat
          hide-details
          single-line
        ></v-text-field>
    </v-container>
    <v-divider></v-divider>
    <v-data-table
      v-model:search="search"
      :headers="headers"
      :filter-keys="['firstName', 'lastName', 'email']"
      :items="users"
    >
      <template v-slot:item.role="{ item }"> 
        <v-container class="combobox-holder"> 
          <v-combobox
            v-model="item.raw.role"
            :items="['user', 'coach', 'admin']"
            variant="outlined"
            density="compact"
          ></v-combobox>
        </v-container>  
      </template>
      <template v-slot:item.save="{ item }"> 
        <v-container class="save-holder"> 
          <v-btn class="save-btn" @click="saveRole(item)">Save</v-btn>
        </v-container>  
      </template>
    </v-data-table>

  </v-container>
</template>

<style scoped>
.h-100 {
  height: 100%;
}

.save-btn{
  background-color: #1A2D10;
  color: #58f707
}
.combobox-holder{
  max-width: 200px;
  padding-right:0px;
  margin-right:0px;
  margin-top:15px
}
.save-holder{
  max-width: 150px;
  padding-left:0px;
  margin-left:0px;
  margin-bottom:5px;
}
.overflow-y-auto {
  overflow-y: auto;
}
</style>
