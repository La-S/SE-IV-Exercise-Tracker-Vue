import apiClient from "./apiService";

export default {
  // 'users' endpoint
  async getAllUsers() {
    const response = await apiClient.get("users");
    if (response.status != 200){
      throw Error("status not 200.")
    }
    const data = response.data;
    let users: any = [];
    if (Array.isArray(data)) {
      users = data.map(
        (template) =>  {return {id: template.id, firstName: template.first_name, lastName: template.last_name, email: template.email, role: template.role} });
    }
    return users;
  },
  async getAllTeams() {
    const response = await apiClient.get("team");
    const data = response.data;
    let teams: any = [];
    if (Array.isArray(data)) {
      teams = data.map((template) =>  {return {name: template.name, id: template.id, athletes: []} })
      .sort((a,b) => {return a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1});
    }
    return teams;
  }
}

