import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import { getToken } from "./localStorageService";

export const getMyInfo = async () => {
  return await httpClient.get(API.MY_INFO, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const updateProfile = async (profileData) => {
  return await httpClient.put(API.UPDATE_PROFILE, profileData, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const uploadAvatar = async (formData) => {
  return await httpClient.post(API.UPDATE_PROFILE, formData, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "multipart/form-data",
    },
  });
};
