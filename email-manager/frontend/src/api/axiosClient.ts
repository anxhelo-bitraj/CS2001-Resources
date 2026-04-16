import axios from 'axios';
import { msalInstance, } from '../auth/AuthProvider';
import { loginRequest } from '../auth/msalConfig';

const axiosClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use(async (config) => {
  const account = msalInstance.getActiveAccount();
  if (account) {
    try {
      const result = await msalInstance.acquireTokenSilent({ ...loginRequest, account });
      config.headers.Authorization = `Bearer ${result.accessToken}`;
    } catch {
      try {
        const result = await msalInstance.acquireTokenPopup(loginRequest);
        config.headers.Authorization = `Bearer ${result.accessToken}`;
      } catch (err) {
        console.error('Token acquisition failed', err);
      }
    }
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      msalInstance.logoutPopup();
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
