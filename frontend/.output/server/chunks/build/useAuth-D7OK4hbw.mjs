import { e as defineStore } from './server.mjs';
import { ref, computed } from 'vue';
import { u as useHttpClient } from './httpClient-NJZDPBxg.mjs';

const authApi = {
  async login(credentials) {
    const httpClient = useHttpClient();
    return httpClient.post("/auth/login", credentials);
  },
  async register(data) {
    const httpClient = useHttpClient();
    return httpClient.post("/auth/register", data);
  },
  async refresh() {
    const httpClient = useHttpClient();
    return httpClient.post("/auth/refresh");
  },
  async getMe() {
    const httpClient = useHttpClient();
    return httpClient.get("/auth/me");
  },
  async logout() {
    const httpClient = useHttpClient();
    return httpClient.post("/auth/logout");
  }
};
const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const accessToken = ref(null);
  const isAuthenticated = computed(() => !!accessToken.value);
  async function login(credentials) {
    try {
      const response = await authApi.login(credentials);
      user.value = response.user;
      accessToken.value = response.accessToken;
      const httpClient = useHttpClient();
      httpClient.setAccessToken(response.accessToken);
      httpClient.setUserData(response.user);
      return response;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }
  async function register(data) {
    try {
      const response = await authApi.register(data);
      user.value = response.user;
      accessToken.value = response.accessToken;
      const httpClient = useHttpClient();
      httpClient.setAccessToken(response.accessToken);
      httpClient.setUserData(response.user);
      return response;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  }
  async function logout() {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      user.value = null;
      accessToken.value = null;
      const httpClient = useHttpClient();
      httpClient.clearAuth();
      const { storage } = await import('./storage-3HIT_mhj.mjs');
      storage.clear();
    }
  }
  async function fetchProfile() {
    try {
      const profile = await authApi.getMe();
      user.value = profile;
      return profile;
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      throw error;
    }
  }
  function setAuth(userData, token) {
    user.value = userData;
    accessToken.value = token;
    const httpClient = useHttpClient();
    httpClient.setAccessToken(token);
    httpClient.setUserData(userData);
  }
  return {
    user,
    accessToken,
    isAuthenticated,
    login,
    register,
    logout,
    fetchProfile,
    setAuth
  };
});

export { useAuthStore as u };
//# sourceMappingURL=useAuth-D7OK4hbw.mjs.map
