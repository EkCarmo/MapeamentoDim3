import clsx from "clsx";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-md border border-line bg-white", className)}>
      {children}
    </div>
  );
}

const badgeColors: Record<string, string> = {
  entrada: "bg-accentSoft text-accent",
  transferencia: "bg-amber-50 text-warn",
  saida: "bg-red-50 text-danger",
  contagem: "bg-sky-50 text-sky-700",
  default: "bg-paper text-ink/60",
};

export function MovementBadge({ tipo }: { tipo: string }) {
  const labels: Record<string, string> = {
    entrada: "Inclusão",
    transferencia: "Movimentação",
    saida: "Zerado",
    contagem: "Contagem",
  };
  return (
    <span
      className={clsx(
        "inline-flex rounded-sm px-2 py-0.5 text-xs font-medium",
        badgeColors[tipo] || badgeColors.default
      )}
    >
      {labels[tipo] || tipo}
    </span>
  );
}

/** Exibe "última contagem: data · usuário" ou "nunca contado" */
export function LastCount({
  em,
  por,
}: {
  em?: { toDate?: () => Date } | null;
  por?: string | null;
}) {
  if (!em || typeof em.toDate !== "function") {
    return <span className="text-[11px] text-warn">Nunca contado</span>;
  }
  return (
    <span className="text-[11px] text-ink/45">
      Contado em {em.toDate().toLocaleString("pt-BR")}
      {por ? ` · ${por}` : ""}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-line px-6 py-14 text-center">
      <p className="font-display text-base font-500 text-ink">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink/50">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
