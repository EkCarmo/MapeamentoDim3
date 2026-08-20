import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Warehouse } from "@/lib/types";

const col = collection(db, "warehouses");

export async function listWarehouses(): Promise<Warehouse[]> {
  const q = query(col, orderBy("codigo"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Warehouse));
}

export async function getWarehouse(id: string): Promise<Warehouse | null> {
  const snap = await getDoc(doc(db, "warehouses", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Warehouse;
}

export async function createWarehouse(codigo: string, nome?: string) {
  return addDoc(col, {
    codigo: codigo.trim().toUpperCase(),
    nome: nome?.trim() || "",
    criadoEm: serverTimestamp(),
  });
}

export async function updateWarehouse(
  id: string,
  data: Partial<Pick<Warehouse, "codigo" | "nome">>
) {
  const payload: Record<string, unknown> = { ...data };
  if (payload.codigo && typeof payload.codigo === "string") {
    payload.codigo = payload.codigo.trim().toUpperCase();
  }
  return updateDoc(doc(db, "warehouses", id), payload);
}

export async function deleteWarehouse(id: string) {
  return deleteDoc(doc(db, "warehouses", id));
}
