"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, MapPin, Plus, ArrowLeftRight, Split, XCircle, Trash2, ClipboardCheck } from "lucide-react";
import { getProduct, updateProduct, deleteProduct } from "@/lib/db/products";
import { deleteProductPhoto, uploadProductPhoto } from "@/lib/db/photos";
import { listAllocationsByProduct, registrarContagem } from "@/lib/db/allocations";
import { listMovementsByProduct } from "@/lib/db/movements";
import type { Product, Allocation, Movement } from "@/lib/types";
import Button from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Card, EmptyState, MovementBadge, LastCount } from "@/components/ui/Misc";
import PhotoPicker from "@/components/products/PhotoPicker";
import AllocationActionPanel, { ActionMode } from "@/components/products/AllocationActionPanel";

export default function ProdutoDetalhePage() {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMode, setActionMode] = useState<ActionMode | null>(null);

  // edição inline de dados cadastrais
  const [editing, setEditing] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cliente, setCliente] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [countingId, setCountingId] = useState<string | null>(null);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, allocs, movs] = await Promise.all([
      getProduct(productId),
      listAllocationsByProduct(productId),
      listMovementsByProduct(productId),
    ]);
    setProduct(p);
    setAllocations(allocs);
    setMovements(movs);
    if (p) {
      setCodigo(p.codigo);
      setDescricao(p.descricao);
      setCliente(p.cliente || "");
      setObservacoes(p.observacoes || "");
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveEdit() {
    if (!product) return;
    setSavingEdit(true);
    try {
      let fotos = product.fotos;
      if (newPhotos.length > 0) {
        const uploaded = await Promise.all(
          newPhotos.map((f) => uploadProductPhoto(product.id, f))
        );
        fotos = [...fotos, ...uploaded];
      }
      await updateProduct(product.id, { codigo, descricao, cliente, observacoes, fotos });
      setNewPhotos([]);
      setEditing(false);
      load();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Não foi possível salvar as alterações.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleRemovePhoto(idx: number) {
    if (!product) return;
    const photo = product.fotos[idx];
    if (!confirm("Remover esta foto?")) return;
    const fotos = product.fotos.filter((_, i) => i !== idx);
    await updateProduct(product.id, { fotos });
    await deleteProductPhoto(photo.path);
    load();
  }

  async function handleDeleteProduct() {
    if (!product) return;
    if (allocations.length > 0) {
      alert("Zere todas as localizações deste produto antes de excluí-lo.");
      return;
    }
    if (!confirm(`Excluir o produto ${product.codigo}? Isso não apaga o histórico de movimentações.`))
      return;
    try {
      await deleteProduct(product.id); // já apaga as fotos do Storage e valida alocações
      router.push("/produtos");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Não foi possível excluir o produto.");
    }
  }

  async function handleContagem(a: Allocation) {
    if (!product) return;
    setCountingId(a.id);
    try {
      await registrarContagem({
        allocationId: a.id,
        productId: product.id,
        productCodigo: product.codigo,
        locationId: a.locationId,
        locationCodigo: a.locationCodigo,
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
  if (!product) return <p className="text-sm text-ink/40">Produto não encontrado.</p>;

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push("/produtos")}
        className="mb-4 flex items-center gap-1 text-sm text-ink/50 hover:text-ink"
      >
        <ChevronLeft size={16} /> Produtos
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-code text-2xl font-700 text-ink">{product.codigo}</h1>
          <p className="mt-0.5 text-sm text-ink/60">{product.descricao}</p>
          {product.cliente && (
            <p className="mt-0.5 text-sm text-accent">Cliente: {product.cliente}</p>
          )}
        </div>
        {!editing && (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Editar
          </Button>
        )}
      </div>

      {editing ? (
        <Card className="mt-5 p-5">
          <div className="space-y-4">
            <div>
              <Label>Código</Label>
              <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
            <div>
              <Label>Cliente</Label>
              <Input
                placeholder="a quem o material pertence (opcional)"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </div>

            <div>
              <Label>Fotos atuais</Label>
              <div className="flex flex-wrap gap-2">
                {product.fotos.map((foto, idx) => (
                  <div key={foto.path} className="group relative h-20 w-20 overflow-hidden rounded-sm border border-line">
                    <Image src={foto.url} alt="" fill className="object-cover" />
                    <button
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Adicionar novas fotos</Label>
              <PhotoPicker onChange={setNewPhotos} />
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? "Salvando…" : "Salvar alterações"}
              </Button>
              <Button variant="secondary" onClick={() => setEditing(false)} disabled={savingEdit}>
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {product.fotos.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {product.fotos.map((foto) => (
                <div key={foto.path} className="relative h-24 w-24 overflow-hidden rounded-sm border border-line">
                  <Image src={foto.url} alt={product.descricao} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}

          {product.observacoes && (
            <Card className="mt-5 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink/45">Observações</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink/75">{product.observacoes}</p>
            </Card>
          )}
        </>
      )}

      {/* Localizações atuais */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-700 text-ink">Onde está</h2>
          <Button variant="secondary" onClick={() => setActionMode({ type: "entrada" })}>
            <Plus size={15} /> Incluir em localização
          </Button>
        </div>

        {allocations.length === 0 ? (
          <EmptyState
            title="Sem localização registrada"
            description="Inclua este produto em uma rua/baia/nível do armazém."
          />
        ) : (
          <div className="space-y-2">
            {allocations.map((a) => (
              <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <MapPin size={16} className="text-accent" />
                    <span className="font-code text-sm text-ink">{a.locationCodigo}</span>
                    {a.observacoes && (
                      <span className="text-xs text-ink/40">— {a.observacoes}</span>
                    )}
                  </div>
                  <div className="mt-0.5 pl-[26px]">
                    <LastCount em={a.ultimaContagemEm} por={a.ultimaContagemPor} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant="ghost"
                    onClick={() => handleContagem(a)}
                    disabled={countingId === a.id}
                  >
                    <ClipboardCheck size={14} />
                    {countingId === a.id ? "Registrando…" : "Contagem"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setActionMode({ type: "transferir", allocation: a })}
                  >
                    <ArrowLeftRight size={14} /> Transferir
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setActionMode({ type: "dividir", allocation: a })}
                  >
                    <Split size={14} /> Dividir
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-danger hover:bg-danger/5"
                    onClick={() => setActionMode({ type: "zerar", allocation: a })}
                  >
                    <XCircle size={14} /> Zerar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {actionMode && (
          <div className="mt-3">
            <AllocationActionPanel
              mode={actionMode}
              product={product}
              onCancel={() => setActionMode(null)}
              onDone={() => {
                setActionMode(null);
                load();
              }}
            />
          </div>
        )}
      </div>

      {/* Histórico de movimentações */}
      <div className="mt-8">
        <h2 className="mb-3 font-display text-base font-700 text-ink">Histórico de movimentações</h2>
        <Card>
          {movements.length === 0 ? (
            <p className="p-5 text-sm text-ink/40">Nenhuma movimentação registrada ainda.</p>
          ) : (
            <ul className="divide-y divide-line">
              {movements.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="font-code truncate text-xs text-ink/60">
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
          )}
        </Card>
      </div>

      <div className="mt-10 border-t border-line pt-5">
        <Button variant="danger" onClick={handleDeleteProduct}>
          Excluir produto
        </Button>
      </div>
    </div>
  );
}
