import { DocumentType } from "@/types";

export function detectDocumentType(text: string): DocumentType {
  if (text.includes("MEDEDELING STATUS VOORAANMELDING")) return "MEDEDELING";
  if (text.includes("INSPECTIERAPPORT") && text.includes("Rapportnummer")) return "INSPECTIE";
  if (text.includes("OPDRACHTFORMULIER VOOR DIAGNOSTISCH ONDERZOEK")) return "MONSTER";
  if (text.includes("BLOKKADEFORMULIER FYTOSANITAIR")) return "BLOKKADE";
  return "UNKNOWN";
}
