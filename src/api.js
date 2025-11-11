import axios from "axios";

const api = axios.create({
  baseURL: "https://data-production-bc01.up.railway.app/api", // adjust if backend hosted elsewhere
});

export default api;
