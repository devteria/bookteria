import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import { getToken } from "./localStorageService";

export const getMyConversations = async () => {
  return await httpClient.get(API.MY_CONVERSATIONS, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const createConversation = async (data) => {
  return await httpClient.post(
    API.CREATE_CONVERSATION,
    {
      type: data.type,
      participantIds: data.participantIds,
    },
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    }
  );
};


export const createMessage = async (data) => {
  return await httpClient.post(
    API.CREATE_MESSAGE,
    {
      conversationId: data.conversationId,
      message: data.message,
    },
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const getMessages = async (conversationId) => {
  return await httpClient.get(`${API.GET_CONVERSATION_MESSAGES}?conversationId=${conversationId}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};