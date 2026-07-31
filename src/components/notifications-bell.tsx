import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "@tanstack/react-router";
import { dataBR } from "@/lib/mock-data";

export function NotificationsBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notificacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 15000, // Poll every 15s
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const unreadIds = notifications.filter((n: any) => !n.lida).map((n: any) => n.id);
      if (unreadIds.length === 0) return;
      
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true })
        .in("id", unreadIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });

  const unreadCount = notifications.filter((n: any) => !n.lida).length;

  const handleClick = (notif: any) => {
    if (!notif.lida) {
      markAsRead.mutate(notif.id);
    }
    if (notif.link) {
      // Basic routing mapping for relative links
      if (notif.link.startsWith("/briefings/")) {
        const id = notif.link.split("/").pop();
        navigate({ to: "/briefings/$id", params: { id } });
      } else {
        window.location.href = notif.link;
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2">
          <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllAsRead.mutate()}
            >
              <Check className="mr-1 h-3 w-3" /> Marcar lidas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação.
            </div>
          ) : (
            notifications.map((notif: any) => (
              <div
                key={notif.id}
                className={`flex flex-col gap-1 border-b p-4 last:border-0 cursor-pointer transition-colors hover:bg-muted/50 ${
                  notif.lida ? "opacity-70" : "bg-primary/5"
                }`}
                onClick={() => handleClick(notif)}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${notif.lida ? "font-medium" : "font-bold"}`}>
                    {notif.titulo}
                  </p>
                  {!notif.lida && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-snug">
                  {notif.mensagem}
                </p>
                <span className="mt-1 text-[10px] text-muted-foreground/70">
                  {notif.created_at ? new Date(notif.created_at).toLocaleString('pt-BR') : ""}
                </span>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
