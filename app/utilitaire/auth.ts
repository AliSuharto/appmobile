import * as SecureStore from 'expo-secure-store';

export const logout = async () => {
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
};
export const storeTokens = async (accessToken: string, refreshToken: string) => {
  await SecureStore.setItemAsync('access_token', accessToken);
  await SecureStore.setItemAsync('refresh_token', refreshToken);
};

export const getAccessToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync('access_token');
};  