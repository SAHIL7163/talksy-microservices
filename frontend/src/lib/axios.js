import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const axiosInstance = axios.create({
  baseURL: `${BACKEND_URL}`,
  withCredentials: true, // This allows cookies to be sent with requests
});

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (error) {
    console.log("Error in getAuthUser:", error);
    return null;
  }
};
