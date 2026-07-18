import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (!error.response) {
      error.userMessage = "Unable to connect to the server.";
    } else if (error.response.status === 404) {
      error.userMessage = "The requested resource was not found.";
    } else if (error.response.status >= 500) {
      error.userMessage = "The server encountered an error.";
    } else {
      error.userMessage =
        error.response?.data?.message || "Something went wrong.";
    }

    return Promise.reject(error);
  },
);

export default api;
