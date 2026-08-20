"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";
import { listRecentMovements } from "@/lib/db/movements";
import { exportMovimentacoes } from "@/lib/export";
import type { Movement, MovementType } from "@/lib/types";
import Button from "@/components/ui/Button";
import { Card, MovementBadge, EmptyState } from "@/components/ui/Misc";
import clsx from "clsx";

const filters: { value: MovementType | "todos"; label: string }[] = [
  { value: "todos", label: "Todas" },
  { value: "entrada", label: "Inclusões" },
  { value: "transferencia", label: "Movimentações" },
  { value: "saida", label: "Zeradas" },
  { value: "contagem", label: "Contagens" },
];

export default function MovimentacoesPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MovementType | "todos">("todos");
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await exportMovimentacoes();
    } catch (err) {
      console.error(err);
      alert("Não foi possível exportar as movimentações.");
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    (async () => {
      setMovements(await listRecentMovements(200));
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () => (filter === "todos" ? movements : movements.filter((m) => m.tipo === filter)),
    [movements, filter]
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-700 text-ink">Movimentações</h1>
          <p className="mt-1 text-sm text-ink/50">
            Histórico completo de inclusões, transferências, baixas e contagens.
          </p>
        </div>
        <Button variant="secondary" onClick={handleExport} disabled={exporting}>
          <FileSpreadsheet size={15} /> {exporting ? "Exportando…" : "Exportar Excel"}
        </Button>
      </div>

      <div className="mt-5 flex gap-1.5">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={clsx(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.value ? "bg-accent text-white" : "bg-white text-ink/60 border border-line hover:bg-paper"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {loading ? (
          <p className="text-sm text-ink/40">Carregando…</p>
        ) : filtered.length === 0 ? (
          <EmptyState title="Nenhuma movimentação encontrada" />
        ) : (
          <Card>
            <ul className="divide-y divide-line">
              {filtered.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <Link
                      href={`/produtos/${m.productId}`}
                      className="font-code text-sm font-medium text-ink hover:text-accent"
                    >
                      {m.productCodigo}
                    </Link>
                    <p className="font-code truncate text-xs text-ink/50">
                      {m.origemCodigo || "—"} → {m.destinoCodigo || "—"}
                    </p>
                    {m.observacoes && (
                      <p className="truncate text-xs text-ink/40">{m.observacoes}</p>
                    )}
                    <p className="mt-0.5 text-[11px] text-ink/35">
                      {m.criadoEm?.toDate ? m.criadoEm.toDate().toLocaleString("pt-BR") : ""}
                      {m.usuarioEmail ? ` · ${m.usuarioEmail}` : ""}
                    </p>
                  </div>
                  <MovementBadge tipo={m.tipo} />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
