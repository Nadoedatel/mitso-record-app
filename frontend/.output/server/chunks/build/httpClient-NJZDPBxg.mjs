import { c as useRuntimeConfig } from './server.mjs';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
class HttpClient {
  constructor(baseURL) {
    __publicField(this, "baseURL");
    __publicField(this, "accessToken", null);
    __publicField(this, "userData", null);
    __publicField(this, "TOKEN_KEY", "mitso_access_token");
    __publicField(this, "USER_DATA_KEY", "mitso_user_data");
    this.baseURL = baseURL;
  }
  setAccessToken(token) {
    this.accessToken = token;
  }
  getAccessToken() {
    return this.accessToken;
  }
  setUserData(data) {
    this.userData = data;
  }
  getUserData() {
    return this.userData;
  }
  clearAuth() {
    this.setAccessToken(null);
    this.setUserData(null);
  }
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers
    };
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }
    const config = {
      ...options,
      headers,
      credentials: "include"
      // Include cookies for refresh token
    };
    try {
      const response = await fetch(url, config);
      if (response.status === 401 && !endpoint.includes("/auth")) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          headers["Authorization"] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, { ...config, headers });
          return this.handleResponse(retryResponse);
        }
      }
      return this.handleResponse(response);
    } catch (error) {
      console.error("HTTP Client Error:", error);
      throw error;
    }
  }
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText
      }));
      throw new Error(error.message || "Request failed");
    }
    const data = await response.json();
    if (data && "data" in data && "message" in data) {
      return data.data;
    }
    return data;
  }
  async refreshToken() {
    var _a;
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
        // Send refresh token cookie
      });
      if (response.ok) {
        const data = await response.json();
        this.setAccessToken(data.accessToken || ((_a = data.data) == null ? void 0 : _a.accessToken));
        return true;
      }
      this.setAccessToken(null);
      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.setAccessToken(null);
      return false;
    }
  }
  async get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  }
  async post(endpoint, body) {
    return this.request(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : void 0
    });
  }
  async patch(endpoint, body) {
    return this.request(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : void 0
    });
  }
  async delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }
}
let httpClient;
const useHttpClient = () => {
  if (!httpClient) {
    const config = useRuntimeConfig();
    httpClient = new HttpClient(config.public.apiUrl);
  }
  return httpClient;
};

export { useHttpClient as u };
//# sourceMappingURL=httpClient-NJZDPBxg.mjs.map
