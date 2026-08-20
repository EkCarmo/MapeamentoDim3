"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Package, ClipboardCheck } from "lucide-react";
import { getLocation } from "@/lib/db/locations";
import { listAllocationsByLocation, registrarContagem } from "@/lib/db/allocations";
import { getProduct } from "@/lib/db/products";
import type { Location, Allocation, Product } from "@/lib/types";
import Button from "@/components/ui/Button";
import { Card, EmptyState, LastCount } from "@/components/ui/Misc";

interface Row {
  allocation: Allocation;
  product: Product | null;
}

export default function LocalizacaoDetalhePage() {
  const { locationId } = useParams<{ locationId: string }>();
  const router = useRouter();

  const [location, setLocation] = useState<Location | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [countingId, setCountingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [loc, allocs] = await Promise.all([
      getLocation(locationId),
      listAllocationsByLocation(locationId),
    ]);
    const products = await Promise.all(allocs.map((a) => getProduct(a.productId)));
    setLocation(loc);
    setRows(
      allocs
        .map((allocation, i) => ({ allocation, product: products[i] }))
        .sort((a, b) => (a.product?.codigo || "").localeCompare(b.product?.codigo || ""))
    );
    setLoading(false);
  }, [locationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleContagem(row: Row) {
    if (!row.product) return;
    setCountingId(row.allocation.id);
    try {
      await registrarContagem({
        allocationId: row.allocation.id,
        productId: row.product.id,
        productCodigo: row.product.codigo,
        locationId: row.allocation.locationId,
        locationCodigo: row.allocation.locationCodigo,
      });
      await load();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Não foi possível registrar a contagem.");
    } finally {
      setCountingId(null);
    }
  }

  if (loading) return <p className="text-sm text-ink/40">Carregando…</p>;
  if (!location) return <p className="text-sm text-ink/40">Localização não encontrada.</p>;

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push(`/armazens/${location.warehouseId}`)}
        className="mb-4 flex items-center gap-1 text-sm text-ink/50 hover:text-ink"
      >
        <ChevronLeft size={16} /> Armazém {location.armazemCodigo}
      </button>

      <h1 className="font-code text-2xl font-700 text-ink">{location.codigo}</h1>
      <p className="mt-1 text-sm text-ink/50">
        Rua {location.rua} · Baia {location.baia} · Nível {location.nivel} — o que está aqui agora.
      </p>

      <div className="mt-6">
        {rows.length === 0 ? (
          <EmptyState
            title="Baia vazia"
            description="Nenhum produto está registrado nesta localização no momento."
          />
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <Card
                key={row.allocation.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3"
              >
                <Link
                  href={row.product ? `/produtos/${row.product.id}` : "#"}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-paper">
                    {row.product?.fotos?.[0] ? (
                      <Image
                        src={row.product.fotos[0].url}
                        alt={row.product.descricao}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-ink/25">
                        <Package size={18} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-code text-sm font-medium text-ink">
                      {row.product?.codigo || "(produto excluído)"}
                    </p>
                    <p className="truncate text-xs text-ink/50">{row.product?.descricao}</p>
                    {row.product?.cliente && (
                      <p className="truncate text-[11px] text-accent">
                        Cliente: {row.product.cliente}
                      </p>
                    )}
                    <LastCount
                      em={row.allocation.ultimaContagemEm}
                      por={row.allocation.ultimaContagemPor}
                    />
                  </div>
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => handleContagem(row)}
                  disabled={countingId === row.allocation.id || !row.product}
                >
                  <ClipboardCheck size={14} />
                  {countingId === row.allocation.id ? "Registrando…" : "Confirmar contagem"}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
