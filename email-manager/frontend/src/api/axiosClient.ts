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
    // Do not auto-logout on 401 — let individual pages/hooks handle auth errors.
    // An auto-logout here caused a redirect loop: any failed API call would clear
    // the MSAL session, making useIsAuthenticated() return false and bouncing the
    // user back to /login even though they had a valid Microsoft session.
    return Promise.reject(error);
  }
);

export default axiosClient;
