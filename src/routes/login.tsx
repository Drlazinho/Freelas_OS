import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Code2, Github, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar · Freela.OS" },
      { name: "description", content: "Acesse sua conta no Freela.OS." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" }) as { redirect?: string };
  const { user } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate({ to: search.redirect || "/" });
    }
  }, [user, navigate, search.redirect]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Erro ao entrar", {
        description: error.message,
      });
      setLoading(false);
    } else {
      toast.success("Bem-vindo de volta!");
      // O useEffect do context vai pegar a mudança de sessão e redirecionar
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      }
    });
    if (error) {
      toast.error(`Erro ao logar com ${provider}`);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(600px 300px at 20% 10%, oklch(var(--primary) / 0.18), transparent), radial-gradient(500px 260px at 85% 90%, oklch(var(--chart-2) / 0.14), transparent)",
        }}
      />
      <Card className="relative z-10 w-full max-w-md p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Code2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Freela.OS</p>
            <p className="text-xs text-muted-foreground">Gestão para devs freelancers</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">Entrar na sua conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Continue de onde parou.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="outline" type="button" onClick={() => handleOAuthLogin('google')}>
            <Mail className="mr-2 h-4 w-4" /> Google
          </Button>
          <Button variant="outline" type="button" onClick={() => handleOAuthLogin('github')}>
            <Github className="mr-2 h-4 w-4" /> GitHub
          </Button>
        </div>

        <div className="my-6 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">ou com e-mail</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="voce@dev.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <button type="button" className="text-xs text-primary hover:underline" onClick={() => toast("Enviamos um link de recuperação")}>
                Esqueci minha senha
              </button>
            </div>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </Card>
    </div>
  );
}
