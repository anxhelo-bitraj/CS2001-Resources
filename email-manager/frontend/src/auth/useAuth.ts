import { useMsal } from '@azure/msal-react';
import { loginRequest } from './msalConfig';
import { useCallback } from 'react';

export function useAuth() {
  const { instance, accounts } = useMsal();
  const account = accounts[0] || null;

  const login = useCallback(async () => {
    try {
      await instance.loginPopup(loginRequest);
    } catch (err) {
      console.error('Login failed', err);
      throw err;
    }
  }, [instance]);

  const logout = useCallback(async () => {
    await instance.logoutPopup({ postLogoutRedirectUri: '/' });
  }, [instance]);

  const getAccessToken = useCallback(async (): Promise<string> => {
    if (!account) throw new Error('Not authenticated');
    try {
      const result = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      return result.accessToken;
    } catch {
      const result = await instance.acquireTokenPopup(loginRequest);
      return result.accessToken;
    }
  }, [instance, account]);

  return {
    isAuthenticated: !!account,
    user: account
      ? { id: account.homeAccountId, email: account.username, displayName: account.name || '' }
      : null,
    login,
    logout,
    getAccessToken,
  };
}
