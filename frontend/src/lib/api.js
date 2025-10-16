import { axiosInstance } from "./axios";


export const signup = async (signupData) => {
    const response = await axiosInstance.post('/auth/signup', signupData);
    return response.data;
};

export const login = async (loginData) => {
    const response = await axiosInstance.post('/auth/login', loginData);
    return response.data;
}

export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboard", userData);
  return response.data;
};

export async function getUserFriends() {
  const response = await axiosInstance.get("/users/friends");
  return response.data;
}

export async function getRecommendedUsers() {
  const response = await axiosInstance.get("/users/recommended");
  return response.data;
}

export async function getOutgoingFriendReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
}

export async function sendFriendRequest(userId) {
  const response = await axiosInstance.post(`/users/friend-request/${userId}`);
  return response.data;
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/accept`);
  return response.data;
}

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (error) {
    console.log("Error in getAuthUser:", error);
    return null;
  }
};

export const fetchFriend = async(targetUserId)=>{
    const res = await axiosInstance.get(`/auth/friend/${targetUserId}`);
    return res.data;
  }

export const fetchMessages = async(channelId)=> {
    const res = await axiosInstance.get(`/chat/messages/${channelId}`, { credentials: "include" });
    return res.data;
}

export const EditMessage = async({messageId,editText})=>
{
  await axiosInstance.put(`/chat/message/${messageId}`, { text: editText });
}

export const DeleteMessage = async (messageId) => {
      await axiosInstance.delete(`/chat/message/${messageId}`);
};

