import { Theme } from "@react-navigation/native";
import { colors } from "./colors";
import { spacing } from "./spacing";
import { typography } from "./typography";

export const darkTheme: Theme & {
  spacing: typeof spacing;
  typography: typeof typography;
} = {
  dark: true,
  colors: {
    primary: colors.primary,
    background: colors.gray900,
    card: colors.gray700,
    text: colors.white,
    border: colors.gray500,
    notification: colors.secondary,
  },
  fonts: {
    regular: { fontFamily: "System", fontWeight: "400" },
    medium: { fontFamily: "System", fontWeight: "500" },
    bold: { fontFamily: "System", fontWeight: "700" },
    heavy: { fontFamily: "System", fontWeight: "300" },
  },
  spacing,
  typography,
};
