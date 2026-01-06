import { db } from "../database/sqlite";

export interface Paiement {
  id: number;
  marchand_id: number;
  montant: number;
  date_paiement: string;
  mois_paye: string;
  methode: string;
  reference?: string;
}
export interface StatutPaiement {
  estAJour: boolean;
  montantDu: number;
  moisEnRetard: string[];
  prochainePaiement: string;
  dernierPaiement?: Paiement;
}
export const getDernierPaiement = async (
  marchandId: number
): Promise<Paiement | null> => {
  const result = await (await db).getFirstAsync<Paiement>(
    `SELECT * FROM paiements 
     WHERE marchand_id = ? 
     ORDER BY date_paiement DESC 
     LIMIT 1`,
    [marchandId]
  );
  return result || null;
};
export const getStatutPaiement = async (
  marchandId: number
): Promise<StatutPaiement> => {
  const dernierPaiement = await getDernierPaiement(marchandId);
  const maintenant = new Date();
  const moisActuel = `${maintenant.getFullYear()}-${String(
    maintenant.getMonth() + 1
  ).padStart(2, '0')}`;

  if (!dernierPaiement) {
    return {
      estAJour: false,
      montantDu: 50000, // Montant mensuel en Ariary
      moisEnRetard: [moisActuel],
      prochainePaiement: moisActuel,
    };
  }

  const moisPaye = dernierPaiement.mois_paye;
  const [anneePaye, moisNumPaye] = moisPaye.split('-').map(Number);
  const [anneeActuelle, moisNumActuel] = moisActuel.split('-').map(Number);

  // Calcul des mois de retard
  const moisEnRetard: string[] = [];
  let annee = anneePaye;
  let mois = moisNumPaye + 1;

  while (annee < anneeActuelle || (annee === anneeActuelle && mois <= moisNumActuel)) {
    if (mois > 12) {
      mois = 1;
      annee++;
    }
    moisEnRetard.push(`${annee}-${String(mois).padStart(2, '0')}`);
    mois++;
  }

  const montantMensuel = 50000;

  return {
    estAJour: moisEnRetard.length === 0,
    montantDu: moisEnRetard.length * montantMensuel,
    moisEnRetard,
    prochainePaiement: moisEnRetard[0] || moisActuel,
    dernierPaiement,
  };
};
