import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseAsync("bonw.db");
