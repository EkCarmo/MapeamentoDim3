"use client";

import { useState } from "react";
import type { Allocation, Location, Product } from "@/lib/types";
import {
  registrarEntrada,
  transferirTotal,
  dividirEmNovaBaia,
  zerarAlocacao,
} from "@/lib/db/allocations";
import LocationPicker from "@/components/products/LocationPicker";
import Button from "@/components/ui/Button";
import { Textarea, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Misc";

export type ActionMode =
  | { type: "entrada" }
  | { type: "transferir"; allocation: Allocation }
  | { type: "dividir"; allocation: Allocation }
  | { type: "zerar"; allocation: Allocation };

const titles: Record<ActionMode["type"], string> = {
  entrada: "Incluir em uma localização",
  transferir: "Transferir totalmente",
  dividir: "Dividir para outra baia",
  zerar: "Zerar localização",
};

const helpText: Record<ActionMode["type"], string> = {
  entrada: "O produto passa a existir na localização selecionada.",
  transferir: "O produto sai completamente da localização atual e passa a existir apenas na nova.",
  dividir: "O produto passa a existir também na nova localização, mantendo a atual.",
  zerar: "Registra que o produto não está mais nesta localização (sem indicar destino).",
};

export default function AllocationActionPanel({
  mode,
  product,
  onDone,
  onCancel,
}: {
  mode: ActionMode;
  product: Product;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [destino, setDestino] = useState<Location | null>(null);
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    setSaving(true);
    try {
      if (mode.type === "entrada") {
        if (!destino) return;
        await registrarEntrada({
          productId: product.id,
          productCodigo: product.codigo,
          locationId: destino.id,
          locationCodigo: destino.codigo,
          observacoes,
        });
      } else if (mode.type === "transferir") {
        if (!destino) return;
        await transferirTotal({
          allocationId: mode.allocation.id,
          productId: product.id,
          productCodigo: product.codigo,
          origemLocationId: mode.allocation.locationId,
          origemCodigo: mode.allocation.locationCodigo,
          destinoLocationId: destino.id,
          destinoCodigo: destino.codigo,
          observacoes,
        });
      } else if (mode.type === "dividir") {
        if (!destino) return;
        await dividirEmNovaBaia({
          productId: product.id,
          productCodigo: product.codigo,
          origemLocationId: mode.allocation.locationId,
          origemCodigo: mode.allocation.locationCodigo,
          destinoLocationId: destino.id,
          destinoCodigo: destino.codigo,
          observacoes,
        });
      } else if (mode.type === "zerar") {
        await zerarAlocacao({
          allocationId: mode.allocation.id,
          productId: product.id,
          productCodigo: product.codigo,
          locationId: mode.allocation.locationId,
          locationCodigo: mode.allocation.locationCodigo,
          observacoes,
        });
      }
      onDone();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Não foi possível concluir a ação. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const needsDestination = mode.type !== "zerar";
  const canConfirm = mode.type === "zerar" ? true : !!destino;

  return (
    <Card className="p-5">
      <p className="font-display text-sm font-700 text-ink">{titles[mode.type]}</p>
      <p className="mt-1 text-xs text-ink/50">{helpText[mode.type]}</p>

      {mode.type !== "entrada" && "allocation" in mode && (
        <p className="font-code mt-3 inline-block rounded-sm bg-paper px-2 py-1 text-xs text-ink/70">
          Origem: {mode.allocation.locationCodigo}
        </p>
      )}

      <div className="mt-4 space-y-4">
        {needsDestination && (
          <LocationPicker
            onSelect={setDestino}
            excludeLocationId={"allocation" in mode ? mode.allocation.locationId : undefined}
          />
        )}
        <div>
          <Label>Observações {mode.type === "zerar" ? "(ex: motivo)" : "(opcional)"}</Label>
          <Textarea
            rows={2}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder={mode.type === "zerar" ? "ex: expedido, consumido, avariado…" : ""}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          onClick={handleConfirm}
          disabled={!canConfirm || saving}
          variant={mode.type === "zerar" ? "danger" : "primary"}
        >
          {saving ? "Salvando…" : "Confirmar"}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </Card>
  );
}
