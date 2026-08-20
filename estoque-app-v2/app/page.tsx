"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { listRecentMovements } from "@/lib/db/movements";
import { Card, MovementBadge } from "@/components/ui/Misc";
import type { Movement } from "@/lib/types";

export default function DashboardPage() {
  const [counts, setCounts] = useState<{ armazens: number; produtos: number } | null>(null);
  const [recent, setRecent] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // getCountFromServer conta sem baixar os documentos (mais barato e rápido)
      const [whCount, prodCount, movements] = await Promise.all([
        getCountFromServer(collection(db, "warehouses")),
        getCountFromServer(collection(db, "products")),
        listRecentMovements(8),
      ]);
      setCounts({ armazens: whCount.data().count, produtos: prodCount.data().count });
      setRecent(movements);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-700 text-ink">Painel</h1>
      <p className="mt-1 text-sm text-ink/50">Visão geral do estoque e últimas movimentações.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2">
        <Link href="/armazens">
          <Card className="p-5 transition-colors hover:border-accent/40">
            <p className="text-xs uppercase tracking-wide text-ink/45">Armazéns</p>
            <p className="mt-1 font-display text-3xl font-700 text-ink">
              {loading ? "–" : counts?.armazens}
            </p>
          </Card>
        </Link>
        <Link href="/produtos">
          <Card className="p-5 transition-colors hover:border-accent/40">
            <p className="text-xs uppercase tracking-wide text-ink/45">Produtos cadastrados</p>
            <p className="mt-1 font-display text-3xl font-700 text-ink">
              {loading ? "–" : counts?.produtos}
            </p>
          </Card>
        </Link>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-700 text-ink">Últimas movimentações</h2>
          <Link href="/movimentacoes" className="text-sm text-accent hover:underline">
            Ver todas
          </Link>
        </div>

        <Card>
          {loading ? (
            <p className="p-5 text-sm text-ink/40">Carregando…</p>
          ) : recent.length === 0 ? (
            <p className="p-5 text-sm text-ink/40">Nenhuma movimentação registrada ainda.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{m.productCodigo}</p>
                    <p className="font-code truncate text-xs text-ink/45">
                      {m.origemCodigo || "—"} → {m.destinoCodigo || "—"}
                    </p>
                  </div>
                  <MovementBadge tipo={m.tipo} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
