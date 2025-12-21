import { useEffect, useState, ChangeEvent, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Scissors,
  Plus,
  Trash2,
  Save,
  Building2,
  Upload,
  Link2,
  Download,
  Palette,
  Sparkles,
  Images,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/layout/Layout";
import { Servico, ConfiguracoesBarbearia, DaySchedule } from "@/data/mockData";
import {
  fetchServicos,
  fetchConfiguracoes,
  updateConfiguracoes,
  createServico,
  deleteServico,
  formatarPreco,
} from "@/services/agendaService";
import {
  fetchEmpresa,
  updateEmpresa,
  requestTelegramLink,
  verifyTelegramLink,
  type EmpresaInfo,
} from "@/services/companyService";
import {
  fetchWhatsappSession,
  logoutWhatsappSession,
  normalizeQrCode,
  startWhatsappSession,
} from "@/services/whatsappService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BrandTheme, DEFAULT_CLIENT_THEME, DEFAULT_DASHBOARD_THEME, sanitizeTheme, isValidHexColor } from "@/lib/theme";
import { useTheme } from "@/contexts/ThemeContext";

const weekDays = [
  { key: "monday", label: "Segunda-feira" },
  { key: "tuesday", label: "Terça-feira" },
  { key: "wednesday", label: "Quarta-feira" },
  { key: "thursday", label: "Quinta-feira" },
  { key: "friday", label: "Sexta-feira" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
] as const;

type WeekDayKey = (typeof weekDays)[number]["key"];
type WeeklyScheduleState = Record<WeekDayKey, DaySchedule>;

const createWeeklyScheduleState = (
  base?: ConfiguracoesBarbearia["weeklySchedule"],
  fallbackStart = "09:00",
  fallbackEnd = "19:00",
): WeeklyScheduleState =>
  weekDays.reduce((acc, day) => {
    const config = base?.[day.key];
    acc[day.key] = {
      enabled: config?.enabled ?? true,
      start: config?.start ?? fallbackStart,
      end: config?.end ?? fallbackEnd,
      lunchEnabled: config?.lunchEnabled ?? false,
      lunchStart: config?.lunchStart ?? null,
      lunchEnd: config?.lunchEnd ?? null,
    };
    return acc;
  }, {} as WeeklyScheduleState);

const minutesFromTime = (value?: string | null) => {
  if (!value) return 0;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const getApiErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed === "object" && "message" in parsed) {
        const message = (parsed as { message?: string }).message;
        if (message) {
          return message;
        }
      }
    } catch {
      // ignore JSON parse errors
    }
    return error.message;
  }

  if (typeof error === "string") {
    try {
      const parsed = JSON.parse(error);
      if (parsed && typeof parsed === "object" && "message" in parsed) {
        const message = (parsed as { message?: string }).message;
        if (message) {
          return message;
        }
      }
    } catch {
      return error;
    }
  }

  return "Tente novamente.";
};

export default function Configuracoes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateCompany } = useAuth();
  const { setPalette } = useTheme();

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesBarbearia | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [horarioInicio, setHorarioInicio] = useState("09:00");
  const [horarioFim, setHorarioFim] = useState("19:00");
  const [intervalo, setIntervalo] = useState("30");
  const [diasBloqueados, setDiasBloqueados] = useState<Date[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleState>(() => createWeeklyScheduleState());
  const [selectedDay, setSelectedDay] = useState<WeekDayKey>("monday");

  // Novo serviço
  const [novoServicoNome, setNovoServicoNome] = useState("");
  const [novoServicoPreco, setNovoServicoPreco] = useState("");
  const [novoServicoDuracao, setNovoServicoDuracao] = useState("30");

  // Empresa
  const [empresa, setEmpresa] = useState<EmpresaInfo | null>(null);
  const [empresaNome, setEmpresaNome] = useState("");
  const [empresaDescricao, setEmpresaDescricao] = useState("");
  const [iconePreview, setIconePreview] = useState<string | null>(null);
  const [iconeFile, setIconeFile] = useState<File | null>(null);
  const [iconeTempUrl, setIconeTempUrl] = useState<string | null>(null);
  type GalleryUpload = { id: string; file: File; preview: string };
  type ExistingGalleryPhoto = { url: string; path: string | null };
  const [galleryExisting, setGalleryExisting] = useState<ExistingGalleryPhoto[]>([]);
  const [galleryPending, setGalleryPending] = useState<GalleryUpload[]>([]);
  const [galleryRemoved, setGalleryRemoved] = useState<string[]>([]);
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);
  const galleryPendingRef = useRef<GalleryUpload[]>([]);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyTelegram, setNotifyTelegram] = useState("");
  const [notifyViaEmail, setNotifyViaEmail] = useState(false);
  const [notifyViaTelegram, setNotifyViaTelegram] = useState(false);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState("");
  const [notifyViaWhatsapp, setNotifyViaWhatsapp] = useState(false);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  const [telegramLinkLoading, setTelegramLinkLoading] = useState(false);
  const [telegramVerifyLoading, setTelegramVerifyLoading] = useState(false);
  const [dashboardThemeState, setDashboardThemeState] = useState<BrandTheme>(DEFAULT_DASHBOARD_THEME);
  const [clientThemeState, setClientThemeState] = useState<BrandTheme>(DEFAULT_CLIENT_THEME);
  const [whatsappStatus, setWhatsappStatus] = useState("desconectado");
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappQrCode, setWhatsappQrCode] = useState<string | null>(null);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [whatsappInfo, setWhatsappInfo] = useState<{ phone?: string | null; pushname?: string | null }>({});
  const [whatsappSessionId, setWhatsappSessionId] = useState<string | null>(null);

  const themeFields: Array<{ key: keyof BrandTheme; label: string; description: string }> = [
    { key: "primary", label: "Cor primária", description: "Botões, links e destaques" },
    { key: "secondary", label: "Cor secundária", description: "Elementos de apoio e estados" },
    { key: "background", label: "Fundo", description: "Plano de fundo principal" },
    { key: "surface", label: "Cartões e superfícies", description: "Cards, modais e listas" },
    { key: "text", label: "Texto", description: "Cor predominante de textos" },
    { key: "accent", label: "Realces", description: "Bordas, badges e indicadores" },
  ];

  const applyThemePreview = (type: "dashboard" | "client", theme: BrandTheme) => {
    setPalette(type, theme);
  };

  const renderThemeGrid = (type: "dashboard" | "client", theme: BrandTheme) => (
    <div className="grid gap-4 lg:grid-cols-2">
      {themeFields.map((field) => (
        <div key={`${type}-${field.key}`} className="space-y-2">
          <Label>{field.label}</Label>
          <div className="flex items-center gap-3">
            <Input
              type="color"
              value={theme[field.key]}
              onChange={(event) => handleThemeColorChange(type, field.key, event.target.value)}
              className="h-10 w-16 cursor-pointer rounded-md border p-1"
            />
            <Input
              value={theme[field.key]}
              onChange={(event) => handleThemeTextChange(type, field.key, event.target.value)}
              placeholder="#000000"
            />
          </div>
          <p className="text-xs text-muted-foreground">{field.description}</p>
        </div>
      ))}
    </div>
  );

  const handleThemeColorChange = (type: "dashboard" | "client", key: keyof BrandTheme, value: string) => {
    const normalized = value.toUpperCase();
    if (type === "dashboard") {
      const updated = { ...dashboardThemeState, [key]: normalized };
      setDashboardThemeState(updated);
      applyThemePreview("dashboard", updated);
    } else {
      const updated = { ...clientThemeState, [key]: normalized };
      setClientThemeState(updated);
      applyThemePreview("client", updated);
    }
  };

  const handleThemeTextChange = (type: "dashboard" | "client", key: keyof BrandTheme, value: string) => {
    const hex = value.startsWith("#") ? value.toUpperCase() : `#${value.toUpperCase()}`;
    if (type === "dashboard") {
      setDashboardThemeState((prev) => ({ ...prev, [key]: hex }));
      if (isValidHexColor(hex)) {
        applyThemePreview("dashboard", { ...dashboardThemeState, [key]: hex });
      }
    } else {
      setClientThemeState((prev) => ({ ...prev, [key]: hex }));
      if (isValidHexColor(hex)) {
        applyThemePreview("client", { ...clientThemeState, [key]: hex });
      }
    }
  };

  useEffect(() => {
    galleryPendingRef.current = galleryPending;
  }, [galleryPending]);

  const handleToggleDay = (day: WeekDayKey, enabled: boolean) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled,
        lunchEnabled: enabled ? prev[day].lunchEnabled : false,
      },
    }));
  };

  const handleWeeklyTimeChange = (day: WeekDayKey, field: "start" | "end", value: string) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleToggleLunch = (day: WeekDayKey, enabled: boolean) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        lunchEnabled: enabled,
        lunchStart: enabled ? prev[day].lunchStart ?? prev[day].start : null,
        lunchEnd: enabled ? prev[day].lunchEnd ?? prev[day].end : null,
      },
    }));
  };

  const handleLunchTimeChange = (day: WeekDayKey, field: "lunchStart" | "lunchEnd", value: string) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const applyDefaultToDay = (day: WeekDayKey) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        start: horarioInicio,
        end: horarioFim,
      },
    }));
  };

  const refreshWhatsappStatus = useCallback(async () => {
    setWhatsappLoading(true);
    setWhatsappError(null);
    try {
      const data = await fetchWhatsappSession();
      setWhatsappSessionId(data.session_id ?? null);
      const status = data.status ?? {};
      const stateCandidate = typeof status.state === "string" ? status.state : status.status;
      const connected =
        Boolean(status.connected) ||
        stateCandidate === "CONNECTED" ||
        stateCandidate === "isLogged" ||
        stateCandidate === "connected";
      const normalizedState =
        typeof stateCandidate === "string" ? stateCandidate.toLowerCase() : connected ? "conectado" : "desconectado";
      setWhatsappStatus(connected ? "conectado" : normalizedState);
      const phone = status.phone?.wid?.user ?? status.phone?.device_model ?? (notifyWhatsapp || null);
      const pushname = status.phone?.pushname ?? null;
      setWhatsappInfo({ phone, pushname });
      if (!connected) {
        setWhatsappQrCode(normalizeQrCode(data.qr_code ?? null));
      } else {
        setWhatsappQrCode(null);
      }
    } catch (error) {
      setWhatsappError(getApiErrorMessage(error));
      setWhatsappStatus("desconectado");
      setWhatsappInfo({});
      setWhatsappQrCode(null);
      setWhatsappSessionId(null);
    } finally {
      setWhatsappLoading(false);
    }
  }, [notifyWhatsapp]);

  const handleStartWhatsapp = useCallback(async () => {
    setWhatsappLoading(true);
    setWhatsappError(null);
    try {
      await startWhatsappSession();
      await refreshWhatsappStatus();
      toast({ title: "Sessão iniciada", description: "Escaneie o QR Code pelo WhatsApp." });
    } catch (error) {
      setWhatsappError(getApiErrorMessage(error));
    } finally {
      setWhatsappLoading(false);
    }
  }, [refreshWhatsappStatus, toast]);

  const handleLogoutWhatsapp = useCallback(async () => {
    setWhatsappLoading(true);
    setWhatsappError(null);
    try {
      await logoutWhatsappSession();
      await refreshWhatsappStatus();
      toast({ title: "Sessão desconectada", description: "Você pode gerar outro QR Code quando preferir." });
    } catch (error) {
      setWhatsappError(getApiErrorMessage(error));
    } finally {
      setWhatsappLoading(false);
    }
  }, [refreshWhatsappStatus, toast]);

  useEffect(() => {
    async function loadData() {
      try {
        const [servicosData, configData, empresaData] = await Promise.all([
          fetchServicos(),
          fetchConfiguracoes(),
          fetchEmpresa(),
        ]);
        setServicos(servicosData);
        setConfiguracoes(configData);
        setHorarioInicio(configData.horarioInicio);
        setHorarioFim(configData.horarioFim);
        setIntervalo(configData.intervaloMinutos.toString());
        setDiasBloqueados(configData.diasBloqueados.map((d) => new Date(d + "T12:00:00")));
        setWeeklySchedule(createWeeklyScheduleState(configData.weeklySchedule, configData.horarioInicio, configData.horarioFim));
        setEmpresa(empresaData);
        setEmpresaNome(empresaData.nome);
        setEmpresaDescricao(empresaData.descricao ?? "");
        setIconePreview(empresaData.icon_url ?? null);
        setNotifyEmail(empresaData.notify_email ?? "");
        setNotifyTelegram(empresaData.notify_telegram ?? "");
        setNotifyViaEmail(Boolean(empresaData.notify_via_email));
        setNotifyViaTelegram(Boolean(empresaData.notify_via_telegram));
        setNotifyWhatsapp(empresaData.notify_whatsapp ?? "");
        setNotifyViaWhatsapp(Boolean(empresaData.notify_via_whatsapp));
        const dashboardTheme = sanitizeTheme(empresaData.dashboard_theme, DEFAULT_DASHBOARD_THEME);
        const clientTheme = sanitizeTheme(empresaData.client_theme, DEFAULT_CLIENT_THEME);
        setDashboardThemeState(dashboardTheme);
        setClientThemeState(clientTheme);
        applyThemePreview("dashboard", dashboardTheme);
        setPalette("client", clientTheme);
        if (Array.isArray((empresaData as any).gallery_assets) && (empresaData as any).gallery_assets.length) {
          setGalleryExisting(
            (empresaData as any).gallery_assets.map((asset: any) => ({
              url: asset.url ?? asset.path ?? "",
              path: asset.path ?? null,
            })),
          );
        } else {
          setGalleryExisting(
            (empresaData.gallery_photos ?? []).map((url) => ({
              url,
              path: null,
            })),
          );
        }
        setGalleryRemoved([]);
        clearGalleryPending();
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    refreshWhatsappStatus();
  }, [refreshWhatsappStatus]);

  useEffect(() => {
    return () => {
      if (iconeTempUrl) {
        URL.revokeObjectURL(iconeTempUrl);
      }
    };
  }, [iconeTempUrl]);

  const handleIconChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setIconeFile(file);
    if (iconeTempUrl) {
      URL.revokeObjectURL(iconeTempUrl);
      setIconeTempUrl(null);
    }

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setIconeTempUrl(previewUrl);
      setIconePreview(previewUrl);
    } else {
      setIconePreview(empresa?.icon_url ?? null);
    }
  };

  const clearGalleryPending = () => {
    setGalleryPending((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.preview));
      return [];
    });
  };

  useEffect(() => {
    return () => {
      galleryPendingRef.current.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, []);

  const handleGalleryUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length) return;

    const newUploads = files.map((file, index) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${index}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setGalleryPending((prev) => [...prev, ...newUploads]);
    event.target.value = "";
  };

  const handleRemovePendingPhoto = (id: string) => {
    setGalleryPending((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const toggleRemoveExistingPhoto = (photo: ExistingGalleryPhoto) => {
    const identifier = photo.path ?? photo.url;
    if (!identifier) return;
    setGalleryRemoved((prev) =>
      prev.includes(identifier) ? prev.filter((item) => item !== identifier) : [...prev, identifier],
    );
  };

  const handleSaveEmpresa = async () => {
    if (!empresaNome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome que será exibido para os clientes.",
        variant: "destructive",
      });
      return;
    }

    if (notifyViaWhatsapp && !notifyWhatsapp.trim()) {
      toast({
        title: "Número do WhatsApp obrigatório",
        description: "Informe o número que receberá os alertas automáticos ou desative esta opção.",
        variant: "destructive",
      });
      return;
    }

    setSalvandoEmpresa(true);
    const galleryNewFiles = galleryPending.map((item) => item.file);
    try {
      const atualizada = await updateEmpresa({
        nome: empresaNome.trim(),
        descricao: empresaDescricao.trim(),
        icone: iconeFile ?? undefined,
        notify_email: notifyEmail.trim() || null,
        notify_telegram: notifyTelegram.trim() || null,
        notify_whatsapp: notifyWhatsapp.trim() || null,
        notify_via_email: notifyViaEmail,
        notify_via_telegram: notifyViaTelegram,
        notify_via_whatsapp: notifyViaWhatsapp,
        dashboard_theme: dashboardThemeState,
        client_theme: clientThemeState,
        gallery_photos: galleryNewFiles.length ? galleryNewFiles : undefined,
        gallery_remove: galleryRemoved.length ? galleryRemoved : undefined,
      });
      setEmpresa(atualizada);
      setIconePreview(atualizada.icon_url ?? null);
      setNotifyEmail(atualizada.notify_email ?? "");
      setNotifyTelegram(atualizada.notify_telegram ?? "");
      setNotifyWhatsapp(atualizada.notify_whatsapp ?? "");
      setNotifyViaEmail(Boolean(atualizada.notify_via_email));
      setNotifyViaTelegram(Boolean(atualizada.notify_via_telegram));
      setNotifyViaWhatsapp(Boolean(atualizada.notify_via_whatsapp));
      const updatedDashboardTheme = sanitizeTheme(atualizada.dashboard_theme, DEFAULT_DASHBOARD_THEME);
      const updatedClientTheme = sanitizeTheme(atualizada.client_theme, DEFAULT_CLIENT_THEME);
      setDashboardThemeState(updatedDashboardTheme);
      setClientThemeState(updatedClientTheme);
      applyThemePreview("dashboard", updatedDashboardTheme);
      setPalette("client", updatedClientTheme);
      if (iconeTempUrl) {
        URL.revokeObjectURL(iconeTempUrl);
        setIconeTempUrl(null);
      }
      setIconeFile(null);
      if ((atualizada as any).gallery_assets?.length) {
        setGalleryExisting(
          (atualizada as any).gallery_assets.map((asset: any) => ({
            url: asset.url ?? asset.path ?? "",
            path: asset.path ?? null,
          })),
        );
      } else {
        setGalleryExisting(
          (atualizada.gallery_photos ?? []).map((url) => ({
            url,
            path: null,
          })),
        );
      }
      setGalleryRemoved([]);
      clearGalleryPending();
      updateCompany(atualizada);
      toast({
        title: "Empresa atualizada",
        description: "Os dados públicos foram salvos.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar empresa",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSalvandoEmpresa(false);
    }
  };

  const handleCopyLink = async () => {
    if (!empresa?.agendamento_url) return;
    try {
      await navigator.clipboard.writeText(empresa.agendamento_url);
      toast({
        title: "Link copiado",
        description: "Compartilhe com clientes para que agendem online.",
      });
    } catch {
      toast({
        title: "Não foi possível copiar",
        description: "Copie manualmente o link abaixo.",
        variant: "destructive",
      });
    }
  };

  const qrCodeUrl = empresa?.agendamento_url
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(empresa.agendamento_url)}`
    : null;

  const handleDownloadQrCode = async () => {
    if (!qrCodeUrl) return;
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qrcode-${empresa?.slug ?? "empresa"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast({
        title: "Não foi possível baixar",
        description: "Abra o QR Code em outra aba para salvar manualmente.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateTelegramLink = async () => {
    setTelegramLinkLoading(true);
    try {
      const { link } = await requestTelegramLink();
      setTelegramLink(link);
      toast({
        title: "Link gerado",
        description: "Abra o link, envie /start ao bot e depois clique em verificar.",
      });
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast({
        title: "Erro ao gerar link",
        description: message,
        variant: "destructive",
      });
    } finally {
      setTelegramLinkLoading(false);
    }
  };

  const handleVerifyTelegramLink = async () => {
    setTelegramVerifyLoading(true);
    try {
      const { chat_id } = await verifyTelegramLink();
      setNotifyTelegram(chat_id);
      setNotifyViaTelegram(true);
      toast({
        title: "Chat identificado",
        description: `Receberemos alertas no chat ${chat_id}.`,
      });
    } catch (error) {
      toast({
        title: "Não encontramos o chat",
        description: error instanceof Error ? error.message : "Envie /start ao bot e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setTelegramVerifyLoading(false);
    }
  };

  const handleSaveHorarios = async () => {
    setSaving(true);
    const invalidDay = weekDays.find(({ key, label }) => {
      const config = weeklySchedule[key];
      return config.enabled && minutesFromTime(config.start) >= minutesFromTime(config.end);
    });
    if (invalidDay) {
      setSaving(false);
      toast({
        title: "Horário inválido",
        description: `Revise os horários de ${invalidDay.label}.`,
        variant: "destructive",
      });
      return;
    }

    const invalidLunch = weekDays.find(({ key, label }) => {
      const config = weeklySchedule[key];
      if (!config.enabled || !config.lunchEnabled) return false;
      if (!config.lunchStart || !config.lunchEnd) return true;
      return (
        minutesFromTime(config.lunchStart) >= minutesFromTime(config.lunchEnd) ||
        minutesFromTime(config.lunchStart) < minutesFromTime(config.start) ||
        minutesFromTime(config.lunchEnd) > minutesFromTime(config.end)
      );
    });
    if (invalidLunch) {
      setSaving(false);
      toast({
        title: "Intervalo de almoço inválido",
        description: `Verifique o almoço de ${invalidLunch.label}.`,
        variant: "destructive",
      });
      return;
    }

    const weeklySchedulePayload = weekDays.reduce((acc, day) => {
      acc[day.key] = weeklySchedule[day.key];
      return acc;
    }, {} as Record<WeekDayKey, DaySchedule>);

    try {
      const updated = await updateConfiguracoes({
        horarioInicio,
        horarioFim,
        intervaloMinutos: parseInt(intervalo),
        diasBloqueados: diasBloqueados.map((d) => format(d, "yyyy-MM-dd")),
        weeklySchedule: weeklySchedulePayload,
      });
      setConfiguracoes(updated);
      setHorarioInicio(updated.horarioInicio);
      setHorarioFim(updated.horarioFim);
      setIntervalo(updated.intervaloMinutos.toString());
      setDiasBloqueados(updated.diasBloqueados.map((d) => new Date(d + "T12:00:00")));
      setWeeklySchedule(createWeeklyScheduleState(updated.weeklySchedule, updated.horarioInicio, updated.horarioFim));
      toast({
        title: "Configurações salvas",
        description: "Os horários de trabalho foram atualizados.",
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddServico = async () => {
    if (!novoServicoNome.trim() || !novoServicoPreco) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e preço do serviço.",
        variant: "destructive",
      });
      return;
    }

    try {
      const novoServico = await createServico({
        nome: novoServicoNome.trim(),
        preco: parseFloat(novoServicoPreco),
        duracao: parseInt(novoServicoDuracao),
      });
      setServicos([...servicos, novoServico]);
      setNovoServicoNome("");
      setNovoServicoPreco("");
      setNovoServicoDuracao("30");
      toast({
        title: "Serviço adicionado",
        description: `${novoServico.nome} foi adicionado à lista.`,
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o serviço.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteServico = async (id: number) => {
    try {
      await deleteServico(id);
      setServicos(servicos.filter((s) => s.id !== id));
      toast({
        title: "Serviço removido",
        description: "O serviço foi removido da lista.",
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível remover o serviço.",
        variant: "destructive",
      });
    }
  };

  const horarios = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">Gerencie horários e serviços</p>
          </div>
        </div>

        <Tabs defaultValue="empresa" className="space-y-6">
          <TabsList className="flex w-full flex-col gap-2 h-auto sm:h-10 sm:flex-row sm:gap-2">
            <TabsTrigger value="empresa" className="w-full flex-1 whitespace-normal text-center sm:whitespace-nowrap">
              Marca & canais
            </TabsTrigger>
            <TabsTrigger value="agenda" className="w-full flex-1 whitespace-normal text-center sm:whitespace-nowrap">
              Agenda & horários
            </TabsTrigger>
            <TabsTrigger value="servicos" className="w-full flex-1 whitespace-normal text-center sm:whitespace-nowrap">
              Serviços & catálogo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="empresa" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Identidade da empresa
                </CardTitle>
                <CardDescription>Atualize o que seus clientes veem ao acessar o link público.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative h-20 w-20 rounded-full border border-dashed border-border bg-muted flex items-center justify-center overflow-hidden">
                    {iconePreview ? (
                      <img src={iconePreview} alt="Ícone da empresa" className="h-full w-full object-cover" />
                    ) : (
                      <Scissors className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <input id="iconeUpload" type="file" accept="image/*" className="hidden" onChange={handleIconChange} />
                    <Label
                      htmlFor="iconeUpload"
                      className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary"
                    >
                      <Upload className="h-4 w-4" />
                      {iconePreview ? "Trocar ícone" : "Adicionar ícone"}
                    </Label>
                    <p className="text-xs text-muted-foreground">PNG ou JPG até 2MB.</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome da empresa</Label>
                    <Input value={empresaNome} onChange={(e) => setEmpresaNome(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug público</Label>
                    <Input readOnly value={empresa?.slug ?? "Não definido"} />
                    <p className="text-xs text-muted-foreground">Usado na URL do portal do cliente.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição curta</Label>
                  <Textarea
                    value={empresaDescricao}
                    onChange={(e) => setEmpresaDescricao(e.target.value)}
                    placeholder="Conte rapidamente o que torna seu atendimento especial."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Link público de agendamento</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input readOnly value={empresa?.agendamento_url ?? "Link indisponível"} className="sm:flex-1" />
                    <div className="flex gap-2 sm:w-auto">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCopyLink}
                        disabled={!empresa?.agendamento_url}
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        Copiar
                      </Button>
                      <Button type="button" variant="outline" onClick={handleDownloadQrCode} disabled={!qrCodeUrl}>
                        <Download className="h-4 w-4 mr-2" />
                        QR Code
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use este link nas redes sociais, Telegram ou imprima o QR Code no seu estabelecimento.
                  </p>
                </div>

                {qrCodeUrl && (
                  <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-4">
                    <div className="text-sm font-semibold text-muted-foreground">QR Code da empresa</div>
                    <div className="rounded-lg bg-white p-4">
                      <img src={qrCodeUrl} alt="QR Code da empresa" className="h-48 w-48" />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Imprima e deixe no balcão ou compartilhe digitalmente para seus clientes acessarem a agenda.
                    </p>
                  </div>
                )}


                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Palette className="h-4 w-4 text-primary" />
                      Alertas automáticos
                    </CardTitle>
                    <CardDescription>Integre e-mails e Telegram para receber notificações.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="space-y-2">
                      <Label>Email para alertas</Label>
                      <Input
                        type="email"
                        placeholder="contato@suaempresa.com"
                        value={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">Receber por email</p>
                        <p className="text-xs text-muted-foreground">Um aviso é enviado a cada novo agendamento.</p>
                      </div>
                      <Switch checked={notifyViaEmail} onCheckedChange={(checked) => setNotifyViaEmail(Boolean(checked))} />
                    </div>
                    <div className="space-y-3 text-sm">
                      <p className="text-xs text-muted-foreground">
                        Capturaremos automaticamente o chat ao conectar com o bot @syntax_atendimento_bot.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={handleGenerateTelegramLink} disabled={telegramLinkLoading}>
                          {telegramLinkLoading ? "Gerando..." : "Capturar automaticamente"}
                        </Button>
                        {telegramLink && (
                          <>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => window.open(telegramLink, "_blank", "noopener,noreferrer")}
                            >
                              Abrir bot
                            </Button>
                            <Button
                              type="button"
                              onClick={handleVerifyTelegramLink}
                              disabled={telegramVerifyLoading}
                              className="bg-emerald-600 hover:bg-emerald-500"
                            >
                              {telegramVerifyLoading ? "Verificando..." : "Confirmar captura"}
                            </Button>
                          </>
                        )}
                      </div>
                      <div className="space-y-2 pt-2">
                        <Label>WhatsApp para alertas</Label>
                        <Input
                          type="tel"
                          placeholder="5511999999999"
                          value={notifyWhatsapp}
                          onChange={(event) => setNotifyWhatsapp(event.target.value)}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">Receber via WhatsApp</p>
                          <p className="text-xs text-muted-foreground">
                            Os alertas serão enviados automaticamente para o número acima.
                          </p>
                        </div>
                        <Switch checked={notifyViaWhatsapp} onCheckedChange={(checked) => setNotifyViaWhatsapp(Boolean(checked))} />
                      </div>
                      {telegramLink && (
                        <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                          <p>Envie /start no bot usando o link acima e clique em confirmar captura.</p>
                          <p className="mt-1 break-all">{telegramLink}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">Receber via Telegram</p>
                          <p className="text-xs text-muted-foreground">Um job será disparado para seu integrador.</p>
                        </div>
                        <Switch
                          checked={notifyViaTelegram}
                          onCheckedChange={(checked) => setNotifyViaTelegram(Boolean(checked))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      WhatsApp automático
                    </CardTitle>
                    <CardDescription>Conecte seu WhatsApp via WPPConnect para disparar mensagens.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    {!whatsappSessionId && (
                      <p className="text-sm text-muted-foreground">
                        Clique em &quot;Gerar QR Code&quot; para criar a sess?o e concluir a conex?o.
                      </p>
                    )}
                    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                      <div>
                        <p className="text-sm font-medium capitalize">Status: {whatsappStatus}</p>
                        {whatsappInfo.pushname && (
                          <p className="text-xs text-muted-foreground">{whatsappInfo.pushname}</p>
                        )}
                        {whatsappInfo.phone && (
                          <p className="text-xs text-muted-foreground">N?mero: {whatsappInfo.phone}</p>
                        )}
                      </div>
                      {whatsappLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={refreshWhatsappStatus}>
                            Atualizar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleLogoutWhatsapp}
                            disabled={whatsappStatus === "desconectado"}
                          >
                            Desconectar
                          </Button>
                        </div>
                      )}
                    </div>
                    {whatsappError && <p className="text-xs text-destructive">{whatsappError}</p>}
                    {whatsappQrCode ? (
                      <div className="rounded-lg border border-dashed border-border p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-3">
                          Abra o WhatsApp &gt; Aparelhos conectados e leia o QR Code abaixo.
                        </p>
                        <img
                          src={normalizeQrCode(whatsappQrCode) ?? undefined}
                          alt="QR Code do WhatsApp"
                          className="mx-auto h-48 w-48"
                        />
                        <p className="mt-2 text-xs text-muted-foreground">Expirou? Clique em atualizar.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Se estiver desconectado gere um novo QR Code e leia pelo aplicativo.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={handleStartWhatsapp} disabled={whatsappLoading}>
                            {whatsappLoading ? "Gerando..." : "Gerar QR Code"}
                          </Button>
                          <Button variant="outline" onClick={refreshWhatsappStatus} disabled={whatsappLoading}>
                            Recarregar QR Code
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <div className="grid gap-4 lg:grid-cols-2">

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Palette className="h-4 w-4 text-primary" />
                        Painel interno
                      </CardTitle>
                      <CardDescription>Personalize o visual do prestador.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {renderThemeGrid("dashboard", dashboardThemeState)}
                      <p className="text-xs text-muted-foreground">
                        Impacta menu, botões e componentes internos.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Portal do cliente
                      </CardTitle>
                      <CardDescription>Defina a experiência para links públicos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {renderThemeGrid("client", clientThemeState)}
                      <p className="text-xs text-muted-foreground">
                        Essas cores são usadas no portal público e no fluxo de agendamento.
                      </p>
                    </CardContent>
                  </Card>
                </div>


                <Button type="button" className="shadow-gold" onClick={handleSaveEmpresa} disabled={salvandoEmpresa}>
                  {salvandoEmpresa ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Salvando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Salvar informações
                    </span>
                  )}
                </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Images className="h-5 w-5 text-primary" />
                Galeria do estabelecimento
              </CardTitle>
              <CardDescription>Adicione várias fotos para deixar o portal do cliente mais atrativo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {galleryExisting.map((photo) => {
                  const identifier = photo.path ?? photo.url;
                  const marked = identifier ? galleryRemoved.includes(identifier) : false;
                  return (
                    <div key={identifier} className="relative overflow-hidden rounded-xl border border-border/70 bg-muted/40">
                      <img
                        src={photo.url}
                        alt="Foto do estabelecimento"
                        className={`h-32 w-full object-cover ${marked ? "opacity-40" : ""}`}
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-xs text-white">
                        <span>{marked ? "Será removida" : "Publicada"}</span>
                        {identifier && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => toggleRemoveExistingPhoto(photo)}
                          >
                            {marked ? "Desfazer" : "Remover"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {galleryPending.map((item) => (
                  <div
                    key={item.id}
                    className="relative overflow-hidden rounded-xl border border-dashed border-primary/40 bg-primary/5"
                  >
                    <img src={item.preview} alt="Nova foto do estabelecimento" className="h-32 w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-xs text-white">
                      <span>Nova foto</span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleRemovePendingPhoto(item.id)}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
                {!galleryExisting.length && !galleryPending.length && (
                  <div className="rounded-xl border border-dashed border-border/70 p-4 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-4">
                    Nenhuma foto cadastrada ainda. Use o botão abaixo para adicionar imagens do espaço.
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <input
                  id="galleryUpload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleGalleryUpload}
                />
                <Label
                  htmlFor="galleryUpload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
                >
                  <Upload className="h-4 w-4" />
                  Adicionar fotos
                </Label>
                <p className="text-xs text-muted-foreground">
                  Suporta PNG ou JPG até 3MB. Remoções e inclusões são aplicadas somente após salvar.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

          <TabsContent value="agenda" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Horários de Trabalho
                </CardTitle>
                <CardDescription>Defina o horário de funcionamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Início</Label>
                    <Select value={horarioInicio} onValueChange={setHorarioInicio}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {horarios.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fim</Label>
                    <Select value={horarioFim} onValueChange={setHorarioFim}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {horarios.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Intervalo entre agendamentos</Label>
                  <Select value={intervalo} onValueChange={setIntervalo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>


                <div className="space-y-4 rounded-lg border border-dashed p-3">
                  <div>
                    <p className="text-sm font-medium">Horários por dia</p>
                    <p className="text-xs text-muted-foreground">
                      Escolha um dia, ajuste horários específicos ou aplique o padrão geral.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[2fr,1fr]">
                    <div className="space-y-1.5">
                      <Label>Dia da semana</Label>
                      <Select value={selectedDay} onValueChange={(value) => setSelectedDay(value as WeekDayKey)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {weekDays.map((day) => (
                            <SelectItem key={day.key} value={day.key}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button type="button" variant="secondary" className="w-full" onClick={() => applyDefaultToDay(selectedDay)}>
                        Usar horário padrão
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 space-y-4">
                    {(() => {
                      const schedule = weeklySchedule[selectedDay];
                      const dayLabel = weekDays.find((day) => day.key === selectedDay)?.label ?? "Dia selecionado";
                      return (
                        <>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{dayLabel}</p>
                              <p className="text-xs text-muted-foreground">
                                {schedule.enabled ? `${schedule.start} às ${schedule.end}` : "Dia desativado"}
                              </p>
                            </div>
                            <Switch checked={schedule.enabled} onCheckedChange={(checked) => handleToggleDay(selectedDay, checked)} />
                          </div>

                          {schedule.enabled && (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1.5">
                                <Label className="text-xs uppercase text-muted-foreground">Início</Label>
                                <Select value={schedule.start} onValueChange={(value) => handleWeeklyTimeChange(selectedDay, "start", value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {horarios.map((h) => (
                                      <SelectItem key={`start-${h}`} value={h}>
                                        {h}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs uppercase text-muted-foreground">Fim</Label>
                                <Select value={schedule.end} onValueChange={(value) => handleWeeklyTimeChange(selectedDay, "end", value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {horarios.map((h) => (
                                      <SelectItem key={`end-${h}`} value={h}>
                                        {h}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}

                          <div className="rounded-lg border border-muted/50 p-3 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">Intervalo de almoço</p>
                                <p className="text-xs text-muted-foreground">
                                  {schedule.lunchEnabled && schedule.lunchStart && schedule.lunchEnd
                                    ? `${schedule.lunchStart} às ${schedule.lunchEnd}`
                                    : "Sem intervalo configurado"}
                                </p>
                              </div>
                              <Switch
                                checked={schedule.lunchEnabled}
                                disabled={!schedule.enabled}
                                onCheckedChange={(checked) => handleToggleLunch(selectedDay, checked)}
                              />
                            </div>
                            {schedule.enabled && schedule.lunchEnabled && (
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                  <Label className="text-xs uppercase text-muted-foreground">Início do almoço</Label>
                                  <Select value={schedule.lunchStart ?? schedule.start} onValueChange={(value) => handleLunchTimeChange(selectedDay, "lunchStart", value)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {horarios.map((h) => (
                                        <SelectItem key={`lunch-start-${h}`} value={h}>
                                          {h}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs uppercase text-muted-foreground">Fim do almoço</Label>
                                  <Select value={schedule.lunchEnd ?? schedule.end} onValueChange={(value) => handleLunchTimeChange(selectedDay, "lunchEnd", value)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {horarios.map((h) => (
                                        <SelectItem key={`lunch-end-${h}`} value={h}>
                                          {h}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <Button onClick={handleSaveHorarios} className="w-full" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar Horários"}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Dias Bloqueados
                </CardTitle>
                <CardDescription>Férias, folgas e feriados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Dia Bloqueado
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="multiple"
                      selected={diasBloqueados}
                      onSelect={(dates) => setDiasBloqueados(dates || [])}
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <div className="flex flex-wrap gap-2">
                  {diasBloqueados.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum dia bloqueado</p>
                  ) : (
                    diasBloqueados.map((dia, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => setDiasBloqueados(diasBloqueados.filter((_, i) => i !== index))}
                      >
                        {format(dia, "dd/MM/yyyy")}
                        <Trash2 className="h-3 w-3 ml-1" />
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="servicos" className="space-y-6">
            <Card id="servicos">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-primary" />
                  Serviços
                </CardTitle>
                <CardDescription>Gerencie os serviços oferecidos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 p-4 border border-dashed border-border rounded-lg">
                  <div className="flex-1">
                    <Input
                      placeholder="Nome do serviço"
                      value={novoServicoNome}
                      onChange={(e) => setNovoServicoNome(e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <Input
                      type="number"
                      placeholder="Preço"
                      value={novoServicoPreco}
                      onChange={(e) => setNovoServicoPreco(e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <Select value={novoServicoDuracao} onValueChange={setNovoServicoDuracao}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddServico}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-2">
                  {servicos.map((servico) => (
                    <div
                      key={servico.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Scissors className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{servico.nome}</p>
                          <p className="text-sm text-muted-foreground">{servico.duracao} minutos</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-primary">{formatarPreco(servico.preco)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteServico(servico.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
