import { BASE_URL_API } from "@/app/utilitaire/api";

export interface Marchand {
  id: number;
  nom: string;
  statut: string;
  activite: string;
  place: string;
  telephone?: string;
  dateDebut?: string;
  dateFin?: string;
  cin: string;
  nif?: string;
  stat?: string;
  montantPlace?: string;
  montantAnnuel?: string;
  motifPaiementAnnuel?: string;
  motifPaiementPlace?: string;
  totalPaiementRestant?: string;
  totalPaiementEffectuer?: string;
  frequencePaiement?: string;
}

export async function rechercherMarchandParCIN(cin: string): Promise<Marchand> {
  const response = await fetch(
    `${BASE_URL_API}/public/marchands/cin/${encodeURIComponent(cin)}`,
  );

  if (!response.ok) {
    throw new Error("Marchand introuvable");
  }

  return response.json();
}
