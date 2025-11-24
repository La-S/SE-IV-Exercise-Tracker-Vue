<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import apiClient from "../services/services";

const users = ref([]);
const totalUsers = ref(0);
const search = ref('');
const selectedUser = ref({
  id: '',
  firstName: '',
  lastName: ''
});
const dialog = ref(false)
const activator = ref(null)

const headers = ref([
  {title: "id", align: "start", sortable: true, key:"id"},
  {title: "email", align: "end", sortable: true, key:"email"},
  {title: "First Name", align: "end", sortable: true, key:"firstName"},
  {title: "Last Name", align: "end", sortable: true, key:"lastName"},
  {title: "Role", align: "end", sortable: true, key:"role"},
  {title: "Actions", align:"start", key:"actions"}
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

const saveRole = async (user) =>{
  let userValues = user.raw;
  let id = userValues.id;
  let role = userValues.role;
  let body = {};
  body.role = role;
  await apiClient.put(`users/${id}/role`, body);
}

const deleteUser = async () =>{
  let id = selectedUser.value.id;
  await apiClient.delete(`users/${id}`);
  loadUsers();
  dialog.value = false;
}

function updateSelectedUser(user){
  let userValues = user.raw;
  selectedUser.value.id = userValues.id;
  selectedUser.value.firstName = userValues.firstName;
  selectedUser.value.lastName = userValues.lastName;
  console.log(selectedUser);
  dialog.value = true;
}
const cancel = () => {
  dialog.value = false;
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
      <template v-slot:item.actions="{ item }"> 
        <v-row class="save-holder"> 
          <v-btn 
            color="primary" 
            variant="tonal"
            class="save-btn" 
            @click="saveRole(item)">
            Save</v-btn>
            <v-spacer></v-spacer>
          <v-btn 
            color="error" 
            variant="tonal"
            class="delete-btn" 
            @click="updateSelectedUser(item)">
            Delete</v-btn>
        </v-row>  
      </template>
    </v-data-table>

  </v-container>
  
  <v-dialog v-model="dialog" max-width="500">
    <v-card>
      <v-card-text>Are you sure you want to delete {{ selectedUser.firstName }} {{ selectedUser.lastName }}</v-card-text>
      <v-btn @click="deleteUser">Delete</v-btn>
      <v-btn @click="cancel">Cancel</v-btn>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.h-100 {
  height: 100%;
}

.spacer{
  width:5px;
}

.combobox-holder{
  max-width: 200px;
  min-width: 150px;
  padding-right:0px;
  margin-right:0px;
  margin-top:20px
}
.save-holder{
  padding-left:0px;
  margin-left:0px;
  min-width:175px;
  max-width:190px;
}
.overflow-y-auto {
  overflow-y: auto;
}
</style>
