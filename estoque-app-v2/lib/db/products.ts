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
import { deleteProductPhoto } from "@/lib/db/photos";
import type { Product, ProductPhoto } from "@/lib/types";

const col = collection(db, "products");
const allocationsCol = collection(db, "allocations");

export async function listProducts(): Promise<Product[]> {
  const q = query(col, orderBy("codigo"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
}

export async function getProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, "products", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Product;
}

/** Impede dois produtos com o mesmo código */
async function assertCodigoUnico(codigo: string, ignoreId?: string) {
  const q = query(col, where("codigo", "==", codigo));
  const snap = await getDocs(q);
  const duplicado = snap.docs.find((d) => d.id !== ignoreId);
  if (duplicado) {
    throw new Error(`Já existe um produto cadastrado com o código "${codigo}".`);
  }
}

export async function createProduct(params: {
  codigo: string;
  descricao: string;
  cliente?: string;
  observacoes?: string;
  fotos?: ProductPhoto[];
}) {
  const codigo = params.codigo.trim();
  await assertCodigoUnico(codigo);
  return addDoc(col, {
    codigo,
    descricao: params.descricao.trim(),
    cliente: params.cliente?.trim() || "",
    observacoes: params.observacoes?.trim() || "",
    fotos: params.fotos || [],
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function updateProduct(
  id: string,
  data: Partial<Pick<Product, "codigo" | "descricao" | "cliente" | "observacoes" | "fotos">>
) {
  if (data.codigo !== undefined) {
    data.codigo = data.codigo.trim();
    await assertCodigoUnico(data.codigo, id);
  }
  return updateDoc(doc(db, "products", id), {
    ...data,
    atualizadoEm: serverTimestamp(),
  });
}

/**
 * Exclusão segura: bloqueia se o produto ainda estiver alocado em alguma
 * localização e apaga as fotos do Storage junto (sem deixar lixo pra trás).
 * O histórico de movimentações é preservado de propósito.
 */
export async function deleteProduct(id: string) {
  const alocado = await getDocs(query(allocationsCol, where("productId", "==", id)));
  if (!alocado.empty) {
    throw new Error(
      `Este produto ainda está alocado em ${alocado.size} localização(ões). Zere ou transfira antes de excluir.`
    );
  }
  const product = await getProduct(id);
  if (product?.fotos?.length) {
    await Promise.all(
      product.fotos.map((f) => deleteProductPhoto(f.path).catch(() => undefined))
    );
  }
  return deleteDoc(doc(db, "products", id));
}
