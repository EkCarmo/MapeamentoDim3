import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db, currentUserEmail } from "@/lib/firebase";
import type { Allocation } from "@/lib/types";

const allocationsCol = collection(db, "allocations");
const movementsCol = collection(db, "movements");

export async function listAllocationsByProduct(productId: string): Promise<Allocation[]> {
  const q = query(
    allocationsCol,
    where("productId", "==", productId),
    orderBy("locationCodigo")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Allocation));
}

export async function listAllocationsByLocation(locationId: string): Promise<Allocation[]> {
  const q = query(allocationsCol, where("locationId", "==", locationId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Allocation));
}

/** Todas as alocações atuais (usado na busca por localização e na exportação) */
export async function listAllocationsAll(): Promise<Allocation[]> {
  const snap = await getDocs(allocationsCol);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Allocation));
}

/**
 * Impede alocação duplicada: o mesmo produto já registrado na mesma localização.
 * Lança um Error com mensagem amigável (exibida no alert da UI).
 */
async function assertNaoDuplicado(productId: string, locationId: string, locationCodigo: string) {
  const q = query(
    allocationsCol,
    where("productId", "==", productId),
    where("locationId", "==", locationId)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error(`Este produto já está registrado em ${locationCodigo}.`);
  }
}

/**
 * Inclusão: registra que um produto passou a existir em uma localização
 * (produto novo no estoque, ou reforço em mais uma baia).
 */
export async function registrarEntrada(params: {
  productId: string;
  productCodigo: string;
  locationId: string;
  locationCodigo: string;
  observacoes?: string;
}) {
  await assertNaoDuplicado(params.productId, params.locationId, params.locationCodigo);
  const usuarioEmail = currentUserEmail();

  await runTransaction(db, async (tx) => {
    const allocationRef = doc(allocationsCol);
    tx.set(allocationRef, {
      productId: params.productId,
      locationId: params.locationId,
      locationCodigo: params.locationCodigo,
      observacoes: params.observacoes || "",
      criadoEm: serverTimestamp(),
      ultimaContagemEm: null,
      ultimaContagemPor: null,
    });

    const movementRef = doc(movementsCol);
    tx.set(movementRef, {
      productId: params.productId,
      productCodigo: params.productCodigo,
      tipo: "entrada",
      origemLocationId: null,
      origemCodigo: null,
      destinoLocationId: params.locationId,
      destinoCodigo: params.locationCodigo,
      observacoes: params.observacoes || "",
      usuarioEmail,
      criadoEm: serverTimestamp(),
    });
  });
}

/**
 * Transferência total: o produto sai completamente da baia de origem
 * e passa a existir apenas na baia de destino.
 */
export async function transferirTotal(params: {
  allocationId: string; // alocação de origem a ser movida
  productId: string;
  productCodigo: string;
  origemLocationId: string;
  origemCodigo: string;
  destinoLocationId: string;
  destinoCodigo: string;
  observacoes?: string;
}) {
  await assertNaoDuplicado(params.productId, params.destinoLocationId, params.destinoCodigo);
  const usuarioEmail = currentUserEmail();

  await runTransaction(db, async (tx) => {
    const origemRef = doc(allocationsCol, params.allocationId);
    const origemSnap = await tx.get(origemRef);
    if (!origemSnap.exists()) {
      throw new Error("Esta alocação já foi movida ou zerada por outro usuário. Atualize a página.");
    }
    tx.delete(origemRef);

    const destinoRef = doc(allocationsCol);
    tx.set(destinoRef, {
      productId: params.productId,
      locationId: params.destinoLocationId,
      locationCodigo: params.destinoCodigo,
      observacoes: params.observacoes || "",
      criadoEm: serverTimestamp(),
      ultimaContagemEm: null,
      ultimaContagemPor: null,
    });

    const movementRef = doc(movementsCol);
    tx.set(movementRef, {
      productId: params.productId,
      productCodigo: params.productCodigo,
      tipo: "transferencia",
      origemLocationId: params.origemLocationId,
      origemCodigo: params.origemCodigo,
      destinoLocationId: params.destinoLocationId,
      destinoCodigo: params.destinoCodigo,
      observacoes: params.observacoes || "",
      usuarioEmail,
      criadoEm: serverTimestamp(),
    });
  });
}

/**
 * Divisão: parte do material de uma baia passa a existir também em outra baia.
 * A alocação de origem é mantida (o material continua lá também).
 */
export async function dividirEmNovaBaia(params: {
  productId: string;
  productCodigo: string;
  origemLocationId: string;
  origemCodigo: string;
  destinoLocationId: string;
  destinoCodigo: string;
  observacoes?: string;
}) {
  await assertNaoDuplicado(params.productId, params.destinoLocationId, params.destinoCodigo);
  const usuarioEmail = currentUserEmail();

  await runTransaction(db, async (tx) => {
    const destinoRef = doc(allocationsCol);
    tx.set(destinoRef, {
      productId: params.productId,
      locationId: params.destinoLocationId,
      locationCodigo: params.destinoCodigo,
      observacoes: params.observacoes || "",
      criadoEm: serverTimestamp(),
      ultimaContagemEm: null,
      ultimaContagemPor: null,
    });

    const movementRef = doc(movementsCol);
    tx.set(movementRef, {
      productId: params.productId,
      productCodigo: params.productCodigo,
      tipo: "transferencia",
      origemLocationId: params.origemLocationId,
      origemCodigo: params.origemCodigo,
      destinoLocationId: params.destinoLocationId,
      destinoCodigo: params.destinoCodigo,
      observacoes: `[Divisão] ${params.observacoes || ""}`.trim(),
      usuarioEmail,
      criadoEm: serverTimestamp(),
    });
  });
}

/**
 * Zerar: o material não está mais nesta localização (baixa total naquela baia,
 * sem indicar para onde foi — ex: consumido, expedido, perdido).
 */
export async function zerarAlocacao(params: {
  allocationId: string;
  productId: string;
  productCodigo: string;
  locationId: string;
  locationCodigo: string;
  observacoes?: string;
}) {
  const usuarioEmail = currentUserEmail();

  await runTransaction(db, async (tx) => {
    const allocationRef = doc(allocationsCol, params.allocationId);
    const snap = await tx.get(allocationRef);
    if (!snap.exists()) {
      throw new Error("Esta alocação já foi movida ou zerada por outro usuário. Atualize a página.");
    }
    tx.delete(allocationRef);

    const movementRef = doc(movementsCol);
    tx.set(movementRef, {
      productId: params.productId,
      productCodigo: params.productCodigo,
      tipo: "saida",
      origemLocationId: params.locationId,
      origemCodigo: params.locationCodigo,
      destinoLocationId: null,
      destinoCodigo: null,
      observacoes: params.observacoes || "",
      usuarioEmail,
      criadoEm: serverTimestamp(),
    });
  });
}

/**
 * Contagem: confirma que o material foi conferido fisicamente nesta localização.
 * Atualiza a "última contagem" da alocação e grava no histórico quem contou e quando.
 */
export async function registrarContagem(params: {
  allocationId: string;
  productId: string;
  productCodigo: string;
  locationId: string;
  locationCodigo: string;
  observacoes?: string;
}) {
  const usuarioEmail = currentUserEmail();

  await runTransaction(db, async (tx) => {
    const allocationRef = doc(allocationsCol, params.allocationId);
    const snap = await tx.get(allocationRef);
    if (!snap.exists()) {
      throw new Error("Esta alocação não existe mais. Atualize a página.");
    }
    tx.update(allocationRef, {
      ultimaContagemEm: serverTimestamp(),
      ultimaContagemPor: usuarioEmail,
    });

    const movementRef = doc(movementsCol);
    tx.set(movementRef, {
      productId: params.productId,
      productCodigo: params.productCodigo,
      tipo: "contagem",
      origemLocationId: params.locationId,
      origemCodigo: params.locationCodigo,
      destinoLocationId: params.locationId,
      destinoCodigo: params.locationCodigo,
      observacoes: params.observacoes || "",
      usuarioEmail,
      criadoEm: serverTimestamp(),
    });
  });
}
