import { Theme as NativeTheme } from '@react-navigation/native';
import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';

export const lightTheme: NativeTheme & { spacing: typeof spacing; typography: typeof typography } = {
  dark: false,
  colors: {
    primary: colors.primary,
    background: colors.white,
    card: colors.gray100,
    text: colors.gray900,
    border: colors.gray300,
    notification: colors.secondary,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '300' },
  },
  spacing,
  typography,
};
