import { db } from "./sqlite";

export const initDatabase = async (): Promise<void> => {
  const database = await db;

  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    -- Table Users
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      role TEXT NOT NULL,
      telephone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table Marchands
    CREATE TABLE IF NOT EXISTS marchands (
      id INTEGER PRIMARY KEY,
      nom TEXT NOT NULL,
      prenom TEXT,
      telephone TEXT,
      cin TEXT,
      nif TEXT,
      stat TEXT,
      type_activite TEXT,
      statut_de_paiement TEXT,
      etat TEXT,
      date_inscription DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table Sessions
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY,
      nom TEXT ,
      montant REAL,
      date_ouverture DATETIME ,
      date_fermeture DATETIME,
      statut TEXT DEFAULT 'active',
      regisseur_principal_id INTEGER,
      validation_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table Marchees
    CREATE TABLE IF NOT EXISTS marchees (
      id INTEGER PRIMARY KEY,
      nom TEXT NOT NULL,
      adresse TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table Zones
    CREATE TABLE IF NOT EXISTS zones (
      id INTEGER PRIMARY KEY,
      nom TEXT NOT NULL,
      marchee_id INTEGER NOT NULL,
      marchee_name TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (marchee_id) REFERENCES marchees(id) ON DELETE CASCADE
    );

    -- Table Halls
    CREATE TABLE IF NOT EXISTS halls (
      id INTEGER PRIMARY KEY,
      nom TEXT NOT NULL,
      numero INTEGER,
      description TEXT,
      code_unique TEXT,
      nbr_place INTEGER,
      marchee_id INTEGER,
      zone_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (marchee_id) REFERENCES marchees(id) ON DELETE CASCADE,
      FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE CASCADE
    );

    -- Table Places
    CREATE TABLE IF NOT EXISTS places (
      id INTEGER PRIMARY KEY,
      nom TEXT NOT NULL,
      statut TEXT DEFAULT 'disponible',
      date_debut_occupation DATETIME,
      droit_annuel REAL,
      categorie REAL,
      marchee_id INTEGER,
      zone_id INTEGER,
      hall_id INTEGER,
      marchand_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (marchee_id) REFERENCES marchees(id) ON DELETE CASCADE,
      FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE CASCADE,
      FOREIGN KEY (hall_id) REFERENCES halls(id) ON DELETE CASCADE,
      FOREIGN KEY (marchand_id) REFERENCES marchands(id) ON DELETE SET NULL
    );

    -- Table Paiements
    CREATE TABLE IF NOT EXISTS paiements (
      id INTEGER PRIMARY KEY,
      montant REAL NOT NULL,
      type_paiement TEXT,
      date_paiement DATETIME ,
      motif TEXT,
      marchand_id INTEGER ,
      marchandnom TEXT,
      place_id INTEGER,
      session_id INTEGER NOT NULL,
      agent_id INTEGER NOT NULL,
      quittance_id INTEGER,
      date_debut TEXT,
      date_fin TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (marchand_id) REFERENCES marchands(id) ON DELETE RESTRICT,
      FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE RESTRICT,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE RESTRICT,
      FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE SET NULL
    );

    -- Table Quittances
    CREATE TABLE IF NOT EXISTS quittances (
      id INTEGER PRIMARY KEY,
      creation_date DATETIME ,
      date_utilisation DATETIME,
      nom TEXT NOT NULL,
      etat TEXT,
      quittance_plage_id INTEGER,
      paiement_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (paiement_id) REFERENCES paiements(id) ON DELETE CASCADE
    );
     
    -- Table Notes
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table pour tracker la dernière synchronisation
    CREATE TABLE IF NOT EXISTS sync_metadata (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      last_sync_timestamp DATETIME NOT NULL,
      sync_status TEXT DEFAULT 'success',
      error_message TEXT
    );

    -- Index pour améliorer les performances
    CREATE INDEX IF NOT EXISTS idx_paiements_marchand ON paiements(marchand_id);
    CREATE INDEX IF NOT EXISTS idx_paiements_agent ON paiements(agent_id);
    CREATE INDEX IF NOT EXISTS idx_paiements_session ON paiements(session_id);
    CREATE INDEX IF NOT EXISTS idx_quittances_paiement ON quittances(paiement_id);
    CREATE INDEX IF NOT EXISTS idx_zones_marchee ON zones(marchee_id);
    CREATE INDEX IF NOT EXISTS idx_halls_marchee ON halls(marchee_id);
    CREATE INDEX IF NOT EXISTS idx_halls_zone ON halls(zone_id);
    CREATE INDEX IF NOT EXISTS idx_places_marchee ON places(marchee_id);
    CREATE INDEX IF NOT EXISTS idx_places_zone ON places(zone_id);
    CREATE INDEX IF NOT EXISTS idx_places_hall ON places(hall_id);
    CREATE INDEX IF NOT EXISTS idx_places_marchand ON places(marchand_id);
  `);

  // 🔹 Insérer un enregistrement initial dans sync_metadata si nécessaire
  const existing = await database.getAllSync(
    `SELECT id FROM sync_metadata WHERE id = 1`,
  );
  if (!existing) {
    await database.runAsync(
      `INSERT INTO sync_metadata (id, last_sync_timestamp, sync_status, error_message)
       VALUES (1, ?, 'success', NULL)`,
      [new Date().toISOString()],
    );
    console.log("Enregistrement initial de sync_metadata créé");
  }

  console.log("Base de données initialisée avec succès");
};
