import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO, isToday, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarDays,
  CalendarPlus,
  CalendarCheck,
  Clock,
  MapPin,
  MessageCircle,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  CircleDashed,
  AlertCircle,
  Building2,
  FileText,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getAgendaStats,
  listEventosMes,
  listEventosDia,
  loadFormData,
  createEvento,
  updateEvento,
  deleteEvento,
  sendWhatsappLembrete,
  type AgendaEvento,
} from "@/lib/api/agenda.functions";

export const Route = createFileRoute("/agenda")({
  component: AgendaPage,
});

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPO_CFG = {
  reuniao:     { label: "Reunião",        color: "bg-blue-500",   text: "text-blue-600",   dot: "bg-blue-500"   },
  visita:      { label: "Visita Técnica", color: "bg-green-500",  text: "text-green-600",  dot: "bg-green-500"  },
  compromisso: { label: "Compromisso",    color: "bg-purple-500", text: "text-purple-600", dot: "bg-purple-500" },
  prazo:       { label: "Prazo",          color: "bg-red-500",    text: "text-red-600",    dot: "bg-red-500"    },
  lembrete:    { label: "Lembrete",       color: "bg-amber-500",  text: "text-amber-600",  dot: "bg-amber-500"  },
  outro:       { label: "Outro",          color: "bg-gray-400",   text: "text-gray-600",   dot: "bg-gray-400"   },
} as const;

const STATUS_CFG = {
  agendado:  { label: "Agendado",   variant: "outline" as const    },
  confirmado: { label: "Confirmado", variant: "default" as const   },
  cancelado: { label: "Cancelado",  variant: "destructive" as const },
  concluido: { label: "Concluído",  variant: "secondary" as const  },
} as const;

const MINUTOS_CFG = [
  { value: 15,   label: "15 minutos antes" },
  { value: 30,   label: "30 minutos antes" },
  { value: 60,   label: "1 hora antes"     },
  { value: 120,  label: "2 horas antes"    },
  { value: 1440, label: "1 dia antes"      },
];

// ─── Form Schema ──────────────────────────────────────────────────────────────

const formSchema = z.object({
  titulo:                  z.string().min(1, "Título obrigatório"),
  descricao:               z.string().optional().default(""),
  tipo:                    z.enum(["reuniao", "visita", "compromisso", "prazo", "lembrete", "outro"]).default("compromisso"),
  data_inicio:             z.string().min(1, "Data obrigatória"),
  hora_inicio:             z.string().default("09:00"),
  data_fim:                z.string().optional().default(""),
  hora_fim:                z.string().default("10:00"),
  dia_inteiro:             z.boolean().default(false),
  local:                   z.string().optional().default(""),
  status:                  z.enum(["agendado", "confirmado", "cancelado", "concluido"]).default("agendado"),
  prioridade:              z.enum(["alta", "normal", "baixa"]).default("normal"),
  cliente_id:              z.string().optional().default("none"),
  chamado_id:              z.string().optional().default("none"),
  os_id:                   z.string().optional().default("none"),
  notificar_whatsapp:      z.boolean().default(false),
  notificar_numero:        z.string().optional().default(""),
  notificar_minutos_antes: z.number().default(30),
});

type EventoForm = z.infer<typeof formSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDefaultValues(evento: AgendaEvento | null, defaultDate: Date): EventoForm {
  if (evento) {
    const localStart = new Date(evento.data_inicio);
    const localEnd = evento.data_fim ? new Date(evento.data_fim) : null;
    return {
      titulo:                  evento.titulo,
      descricao:               evento.descricao ?? "",
      tipo:                    evento.tipo,
      data_inicio:             format(localStart, "yyyy-MM-dd"),
      hora_inicio:             format(localStart, "HH:mm"),
      data_fim:                localEnd ? format(localEnd, "yyyy-MM-dd") : "",
      hora_fim:                localEnd ? format(localEnd, "HH:mm") : "10:00",
      dia_inteiro:             evento.dia_inteiro,
      local:                   evento.local ?? "",
      status:                  evento.status,
      prioridade:              evento.prioridade,
      cliente_id:              evento.cliente_id ?? "none",
      chamado_id:              evento.chamado_id ?? "none",
      os_id:                   evento.os_id ?? "none",
      notificar_whatsapp:      evento.notificar_whatsapp,
      notificar_numero:        evento.notificar_numero ?? "",
      notificar_minutos_antes: evento.notificar_minutos_antes,
    };
  }
  return {
    titulo: "", descricao: "", tipo: "compromisso",
    data_inicio: format(defaultDate, "yyyy-MM-dd"), hora_inicio: "09:00",
    data_fim: "", hora_fim: "10:00",
    dia_inteiro: false, local: "", status: "agendado", prioridade: "normal",
    cliente_id: "none", chamado_id: "none", os_id: "none",
    notificar_whatsapp: false, notificar_numero: "", notificar_minutos_antes: 30,
  };
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon: Icon }: {
  label: string; value: number; color: string; icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className={cn("flex items-center gap-2 text-sm mb-1", color)}>
        <Icon className="h-4 w-4" />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
    </div>
  );
}

// ─── EmptyDayState ────────────────────────────────────────────────────────────

function EmptyDayState({ date, onAdd }: { date: Date; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-card">
      <CalendarDays className="h-12 w-12 text-muted-foreground/25 mb-4" />
      <p className="font-medium text-muted-foreground">
        {isToday(date) ? "Nenhum evento hoje" : "Nenhum evento neste dia"}
      </p>
      <p className="text-sm text-muted-foreground/60 mt-1 mb-4">
        Clique para adicionar um evento neste dia
      </p>
      <Button variant="outline" onClick={onAdd} className="gap-2">
        <Plus className="h-4 w-4" />
        Adicionar evento
      </Button>
    </div>
  );
}

// ─── EventoCard ───────────────────────────────────────────────────────────────

function EventoCard({ evento, onEdit, onDelete, onStatusChange, onWhatsApp }: {
  evento: AgendaEvento;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  onWhatsApp: () => void;
}) {
  const tipoCfg = TIPO_CFG[evento.tipo] ?? TIPO_CFG.outro;
  const isConcluido = evento.status === "concluido";
  const isCancelado = evento.status === "cancelado";
  const isPast = isBefore(new Date(evento.data_inicio), new Date()) && !isConcluido && !isCancelado;

  const horaInicio = evento.dia_inteiro
    ? "Dia todo"
    : format(new Date(evento.data_inicio), "HH:mm");
  const horaFim =
    evento.data_fim && !evento.dia_inteiro
      ? ` – ${format(new Date(evento.data_fim), "HH:mm")}`
      : "";

  return (
    <div className={cn(
      "relative rounded-xl border bg-card overflow-hidden transition-opacity",
      (isConcluido || isCancelado) && "opacity-60",
    )}>
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", tipoCfg.color)} />

      <div className="pl-5 pr-4 py-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={cn("text-xs font-normal", tipoCfg.text)}>
              {tipoCfg.label}
            </Badge>
            {evento.prioridade === "alta" && (
              <Badge variant="destructive" className="text-xs">Alta prioridade</Badge>
            )}
            <Badge variant={STATUS_CFG[evento.status].variant} className="text-xs">
              {STATUS_CFG[evento.status].label}
            </Badge>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {evento.notificar_whatsapp && (
              <Button
                variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700"
                title="Enviar lembrete via WhatsApp"
                onClick={onWhatsApp}
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              title={isConcluido ? "Reabrir" : "Marcar como concluído"}
              onClick={() => onStatusChange(isConcluido ? "agendado" : "concluido")}
            >
              {isConcluido
                ? <CircleDashed className="h-3.5 w-3.5" />
                : <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              }
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <p className={cn("font-semibold text-sm", (isConcluido || isCancelado) && "line-through text-muted-foreground")}>
          {evento.titulo}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {horaInicio}{horaFim}
          </span>
          {evento.local && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {evento.local}
            </span>
          )}
          {evento.cliente_nome && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {evento.cliente_nome}
            </span>
          )}
          {evento.chamado_numero && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {evento.chamado_numero}
            </span>
          )}
          {evento.os_numero && (
            <span className="flex items-center gap-1">
              <Wrench className="h-3 w-3" />
              {evento.os_numero}
            </span>
          )}
          {isPast && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-3 w-3" />
              Atrasado
            </span>
          )}
        </div>

        {evento.descricao && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{evento.descricao}</p>
        )}
      </div>
    </div>
  );
}

// ─── EventoDialog ─────────────────────────────────────────────────────────────

function EventoDialog({ open, onOpenChange, evento, defaultDate, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evento: AgendaEvento | null;
  defaultDate: Date;
  onSuccess: () => void;
}) {
  const { data: formData } = useQuery({
    queryKey: ["agenda-form-data"],
    queryFn: () => loadFormData(),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const form = useForm<EventoForm>({
    resolver: zodResolver(formSchema),
    defaultValues: buildDefaultValues(null, defaultDate),
  });

  useEffect(() => {
    if (open) form.reset(buildDefaultValues(evento, defaultDate));
  }, [open, evento?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const diaInteiro = form.watch("dia_inteiro");
  const notificarWA = form.watch("notificar_whatsapp");

  const saveMutation = useMutation({
    mutationFn: async (values: EventoForm) => {
      const isoStart = values.dia_inteiro
        ? new Date(`${values.data_inicio}T00:00:00`).toISOString()
        : new Date(`${values.data_inicio}T${values.hora_inicio}:00`).toISOString();

      const isoEnd = values.data_fim
        ? values.dia_inteiro
          ? new Date(`${values.data_fim}T23:59:59`).toISOString()
          : new Date(`${values.data_fim}T${values.hora_fim}:00`).toISOString()
        : null;

      const payload = {
        titulo:                  values.titulo,
        descricao:               values.descricao || null,
        tipo:                    values.tipo,
        data_inicio:             isoStart,
        data_fim:                isoEnd,
        dia_inteiro:             values.dia_inteiro,
        local:                   values.local || null,
        status:                  values.status,
        prioridade:              values.prioridade,
        cliente_id:              values.cliente_id === "none" ? null : values.cliente_id || null,
        chamado_id:              values.chamado_id === "none" ? null : values.chamado_id || null,
        os_id:                   values.os_id === "none" ? null : values.os_id || null,
        notificar_whatsapp:      values.notificar_whatsapp,
        notificar_numero:        values.notificar_numero || null,
        notificar_minutos_antes: values.notificar_minutos_antes,
      };

      if (evento) {
        return updateEvento({ data: { id: evento.id, ...payload } });
      }
      return createEvento({ data: payload });
    },
    onSuccess: () => {
      toast.success(evento ? "Evento atualizado" : "Evento criado");
      onSuccess();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{evento ? "Editar Evento" : "Novo Evento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="flex flex-col gap-5">
          {/* Título */}
          <div className="grid gap-1.5">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" {...form.register("titulo")} placeholder="Ex: Reunião de alinhamento" />
            {form.formState.errors.titulo && (
              <p className="text-xs text-destructive">{form.formState.errors.titulo.message}</p>
            )}
          </div>

          {/* Tipo + Prioridade + Status */}
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label>Tipo</Label>
              <Controller control={form.control} name="tipo" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_CFG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="grid gap-1.5">
              <Label>Prioridade</Label>
              <Controller control={form.control} name="prioridade" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Controller control={form.control} name="status" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>

          {/* Dia inteiro */}
          <div className="flex items-center gap-3">
            <Controller control={form.control} name="dia_inteiro" render={({ field }) => (
              <Switch id="dia_inteiro" checked={field.value} onCheckedChange={field.onChange} />
            )} />
            <Label htmlFor="dia_inteiro" className="cursor-pointer">Dia inteiro</Label>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Data início *</Label>
              <Input type="date" {...form.register("data_inicio")} />
              {form.formState.errors.data_inicio && (
                <p className="text-xs text-destructive">{form.formState.errors.data_inicio.message}</p>
              )}
            </div>
            {!diaInteiro && (
              <div className="grid gap-1.5">
                <Label>Hora início</Label>
                <Input type="time" {...form.register("hora_inicio")} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Data fim</Label>
              <Input type="date" {...form.register("data_fim")} />
            </div>
            {!diaInteiro && (
              <div className="grid gap-1.5">
                <Label>Hora fim</Label>
                <Input type="time" {...form.register("hora_fim")} />
              </div>
            )}
          </div>

          {/* Local */}
          <div className="grid gap-1.5">
            <Label>Local</Label>
            <Input {...form.register("local")} placeholder="Ex: Escritório, Zoom, Rua..." />
          </div>

          {/* Descrição */}
          <div className="grid gap-1.5">
            <Label>Descrição</Label>
            <Textarea
              {...form.register("descricao")}
              placeholder="Detalhes adicionais..."
              className="resize-none"
              rows={3}
            />
          </div>

          <Separator />

          {/* Vincular a */}
          <div>
            <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide text-xs">
              Vincular a
            </p>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Cliente
                </Label>
                <Controller control={form.control} name="cliente_id" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {(formData?.clientes ?? []).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>

              <div className="grid gap-1.5">
                <Label className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Chamado de suporte
                </Label>
                <Controller control={form.control} name="chamado_id" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {(formData?.chamados ?? []).map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.numero_formatado} — {c.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>

              <div className="grid gap-1.5">
                <Label className="flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                  Ordem de serviço
                </Label>
                <Controller control={form.control} name="os_id" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {(formData?.os ?? []).map(o => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.numero_formatado}{o.descricao ? ` — ${o.descricao.substring(0, 40)}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>
          </div>

          <Separator />

          {/* WhatsApp notification */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Controller control={form.control} name="notificar_whatsapp" render={({ field }) => (
                <Switch id="notificar_whatsapp" checked={field.value} onCheckedChange={field.onChange} />
              )} />
              <Label htmlFor="notificar_whatsapp" className="cursor-pointer flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-green-600" />
                Notificação via WhatsApp
              </Label>
            </div>

            {notificarWA && (
              <div className="grid grid-cols-2 gap-3 pl-3 border-l-2 border-green-500/30">
                <div className="grid gap-1.5">
                  <Label>Número de destino</Label>
                  <Input
                    {...form.register("notificar_numero")}
                    placeholder="5511999999999"
                  />
                  <p className="text-xs text-muted-foreground">Formato internacional sem + ou espaços</p>
                </div>
                <div className="grid gap-1.5">
                  <Label>Enviar com antecedência de</Label>
                  <Controller control={form.control} name="notificar_minutos_antes" render={({ field }) => (
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MINUTOS_CFG.map(m => (
                          <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : evento ? "Salvar alterações" : "Criar evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── AgendaPage ───────────────────────────────────────────────────────────────

function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<AgendaEvento | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const ano = currentMonth.getFullYear();
  const mes = currentMonth.getMonth() + 1;

  const { data: stats } = useQuery({
    queryKey: ["agenda-stats"],
    queryFn: () => getAgendaStats(),
    staleTime: 60_000,
  });

  const { data: eventosMes = [] } = useQuery({
    queryKey: ["agenda-mes", ano, mes],
    queryFn: () => listEventosMes({ data: { ano, mes } }),
    staleTime: 60_000,
  });

  const { data: eventosDia = [], isLoading: loadingDia } = useQuery({
    queryKey: ["agenda-dia", selectedDateStr],
    queryFn: () => listEventosDia({ data: { data: selectedDateStr } }),
    staleTime: 30_000,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["agenda-mes"] });
    queryClient.invalidateQueries({ queryKey: ["agenda-dia"] });
    queryClient.invalidateQueries({ queryKey: ["agenda-stats"] });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEvento({ data: { id } }),
    onSuccess: () => {
      invalidateAll();
      setDeleteId(null);
      toast.success("Evento removido");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateEvento({ data: { id, status: status as AgendaEvento["status"] } }),
    onSuccess: () => invalidateAll(),
  });

  const whatsappMutation = useMutation({
    mutationFn: (id: string) => sendWhatsappLembrete({ data: { id } }),
    onSuccess: () => toast.success("Lembrete enviado via WhatsApp"),
    onError: (err: Error) => toast.error(err.message),
  });

  // Dias com eventos para marcar no calendário
  const daysWithEvents = useMemo(() => {
    const seen = new Set<string>();
    const dates: Date[] = [];
    for (const e of eventosMes) {
      const day = e.data_inicio.substring(0, 10);
      if (!seen.has(day)) {
        seen.add(day);
        dates.push(parseISO(day));
      }
    }
    return dates;
  }, [eventosMes]);

  const openCreate = (date?: Date) => {
    if (date) setSelectedDate(date);
    setEditingEvento(null);
    setDialogOpen(true);
  };

  const openEdit = (evento: AgendaEvento) => {
    setEditingEvento(evento);
    setDialogOpen(true);
  };

  const selectedIsToday = isToday(selectedDate);

  return (
    <AppShell>
      <div className="flex flex-col gap-6 p-4 md:p-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-teal-500" />
            <h1 className="text-2xl font-bold">Agenda</h1>
          </div>
          <Button onClick={() => openCreate()} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Evento
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Hoje" value={stats?.hoje ?? 0} color="text-blue-600" icon={CalendarCheck} />
          <StatCard label="Próximos 7 dias" value={stats?.semana ?? 0} color="text-green-600" icon={CalendarDays} />
          <StatCard label="Atrasados" value={stats?.atrasados ?? 0} color="text-destructive" icon={AlertCircle} />
          <StatCard label="Concluídos" value={stats?.concluidos ?? 0} color="text-muted-foreground" icon={CheckCircle2} />
        </div>

        {/* Main: calendar + day view */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">

          {/* Left column */}
          <div className="flex flex-col gap-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              onMonthChange={setCurrentMonth}
              locale={ptBR}
              className="rounded-xl border bg-card p-3 w-full"
              modifiers={{ hasEvent: daysWithEvents }}
              modifiersClassNames={{ hasEvent: "font-bold text-primary underline decoration-dotted" }}
            />

            {/* Legenda */}
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Tipos de evento
              </p>
              <div className="flex flex-col gap-2">
                {Object.entries(TIPO_CFG).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0", cfg.color)} />
                    <span className="text-muted-foreground">{cfg.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold capitalize">
                  {selectedIsToday && "Hoje — "}
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {loadingDia
                    ? "Carregando..."
                    : eventosDia.length === 0
                      ? "Nenhum evento"
                      : `${eventosDia.length} evento${eventosDia.length > 1 ? "s" : ""}`
                  }
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => openCreate(selectedDate)}>
                <CalendarPlus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>

            {loadingDia ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                Carregando eventos...
              </div>
            ) : eventosDia.length === 0 ? (
              <EmptyDayState date={selectedDate} onAdd={() => openCreate(selectedDate)} />
            ) : (
              <div className="flex flex-col gap-3">
                {eventosDia.map((evento) => (
                  <EventoCard
                    key={evento.id}
                    evento={evento}
                    onEdit={() => openEdit(evento)}
                    onDelete={() => setDeleteId(evento.id)}
                    onStatusChange={(status) => statusMutation.mutate({ id: evento.id, status })}
                    onWhatsApp={() => whatsappMutation.mutate(evento.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit dialog */}
      <EventoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        evento={editingEvento}
        defaultDate={selectedDate}
        onSuccess={() => {
          invalidateAll();
          setDialogOpen(false);
        }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover evento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
