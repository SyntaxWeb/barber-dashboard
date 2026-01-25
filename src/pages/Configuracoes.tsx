import { useEffect, useState, ChangeEvent, useRef, useCallback } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/layout/Layout";
import { Servico, ConfiguracoesBarbearia } from "@/data/mockData";
import {
  fetchServicos,
  fetchConfiguracoes,
  updateConfiguracoes,
  createServico,
  deleteServico,
} from "@/services/agendaService";
import {
  fetchEmpresa,
  updateEmpresa,
  requestTelegramLink,
  verifyTelegramLink,
  type EmpresaInfo,
} from "@/services/companyService";
import { fetchWhatsappSession, logoutWhatsappSession, startWhatsappSession } from "@/services/whatsappService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BrandTheme, DEFAULT_CLIENT_THEME, DEFAULT_DASHBOARD_THEME, sanitizeTheme, isValidHexColor } from "@/lib/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { ConfiguracoesEmpresaTab } from "@/pages/configuracoes/ConfiguracoesEmpresaTab";
import { ConfiguracoesAgendaTab } from "@/pages/configuracoes/ConfiguracoesAgendaTab";
import { ConfiguracoesServicosTab } from "@/pages/configuracoes/ConfiguracoesServicosTab";
import {
  ConfiguracoesFidelidadeTab,
  type LoyaltyRewardDraft,
  type LoyaltySettingsForm,
} from "@/pages/configuracoes/ConfiguracoesFidelidadeTab";
import { createWeeklyScheduleState, weekDays, type WeekDayKey, type WeeklyScheduleState } from "@/pages/configuracoes/constants";
import type { ExistingGalleryPhoto, GalleryUpload, WhatsappInfo } from "@/pages/configuracoes/types";
import {
  createLoyaltyReward,
  deleteLoyaltyReward,
  fetchLoyaltyRewards,
  fetchLoyaltySettings,
  type LoyaltyReward,
  updateLoyaltyReward,
  updateLoyaltySettings,
} from "@/services/loyaltyService";

const minutesFromTime = (value?: string | null) => {
  if (!value) return 0;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const centsToAmount = (value: number) => {
  const normalized = Number.isFinite(value) ? value / 100 : 0;
  return normalized.toFixed(2);
};

const amountToCents = (value: string) => {
  const normalized = Number(value.replace(",", "."));
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return 0;
  }
  return Math.round(normalized * 100);
};

const getApiErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message.includes("Request Entity Too Large") || error.message.includes("413")) {
      return "Os arquivos enviados são grandes demais. Tente reduzir o tamanho ou a quantidade das imagens.";
    }
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
    if (error.includes("Request Entity Too Large") || error.includes("413")) {
      return "Os arquivos enviados são grandes demais. Tente reduzir o tamanho ou a quantidade das imagens.";
    }
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
  const [whatsappInfo, setWhatsappInfo] = useState<WhatsappInfo>({});
  const [whatsappSessionId, setWhatsappSessionId] = useState<string | null>(null);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettingsForm>({
    enabled: false,
    ruleType: "spend",
    spendAmount: "10.00",
    pointsPerVisit: "1",
    expirationEnabled: false,
    expirationDays: "180",
  });
  const [loyaltyRewards, setLoyaltyRewards] = useState<LoyaltyReward[]>([]);
  const [loyaltySaving, setLoyaltySaving] = useState(false);
  const [rewardCreating, setRewardCreating] = useState(false);
  const [rewardDraft, setRewardDraft] = useState<LoyaltyRewardDraft>({
    name: "",
    description: "",
    pointsCost: "",
    active: true,
  });

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
        const [servicosData, configData, empresaData, loyaltySettingsData, loyaltyRewardsData] = await Promise.all([
          fetchServicos(),
          fetchConfiguracoes(),
          fetchEmpresa(),
          fetchLoyaltySettings(),
          fetchLoyaltyRewards(),
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
        setLoyaltyRewards(loyaltyRewardsData);
        setLoyaltySettings({
          enabled: loyaltySettingsData.enabled,
          ruleType: loyaltySettingsData.rule_type,
          spendAmount: centsToAmount(loyaltySettingsData.spend_amount_cents_per_point),
          pointsPerVisit: String(loyaltySettingsData.points_per_visit ?? 1),
          expirationEnabled: loyaltySettingsData.expiration_enabled,
          expirationDays: loyaltySettingsData.expiration_days
            ? String(loyaltySettingsData.expiration_days)
            : "180",
        });
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
        description: getApiErrorMessage(error),
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

  const handleLoyaltyFormChange = (patch: Partial<LoyaltySettingsForm>) => {
    setLoyaltySettings((prev) => ({ ...prev, ...patch }));
  };

  const handleSaveLoyaltySettings = async () => {
    const amountCents = amountToCents(loyaltySettings.spendAmount);
    const pointsPerVisit = Number.parseInt(loyaltySettings.pointsPerVisit, 10);
    const expirationDays = Number.parseInt(loyaltySettings.expirationDays, 10);

    if (loyaltySettings.ruleType === "spend" && amountCents <= 0) {
      toast({ title: "Valor inválido", description: "Informe o valor por ponto.", variant: "destructive" });
      return;
    }

    if (loyaltySettings.ruleType === "visits" && (!pointsPerVisit || pointsPerVisit <= 0)) {
      toast({ title: "Pontos inválidos", description: "Informe pontos por presença.", variant: "destructive" });
      return;
    }

    if (loyaltySettings.expirationEnabled && (!expirationDays || expirationDays <= 0)) {
      toast({ title: "Prazo inválido", description: "Informe em quantos dias os pontos expiram.", variant: "destructive" });
      return;
    }

    setLoyaltySaving(true);
    try {
      const payload = await updateLoyaltySettings({
        enabled: loyaltySettings.enabled,
        rule_type: loyaltySettings.ruleType,
        spend_amount_cents_per_point: amountCents || 1000,
        points_per_visit: pointsPerVisit || 1,
        expiration_enabled: loyaltySettings.expirationEnabled,
        expiration_days: loyaltySettings.expirationEnabled ? expirationDays : null,
      });
      setLoyaltySettings({
        enabled: payload.enabled,
        ruleType: payload.rule_type,
        spendAmount: centsToAmount(payload.spend_amount_cents_per_point),
        pointsPerVisit: String(payload.points_per_visit ?? 1),
        expirationEnabled: payload.expiration_enabled,
        expirationDays: payload.expiration_days ? String(payload.expiration_days) : "180",
      });
      toast({ title: "Fidelidade atualizada", description: "As regras foram salvas com sucesso." });
    } catch (error) {
      toast({ title: "Erro ao salvar", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setLoyaltySaving(false);
    }
  };

  const handleRewardDraftChange = (patch: Partial<LoyaltyRewardDraft>) => {
    setRewardDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleCreateReward = async () => {
    const name = rewardDraft.name.trim();
    const pointsCost = Number.parseInt(rewardDraft.pointsCost, 10);

    if (!name) {
      toast({ title: "Nome obrigatório", description: "Informe o nome da recompensa.", variant: "destructive" });
      return;
    }
    if (!pointsCost || pointsCost <= 0) {
      toast({ title: "Pontos inválidos", description: "Informe o custo em pontos.", variant: "destructive" });
      return;
    }

    setRewardCreating(true);
    try {
      const reward = await createLoyaltyReward({
        name,
        description: rewardDraft.description.trim() || undefined,
        points_cost: pointsCost,
        active: rewardDraft.active,
      });
      setLoyaltyRewards((prev) => [...prev, reward].sort((a, b) => a.points_cost - b.points_cost));
      setRewardDraft({ name: "", description: "", pointsCost: "", active: true });
      toast({ title: "Recompensa adicionada", description: "A recompensa foi criada." });
    } catch (error) {
      toast({ title: "Erro ao criar", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setRewardCreating(false);
    }
  };

  const handleRewardChange = (id: number, patch: Partial<LoyaltyReward>) => {
    setLoyaltyRewards((prev) => prev.map((reward) => (reward.id === id ? { ...reward, ...patch } : reward)));
  };

  const handleSaveReward = async (reward: LoyaltyReward) => {
    if (!reward.name.trim()) {
      toast({ title: "Nome obrigatório", description: "Informe o nome da recompensa.", variant: "destructive" });
      return;
    }
    if (!reward.points_cost || reward.points_cost <= 0) {
      toast({ title: "Pontos inválidos", description: "Informe o custo em pontos.", variant: "destructive" });
      return;
    }

    try {
      const updated = await updateLoyaltyReward(reward.id, {
        name: reward.name.trim(),
        description: reward.description ?? undefined,
        points_cost: reward.points_cost,
        active: reward.active,
      });
      setLoyaltyRewards((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast({ title: "Recompensa atualizada", description: "Os dados foram salvos." });
    } catch (error) {
      toast({ title: "Erro ao salvar", description: getApiErrorMessage(error), variant: "destructive" });
    }
  };

  const handleDeleteReward = async (id: number) => {
    try {
      await deleteLoyaltyReward(id);
      setLoyaltyRewards((prev) => prev.filter((reward) => reward.id !== id));
      toast({ title: "Recompensa removida", description: "A recompensa foi excluída." });
    } catch (error) {
      toast({ title: "Erro ao excluir", description: getApiErrorMessage(error), variant: "destructive" });
    }
  };

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
            <TabsTrigger value="fidelidade" className="w-full flex-1 whitespace-normal text-center sm:whitespace-nowrap">
              Fidelidade
            </TabsTrigger>
          </TabsList>

          <ConfiguracoesEmpresaTab
            empresa={empresa}
            iconePreview={iconePreview}
            onIconChange={handleIconChange}
            empresaNome={empresaNome}
            onEmpresaNomeChange={setEmpresaNome}
            empresaDescricao={empresaDescricao}
            onEmpresaDescricaoChange={setEmpresaDescricao}
            onCopyLink={handleCopyLink}
            onDownloadQrCode={handleDownloadQrCode}
            qrCodeUrl={qrCodeUrl}
            notifyEmail={notifyEmail}
            onNotifyEmailChange={setNotifyEmail}
            notifyViaEmail={notifyViaEmail}
            onNotifyViaEmailChange={setNotifyViaEmail}
            notifyWhatsapp={notifyWhatsapp}
            onNotifyWhatsappChange={setNotifyWhatsapp}
            notifyViaWhatsapp={notifyViaWhatsapp}
            onNotifyViaWhatsappChange={setNotifyViaWhatsapp}
            telegramLink={telegramLink}
            telegramLinkLoading={telegramLinkLoading}
            onGenerateTelegramLink={handleGenerateTelegramLink}
            onVerifyTelegramLink={handleVerifyTelegramLink}
            telegramVerifyLoading={telegramVerifyLoading}
            notifyViaTelegram={notifyViaTelegram}
            onNotifyViaTelegramChange={setNotifyViaTelegram}
            whatsappSessionId={whatsappSessionId}
            whatsappStatus={whatsappStatus}
            whatsappInfo={whatsappInfo}
            whatsappLoading={whatsappLoading}
            onRefreshWhatsappStatus={refreshWhatsappStatus}
            onLogoutWhatsapp={handleLogoutWhatsapp}
            whatsappError={whatsappError}
            whatsappQrCode={whatsappQrCode}
            onStartWhatsapp={handleStartWhatsapp}
            galleryExisting={galleryExisting}
            galleryRemoved={galleryRemoved}
            onToggleRemoveExistingPhoto={toggleRemoveExistingPhoto}
            galleryPending={galleryPending}
            onRemovePendingPhoto={handleRemovePendingPhoto}
            onGalleryUpload={handleGalleryUpload}
            dashboardTheme={dashboardThemeState}
            clientTheme={clientThemeState}
            renderThemeGrid={renderThemeGrid}
            onSaveEmpresa={handleSaveEmpresa}
            salvandoEmpresa={salvandoEmpresa}
          />

          <ConfiguracoesAgendaTab
            horarioInicio={horarioInicio}
            setHorarioInicio={setHorarioInicio}
            horarioFim={horarioFim}
            setHorarioFim={setHorarioFim}
            intervalo={intervalo}
            setIntervalo={setIntervalo}
            diasBloqueados={diasBloqueados}
            setDiasBloqueados={setDiasBloqueados}
            weeklySchedule={weeklySchedule}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            onToggleDay={handleToggleDay}
            onWeeklyTimeChange={handleWeeklyTimeChange}
            onToggleLunch={handleToggleLunch}
            onLunchTimeChange={handleLunchTimeChange}
            onApplyDefaultToDay={applyDefaultToDay}
            onSaveHorarios={handleSaveHorarios}
            saving={saving}
          />

          <ConfiguracoesServicosTab
            novoServicoNome={novoServicoNome}
            setNovoServicoNome={setNovoServicoNome}
            novoServicoPreco={novoServicoPreco}
            setNovoServicoPreco={setNovoServicoPreco}
            novoServicoDuracao={novoServicoDuracao}
            setNovoServicoDuracao={setNovoServicoDuracao}
            onAddServico={handleAddServico}
            servicos={servicos}
            onDeleteServico={handleDeleteServico}
          />

          <ConfiguracoesFidelidadeTab
            form={loyaltySettings}
            onFormChange={handleLoyaltyFormChange}
            onSaveSettings={handleSaveLoyaltySettings}
            savingSettings={loyaltySaving}
            rewards={loyaltyRewards}
            onRewardChange={handleRewardChange}
            onSaveReward={handleSaveReward}
            onDeleteReward={handleDeleteReward}
            rewardDraft={rewardDraft}
            onRewardDraftChange={handleRewardDraftChange}
            onCreateReward={handleCreateReward}
            creatingReward={rewardCreating}
          />
        </Tabs>
      </div>
    </Layout>
  );
}
