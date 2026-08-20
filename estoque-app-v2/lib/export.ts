import type { Timestamp } from "firebase/firestore";
import { listProducts } from "@/lib/db/products";
import { listAllocationsAll } from "@/lib/db/allocations";
import { listRecentMovements } from "@/lib/db/movements";

function fmtTs(ts?: Timestamp | null): string {
  if (!ts || typeof ts.toDate !== "function") return "";
  return ts.toDate().toLocaleString("pt-BR");
}

const tipoLabel: Record<string, string> = {
  entrada: "Inclusão",
  transferencia: "Movimentação",
  saida: "Zerado",
  contagem: "Contagem",
};

async function downloadXlsx(rows: Record<string, unknown>[], sheetName: string, fileName: string) {
  const XLSX = await import("xlsx"); // import dinâmico: só baixa a lib quando exportar
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}

/** Inventário atual: uma linha por produto × localização */
export async function exportInventario() {
  const [products, allocations] = await Promise.all([listProducts(), listAllocationsAll()]);
  const byProduct = new Map<string, typeof allocations>();
  for (const a of allocations) {
    const list = byProduct.get(a.productId) || [];
    list.push(a);
    byProduct.set(a.productId, list);
  }

  const rows: Record<string, unknown>[] = [];
  for (const p of products) {
    const allocs = byProduct.get(p.id) || [];
    if (allocs.length === 0) {
      rows.push({
        "Código": p.codigo,
        "Descrição": p.descricao,
        "Cliente": p.cliente || "",
        "Localização": "SEM LOCALIZAÇÃO",
        "Obs. da alocação": "",
        "Última contagem": "",
        "Contado por": "",
      });
      continue;
    }
    for (const a of allocs.sort((x, y) => x.locationCodigo.localeCompare(y.locationCodigo))) {
      rows.push({
        "Código": p.codigo,
        "Descrição": p.descricao,
        "Cliente": p.cliente || "",
        "Localização": a.locationCodigo,
        "Obs. da alocação": a.observacoes || "",
        "Última contagem": fmtTs(a.ultimaContagemEm),
        "Contado por": a.ultimaContagemPor || "",
      });
    }
  }

  const data = new Date().toISOString().slice(0, 10);
  await downloadXlsx(rows, "Inventário", `inventario_${data}.xlsx`);
}

/** Histórico de movimentações (até 5000 mais recentes) */
export async function exportMovimentacoes() {
  const movements = await listRecentMovements(5000);
  const rows = movements.map((m) => ({
    "Data": fmtTs(m.criadoEm),
    "Produto": m.productCodigo,
    "Tipo": tipoLabel[m.tipo] || m.tipo,
    "Origem": m.origemCodigo || "",
    "Destino": m.destinoCodigo || "",
    "Usuário": m.usuarioEmail || "",
    "Observações": m.observacoes || "",
  }));

  const data = new Date().toISOString().slice(0, 10);
  await downloadXlsx(rows, "Movimentações", `movimentacoes_${data}.xlsx`);
}
