"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Package, FileSpreadsheet } from "lucide-react";
import { listProducts } from "@/lib/db/products";
import { listAllocationsAll } from "@/lib/db/allocations";
import { exportInventario } from "@/lib/export";
import type { Product, Allocation } from "@/lib/types";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, EmptyState } from "@/components/ui/Misc";

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      const [prods, allocs] = await Promise.all([listProducts(), listAllocationsAll()]);
      setProducts(prods);
      setAllocations(allocs);
      setLoading(false);
    })();
  }, []);

  // mapa productId -> códigos das localizações onde o produto está
  const locationsByProduct = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const a of allocations) {
      const list = map.get(a.productId) || [];
      list.push(a.locationCodigo);
      map.set(a.productId, list);
    }
    for (const list of map.values()) list.sort();
    return map;
  }, [allocations]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.codigo.toLowerCase().includes(term) ||
        p.descricao.toLowerCase().includes(term) ||
        (p.cliente || "").toLowerCase().includes(term) ||
        (locationsByProduct.get(p.id) || []).some((c) => c.toLowerCase().includes(term))
    );
  }, [products, search, locationsByProduct]);

  async function handleExport() {
    setExporting(true);
    try {
      await exportInventario();
    } catch (err) {
      console.error(err);
      alert("Não foi possível exportar o inventário.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-700 text-ink">Produtos</h1>
          <p className="mt-1 text-sm text-ink/50">Cadastro de materiais e onde cada um está.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport} disabled={exporting}>
            <FileSpreadsheet size={15} /> {exporting ? "Exportando…" : "Exportar Excel"}
          </Button>
          <Link href="/produtos/novo">
            <Button>
              <Plus size={16} /> Novo produto
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative mt-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
        <Input
          placeholder="Buscar por código, descrição, cliente ou localização"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-ink/40">Carregando…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={products.length === 0 ? "Nenhum produto cadastrado" : "Nada encontrado"}
            description={
              products.length === 0
                ? "Cadastre o primeiro produto com código, descrição e foto."
                : "Tente buscar por outro código ou descrição."
            }
            action={
              products.length === 0 ? (
                <Link href="/produtos/novo">
                  <Button>
                    <Plus size={16} /> Novo produto
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Link key={p.id} href={`/produtos/${p.id}`}>
                <Card className="flex items-center gap-3 p-3 transition-colors hover:border-accent/40">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-paper">
                    {p.fotos?.[0] ? (
                      <Image src={p.fotos[0].url} alt={p.descricao} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-ink/25">
                        <Package size={20} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-code text-sm font-medium text-ink">{p.codigo}</p>
                    <p className="truncate text-xs text-ink/50">{p.descricao}</p>
                    {p.cliente && (
                      <p className="truncate text-[11px] text-accent">{p.cliente}</p>
                    )}
                    {(locationsByProduct.get(p.id) || []).length > 0 && (
                      <p className="font-code truncate text-[11px] text-ink/40">
                        {(locationsByProduct.get(p.id) || []).join(" · ")}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
