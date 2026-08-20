"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Button from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Misc";

/**
 * Envolve toda a aplicação. Enquanto não houver usuário autenticado,
 * mostra uma tela de login em vez do conteúdo.
 *
 * As contas são criadas manualmente no console do Firebase
 * (Authentication > Users > Add user) — não há tela de cadastro aqui,
 * pois este é um sistema interno de uso restrito da equipe.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  // ainda verificando o estado de autenticação
  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-ink/40">Carregando…</p>
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <Card className="w-full max-w-sm p-6">
          <p className="font-display text-lg font-700 text-ink">Mapa de Estoque</p>
          <p className="mt-1 text-sm text-ink/50">Entre com sua conta para continuar.</p>

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export async function logout() {
  await signOut(auth);
}
