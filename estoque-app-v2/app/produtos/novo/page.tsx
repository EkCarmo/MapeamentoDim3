"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createProduct, updateProduct } from "@/lib/db/products";
import { uploadProductPhoto } from "@/lib/db/photos";
import PhotoPicker from "@/components/products/PhotoPicker";
import Button from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Misc";

export default function NovoProdutoPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cliente, setCliente] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim() || !descricao.trim()) return;
    setSaving(true);

    try {
      setStep("Criando produto…");
      const ref = await createProduct({ codigo, descricao, cliente, observacoes });

      if (photoFiles.length > 0) {
        setStep("Enviando fotos…");
        const fotos = await Promise.all(
          photoFiles.map((file) => uploadProductPhoto(ref.id, file))
        );
        await updateProduct(ref.id, { fotos });
      }

      router.push(`/produtos/${ref.id}`);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Não foi possível salvar o produto. Tente novamente.");
      setSaving(false);
      setStep(null);
    }
  }

  return (
    <div className="max-w-xl">
      <button
        onClick={() => router.push("/produtos")}
        className="mb-4 flex items-center gap-1 text-sm text-ink/50 hover:text-ink"
      >
        <ChevronLeft size={16} /> Produtos
      </button>

      <h1 className="font-display text-2xl font-700 text-ink">Novo produto</h1>

      <Card className="mt-5 p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Código</Label>
            <Input
              placeholder="ex: PRD-0231"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Input
              placeholder="ex: Chapa de aço 2mm 1x2m"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Cliente</Label>
            <Input
              placeholder="ex: VIAPOL (a quem o material pertence — opcional)"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
            />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea
              rows={3}
              placeholder="Detalhes, cuidados de manuseio, etc. (opcional)"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
          <div>
            <Label>Fotos</Label>
            <PhotoPicker onChange={setPhotoFiles} />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? step || "Salvando…" : "Salvar produto"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push("/produtos")}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
