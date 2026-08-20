"use client";

import { useEffect, useState } from "react";
import { listWarehouses } from "@/lib/db/warehouses";
import { listLocationsByWarehouse } from "@/lib/db/locations";
import type { Warehouse, Location } from "@/lib/types";
import { Label } from "@/components/ui/Input";

interface Props {
  onSelect: (location: Location | null) => void;
  /** oculta uma localização específica (ex: a de origem, numa transferência) */
  excludeLocationId?: string;
}

export default function LocationPicker({ onSelect, excludeLocationId }: Props) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState("");
  const [loadingLocations, setLoadingLocations] = useState(false);

  useEffect(() => {
    listWarehouses().then(setWarehouses);
  }, []);

  useEffect(() => {
    if (!warehouseId) {
      setLocations([]);
      return;
    }
    setLoadingLocations(true);
    listLocationsByWarehouse(warehouseId).then((locs) => {
      setLocations(locs);
      setLoadingLocations(false);
    });
  }, [warehouseId]);

  useEffect(() => {
    const loc = locations.find((l) => l.id === locationId) || null;
    onSelect(loc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  const visibleLocations = locations.filter((l) => l.id !== excludeLocationId);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label>Armazém</Label>
        <select
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          value={warehouseId}
          onChange={(e) => {
            setWarehouseId(e.target.value);
            setLocationId("");
          }}
        >
          <option value="">Selecione…</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.codigo}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Rua / Baia / Nível</Label>
        <select
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          disabled={!warehouseId || loadingLocations}
        >
          <option value="">
            {loadingLocations ? "Carregando…" : "Selecione…"}
          </option>
          {visibleLocations.map((l) => (
            <option key={l.id} value={l.id}>
              Rua {l.rua} · Baia {l.baia} · Nível {l.nivel}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
