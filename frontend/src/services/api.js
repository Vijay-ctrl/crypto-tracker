import axios from "axios";

const API_BASE_URL = (
   import.meta.env.VITE_API_URL ||
   "http://localhost:4000/api"
).replace(/\/+$/, "");

const api = axios.create({
   baseURL: API_BASE_URL,
   headers: {
      "Content-Type": "application/json",
   },
   timeout: 15000,
});


// ========================================
// Attach Authentication Token
// ========================================

api.interceptors.request.use(
   (config) => {
      const token = localStorage.getItem("token");

      if (!config.headers) {
         config.headers = {};
      }

      if (
         token &&
         typeof token === "string" &&
         token.trim()
      ) {
         config.headers.Authorization =
            `Bearer ${token.trim()}`;
      }

      return config;
   },
   (error) => {
      return Promise.reject(error);
   }
);


// ========================================
// Handle API Errors
// ========================================

api.interceptors.response.use(
   (response) => response,

   (error) => {
      if (error.response) {
         console.error(
            "API Error:",
            error.response.status,
            error.response.data
         );
      } else {
         console.error(
            "API Request Error:",
            error.message
         );
      }

      return Promise.reject(error);
   }
);


export default api;