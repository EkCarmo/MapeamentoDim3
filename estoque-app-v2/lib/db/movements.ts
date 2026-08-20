import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit as fsLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Movement } from "@/lib/types";

const col = collection(db, "movements");

/** Últimas movimentações globais, mais recentes primeiro */
export async function listRecentMovements(max = 100): Promise<Movement[]> {
  const q = query(col, orderBy("criadoEm", "desc"), fsLimit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Movement));
}

/** Histórico completo de um produto específico */
export async function listMovementsByProduct(productId: string): Promise<Movement[]> {
  const q = query(
    col,
    where("productId", "==", productId),
    orderBy("criadoEm", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Movement));
}
