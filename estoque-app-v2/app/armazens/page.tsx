"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Warehouse as WarehouseIcon } from "lucide-react";
import { listWarehouses, createWarehouse } from "@/lib/db/warehouses";
import type { Warehouse } from "@/lib/types";
import Button from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card, EmptyState } from "@/components/ui/Misc";

export default function ArmazensPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setWarehouses(await listWarehouses());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) return;
    setSaving(true);
    await createWarehouse(codigo, nome);
    setCodigo("");
    setNome("");
    setShowForm(false);
    setSaving(false);
    load();
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-700 text-ink">Armazéns</h1>
          <p className="mt-1 text-sm text-ink/50">
            Cada armazém contém ruas, baias e níveis de armazenagem.
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus size={16} /> Novo armazém
        </Button>
      </div>

      {showForm && (
        <Card className="mt-5 p-5">
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Código do armazém</Label>
              <Input
                placeholder="ex: G5"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <Label>Nome (opcional)</Label>
              <Input
                placeholder="ex: Galpão 5"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando…" : "Criar armazém"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-ink/40">Carregando…</p>
        ) : warehouses.length === 0 ? (
          <EmptyState
            title="Nenhum armazém cadastrado"
            description="Crie o primeiro armazém para começar a organizar ruas, baias e níveis."
            action={
              <Button onClick={() => setShowForm(true)}>
                <Plus size={16} /> Novo armazém
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {warehouses.map((w) => (
              <Link key={w.id} href={`/armazens/${w.id}`}>
                <Card className="flex items-center gap-3 p-4 transition-colors hover:border-accent/40">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accentSoft text-accent">
                    <WarehouseIcon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-code text-sm font-medium text-ink">{w.codigo}</p>
                    {w.nome && <p className="truncate text-xs text-ink/50">{w.nome}</p>}
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
