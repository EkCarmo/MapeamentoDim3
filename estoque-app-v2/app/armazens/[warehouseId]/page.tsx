"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { getWarehouse, deleteWarehouse } from "@/lib/db/warehouses";
import {
  listLocationsByWarehouse,
  createLocationsBatch,
  deleteLocation,
} from "@/lib/db/locations";
import Link from "next/link";
import { listAllocationsByLocation } from "@/lib/db/allocations";
import type { Warehouse, Location } from "@/lib/types";
import Button from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card, EmptyState } from "@/components/ui/Misc";

export default function WarehouseDetailPage() {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const router = useRouter();

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rua, setRua] = useState("");
  const [baia, setBaia] = useState("");
  const [nivel, setNivel] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyDeleteId, setBusyDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [wh, locs] = await Promise.all([
      getWarehouse(warehouseId),
      listLocationsByWarehouse(warehouseId),
    ]);
    setWarehouse(wh);
    setLocations(locs);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId]);

  const grouped = useMemo(() => {
    const map = new Map<string, Location[]>();
    for (const loc of locations) {
      const list = map.get(loc.rua) || [];
      list.push(loc);
      map.set(loc.rua, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [locations]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!warehouse || !rua.trim() || !baia.trim() || !nivel.trim()) return;
    setSaving(true);
    try {
      const { criadas, puladas } = await createLocationsBatch({
        warehouseId: warehouse.id,
        armazemCodigo: warehouse.codigo,
        rua,
        baias: baia,
        niveis: nivel,
      });
      if (puladas.length > 0) {
        alert(
          `${criadas.length} localização(ões) criada(s).\n` +
            `${puladas.length} já existia(m) e foi(ram) pulada(s): ${puladas.join(", ")}`
        );
      }
      setRua("");
      setBaia("");
      setNivel("");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Não foi possível criar as localizações.");
    } finally {
      setSaving(false);
      load();
    }
  }

  async function handleDeleteLocation(loc: Location) {
    const emUso = await listAllocationsByLocation(loc.id);
    if (emUso.length > 0) {
      alert(
        `Não é possível remover "${loc.codigo}": há ${emUso.length} produto(s) alocado(s) aqui. Transfira ou zere o material antes.`
      );
      return;
    }
    if (!confirm(`Remover a localização ${loc.codigo}?`)) return;
    setBusyDeleteId(loc.id);
    await deleteLocation(loc.id);
    setBusyDeleteId(null);
    load();
  }

  async function handleDeleteWarehouse() {
    if (locations.length > 0) {
      alert("Remova todas as ruas/baias/níveis deste armazém antes de excluí-lo.");
      return;
    }
    if (!confirm(`Excluir o armazém ${warehouse?.codigo}?`)) return;
    await deleteWarehouse(warehouseId);
    router.push("/armazens");
  }

  if (loading) return <p className="text-sm text-ink/40">Carregando…</p>;
  if (!warehouse) return <p className="text-sm text-ink/40">Armazém não encontrado.</p>;

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push("/armazens")}
        className="mb-4 flex items-center gap-1 text-sm text-ink/50 hover:text-ink"
      >
        <ChevronLeft size={16} /> Armazéns
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-code text-2xl font-700 text-ink">{warehouse.codigo}</h1>
          {warehouse.nome && <p className="mt-0.5 text-sm text-ink/50">{warehouse.nome}</p>}
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus size={16} /> Nova localização
        </Button>
      </div>

      {showForm && (
        <Card className="mt-5 p-5">
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Rua</Label>
              <Input placeholder="ex: H" value={rua} onChange={(e) => setRua(e.target.value)} required autoFocus />
            </div>
            <div>
              <Label>Baia(s)</Label>
              <Input placeholder="ex: A ou A,B,C" value={baia} onChange={(e) => setBaia(e.target.value)} required />
            </div>
            <div>
              <Label>Nível(is)</Label>
              <Input placeholder="ex: 1.2 ou 1.1,1.2,2.1" value={nivel} onChange={(e) => setNivel(e.target.value)} required />
            </div>
            <p className="text-xs text-ink/45 sm:col-span-3">
              Dica: separe por vírgula para criar várias de uma vez. Ex: baias{" "}
              <span className="font-code">A,B,C</span> × níveis{" "}
              <span className="font-code">1.1,1.2</span> cria 6 localizações.
            </p>
            <div className="flex gap-2 sm:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando…" : "Criar localização(ões)"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mt-6">
        {locations.length === 0 ? (
          <EmptyState
            title="Nenhuma rua/baia/nível cadastrado"
            description={`Adicione a primeira localização de ${warehouse.codigo}, ex: rua H, baia A, nível 1.2.`}
            action={
              <Button onClick={() => setShowForm(true)}>
                <Plus size={16} /> Nova localização
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {grouped.map(([ruaNome, locs]) => (
              <Card key={ruaNome} className="p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/45">
                  Rua {ruaNome}
                </p>
                <div className="flex flex-wrap gap-2">
                  {locs.map((loc) => (
                    <div
                      key={loc.id}
                      className="group flex items-center gap-2 rounded-sm border border-line bg-paper px-2.5 py-1.5 transition-colors hover:border-accent/40"
                    >
                      <Link
                        href={`/localizacoes/${loc.id}`}
                        className="font-code text-xs text-ink hover:text-accent"
                        title="Ver o que está nesta localização"
                      >
                        Baia {loc.baia} · Nível {loc.nivel}
                      </Link>
                      <button
                        onClick={() => handleDeleteLocation(loc)}
                        disabled={busyDeleteId === loc.id}
                        className="text-ink/25 hover:text-danger disabled:opacity-40"
                        title="Remover localização"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 border-t border-line pt-5">
        <Button variant="danger" onClick={handleDeleteWarehouse}>
          Excluir armazém
        </Button>
      </div>
    </div>
  );
}
