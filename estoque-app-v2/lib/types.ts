import type { Timestamp } from "firebase/firestore";

/** Um armazém físico, ex: "G5" */
export interface Warehouse {
  id: string;
  codigo: string; // ex: "G5"
  nome?: string; // nome descritivo opcional
  criadoEm: Timestamp;
}

/**
 * Uma localização é a combinação rua + baia + nível dentro de um armazém.
 * Guardamos "achatado" (não aninhado) para facilitar consultas.
 * Ex: armazém G5, rua H, baia A, nível 1.2 -> codigo "G5-H-A-1.2"
 */
export interface Location {
  id: string;
  warehouseId: string;
  armazemCodigo: string; // desnormalizado para exibição rápida
  rua: string;
  baia: string;
  nivel: string;
  codigo: string; // "G5-H-A-1.2", único, usado em buscas e exibição
  ativo: boolean;
  criadoEm: Timestamp;
}

/** Cadastro de produto */
export interface Product {
  id: string;
  codigo: string; // código interno do produto
  descricao: string;
  cliente?: string; // cliente ao qual o material pertence
  fotos: ProductPhoto[];
  observacoes?: string;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

export interface ProductPhoto {
  url: string;
  path: string; // caminho no Storage, usado para deletar depois
}

/**
 * Alocação = "este produto está nesta localização agora".
 * Um produto pode ter várias alocações simultâneas (dividido em baias diferentes).
 * Não guardamos quantidade, apenas presença.
 */
export interface Allocation {
  id: string;
  productId: string;
  locationId: string;
  locationCodigo: string; // desnormalizado para exibição sem join
  observacoes?: string;
  criadoEm: Timestamp;
  /** Última contagem física confirmada nesta localização */
  ultimaContagemEm?: Timestamp | null;
  ultimaContagemPor?: string | null; // e-mail do usuário que contou
}

export type MovementType = "entrada" | "transferencia" | "saida" | "contagem";

/**
 * Registro histórico e imutável de toda movimentação.
 * - entrada: material incluído em uma localização (novo ou adicional)
 * - transferencia: material mudou de localização (ou foi dividido)
 * - saida: material foi zerado de uma localização (não está mais lá)
 * - contagem: contagem física confirmada na localização (material conferido)
 */
export interface Movement {
  id: string;
  productId: string;
  productCodigo: string; // desnormalizado
  tipo: MovementType;
  origemLocationId: string | null;
  origemCodigo: string | null;
  destinoLocationId: string | null;
  destinoCodigo: string | null;
  observacoes?: string;
  usuarioEmail?: string; // quem fez a ação
  criadoEm: Timestamp;
}
