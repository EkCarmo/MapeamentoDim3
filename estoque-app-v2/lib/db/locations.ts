import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Location } from "@/lib/types";

const col = collection(db, "locations");

export function buildCodigo(armazemCodigo: string, rua: string, baia: string, nivel: string) {
  return `${armazemCodigo}-${rua}-${baia}-${nivel}`.toUpperCase();
}

export async function listLocationsByWarehouse(warehouseId: string): Promise<Location[]> {
  const q = query(col, where("warehouseId", "==", warehouseId), orderBy("codigo"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Location));
}

export async function getLocation(id: string): Promise<Location | null> {
  const snap = await getDoc(doc(db, "locations", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Location;
}

/** Verifica se já existe uma localização com este código (rua+baia+nível iguais) */
async function existeCodigo(codigo: string): Promise<boolean> {
  const snap = await getDocs(query(col, where("codigo", "==", codigo)));
  return !snap.empty;
}

export async function createLocation(params: {
  warehouseId: string;
  armazemCodigo: string;
  rua: string;
  baia: string;
  nivel: string;
}) {
  const rua = params.rua.trim().toUpperCase();
  const baia = params.baia.trim().toUpperCase();
  const nivel = params.nivel.trim().toUpperCase();
  const codigo = buildCodigo(params.armazemCodigo, rua, baia, nivel);

  if (await existeCodigo(codigo)) {
    throw new Error(`A localização ${codigo} já existe.`);
  }

  return addDoc(col, {
    warehouseId: params.warehouseId,
    armazemCodigo: params.armazemCodigo,
    rua,
    baia,
    nivel,
    codigo,
    ativo: true,
    criadoEm: serverTimestamp(),
  });
}

export async function updateLocation(
  id: string,
  data: Partial<Pick<Location, "rua" | "baia" | "nivel" | "ativo">>,
  armazemCodigo: string
) {
  const payload: Record<string, unknown> = { ...data };
  if (data.rua) payload.rua = data.rua.trim().toUpperCase();
  if (data.baia) payload.baia = data.baia.trim().toUpperCase();
  if (data.nivel) payload.nivel = data.nivel.trim().toUpperCase();

  // Recalcula o código composto se algum componente mudou
  if (data.rua || data.baia || data.nivel) {
    const current = await getLocation(id);
    if (current) {
      payload.codigo = buildCodigo(
        armazemCodigo,
        (payload.rua as string) || current.rua,
        (payload.baia as string) || current.baia,
        (payload.nivel as string) || current.nivel
      );
    }
  }

  return updateDoc(doc(db, "locations", id), payload);
}

export async function deleteLocation(id: string) {
  return deleteDoc(doc(db, "locations", id));
}

/**
 * Criação em lote: recebe listas de baias e níveis separados por vírgula
 * e cria o produto cartesiano (ex: baias "A,B,C" × níveis "1.1,1.2" = 6 localizações).
 * Localizações que já existem são puladas, não geram erro.
 */
export async function createLocationsBatch(params: {
  warehouseId: string;
  armazemCodigo: string;
  rua: string;
  baias: string; // "A,B,C"
  niveis: string; // "1.1,1.2,2.1"
}): Promise<{ criadas: string[]; puladas: string[] }> {
  const rua = params.rua.trim().toUpperCase();
  const baias = params.baias.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  const niveis = params.niveis.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);

  const criadas: string[] = [];
  const puladas: string[] = [];

  for (const baia of baias) {
    for (const nivel of niveis) {
      const codigo = buildCodigo(params.armazemCodigo, rua, baia, nivel);
      if (await existeCodigo(codigo)) {
        puladas.push(codigo);
        continue;
      }
      await addDoc(col, {
        warehouseId: params.warehouseId,
        armazemCodigo: params.armazemCodigo,
        rua,
        baia,
        nivel,
        codigo,
        ativo: true,
        criadoEm: serverTimestamp(),
      });
      criadas.push(codigo);
    }
  }

  return { criadas, puladas };
}
