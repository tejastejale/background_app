import { login } from "..";

export const makeLogin = async (body) => {
  try {
    const res = await login(body);
    return res.data;
  } catch (error) {
    return error;
  }
};
