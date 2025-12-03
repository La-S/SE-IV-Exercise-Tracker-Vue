import apiClient from "./apiService";

export default {
  loginUser(user) {
    return apiClient.post("login", user);
  },
  authorizeUser(code) {
    return apiClient.post("authorize", code);
  },
  logoutUser(token) {
    return apiClient.post("logout", token);
  },
  authenticateSession(token){
    return apiClient.post("authenticate", token)
  }
};
