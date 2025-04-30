import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL, LOGIN } from "./constants";

const API = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

API.interceptors.request.use(async (req) => {
  const token = AsyncStorage.getItem("token");
  if (typeof token === "string")
    return (req.headers.Authorization = `Token ${token}`);
  return req;
});

export const login = (body) => API.post(`${LOGIN}`, body);
