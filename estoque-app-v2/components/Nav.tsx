"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Warehouse, Package, ArrowLeftRight, LayoutGrid, LogOut } from "lucide-react";
import clsx from "clsx";
import { logout } from "@/components/AuthGate";

const items = [
  { href: "/", label: "Painel", icon: LayoutGrid },
  { href: "/armazens", label: "Armazéns", icon: Warehouse },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/movimentacoes", label: "Movimentações", icon: ArrowLeftRight },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-line bg-white md:w-60 md:border-b-0 md:border-r md:min-h-screen">
      <div className="px-5 py-5 md:py-6">
        <div className="font-display text-lg font-700 tracking-tight text-ink">
          Mapa de Estoque
        </div>
        <div className="mt-0.5 text-xs text-ink/50">Armazéns &amp; Materiais</div>
      </div>
      <ul className="flex gap-1 px-3 pb-3 md:flex-col md:pb-6">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1 md:flex-none">
              <Link
                href={href}
                className={clsx(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accentSoft text-accent"
                    : "text-ink/60 hover:bg-paper hover:text-ink"
                )}
              >
                <Icon size={17} strokeWidth={2} />
                <span className="hidden md:inline">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="hidden px-3 pb-6 md:block">
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-ink/50 hover:bg-paper hover:text-ink"
        >
          <LogOut size={17} strokeWidth={2} />
          Sair
        </button>
      </div>
    </nav>
  );
}
