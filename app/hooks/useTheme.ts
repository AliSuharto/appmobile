import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from '../theme';

export const useTheme = () => {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
};
