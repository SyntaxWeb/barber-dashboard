import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ClientAppointmentFeedbackPayload,
  fetchPublicFeedbackForm,
  submitPublicFeedback,
  PublicFeedbackAppointment,
} from "@/services/clientPortalService";
import { Loader2, Star, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "loading" | "form" | "error" | "success" | "already";

const createDefaults = (): ClientAppointmentFeedbackPayload => ({
  service_rating: 5,
  professional_rating: 5,
  scheduling_rating: 5,
  comment: "",
  allow_public_testimonial: false,
});

const FeedbackPublico = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");


  const [appointment, setAppointment] = useState<PublicFeedbackAppointment | null>(null);
  const [formValues, setFormValues] = useState<ClientAppointmentFeedbackPayload>(createDefaults);
  const [step, setStep] = useState<Step>(token ? "loading" : "error");
  const [error, setError] = useState<string>("Link inválido. Solicite outro ao profissional.");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      console.log(`Token inválido: ${token}`);
      setStep("error");
      setError("Link inválido. Solicite outro ao profissional.");
      return;
    }

    setStep("loading");
    fetchPublicFeedbackForm(token)
      .then((data) => {
        setAppointment(data);
        if (data.feedback) {
          setStep("already");
        } else {
          setFormValues(createDefaults());
          setStep("form");
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Não conseguimos validar este link.");
        setStep("error");
      });
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await submitPublicFeedback(token, formValues);
      setAppointment(response);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar feedback.");
      setStep("error");
    } finally {
      setSubmitting(false);
    }
  };

  const companyName = appointment?.company?.nome ?? "Barbearia";
  const appointmentDate = useMemo(() => {
    if (!appointment?.data) return null;
    try {
      return format(new Date(`${appointment.data}T00:00:00`), "EEEE, dd 'de' MMMM", { locale: ptBR });
    } catch {
      return appointment.data;
    }
  }, [appointment?.data]);

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="mx-auto max-w-xl">
        <Card className="border-border shadow-gold/30">
          <CardHeader className="space-y-2 text-center">
            <CardTitle>Compartilhe seu feedback</CardTitle>
            <CardDescription>
              {companyName} quer saber como foi o atendimento. Leva menos de 1 minuto 😊
            </CardDescription>
            {appointment && (
              <div className="rounded-md bg-muted/60 px-3 py-2 text-sm">
                <p className="font-semibold text-foreground">{appointment.servico ?? "Serviço"}</p>
                {appointmentDate && <p className="text-muted-foreground">{appointmentDate}</p>}
                {appointment?.horario && <p className="text-muted-foreground">às {appointment.horario}</p>}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {step === "loading" && (
              <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                Validando seu link...
              </div>
            )}

            {step === "error" && (
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertTriangle className="h-10 w-10 text-amber-500" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button asChild variant="secondary">
                  <Link to="/">Voltar para o início</Link>
                </Button>
              </div>
            )}

            {step === "already" && (
              <div className="flex flex-col items-center gap-3 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <p className="text-lg font-semibold text-foreground">Você já respondeu 💬</p>
                <p className="text-sm text-muted-foreground">
                  Agradecemos demais sua participação! Se precisar atualizar, fale com o profissional.
                </p>
                <Button asChild variant="secondary">
                  <Link to="/">Ir para o site</Link>
                </Button>
              </div>
            )}

            {step === "success" && (
              <div className="flex flex-col items-center gap-3 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <p className="text-lg font-semibold text-foreground">Feedback enviado!</p>
                <p className="text-sm text-muted-foreground">
                  Valeu demais por compartilhar. Seu toque ajuda a ajustar cada detalhe para os próximos atendimentos.
                </p>
                <Button asChild variant="secondary">
                  <Link to="/">Voltar</Link>
                </Button>
              </div>
            )}

            {step === "form" && (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {questions.map((question) => (
                    <RatingQuestion
                      key={question.key}
                      label={question.label}
                      value={formValues[question.key]}
                      onChange={(value) =>
                        setFormValues((current) => ({
                          ...current,
                          [question.key]: value,
                        }))
                      }
                    />
                  ))}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="public-feedback-comment">Quer deixar um comentário ou sugestão?</Label>
                  <Textarea
                    id="public-feedback-comment"
                    placeholder="Conte rapidinho o que podemos melhorar (opcional)"
                    value={formValues.comment ?? ""}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        comment: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                  <Checkbox
                    id="public-feedback-consent"
                    checked={formValues.allow_public_testimonial ?? false}
                    onCheckedChange={(checked) =>
                      setFormValues((current) => ({
                        ...current,
                        allow_public_testimonial: checked === true,
                      }))
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="public-feedback-consent" className="font-medium text-sm">
                      Você autoriza usar esse comentário como depoimento público?
                    </Label>
                    <p className="text-xs text-muted-foreground">Só publicamos se você permitir, combinado?</p>
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Enviando..." : "Enviar feedback"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const questions: Array<{
  key: keyof ClientAppointmentFeedbackPayload;
  label: string;
}> = [
  { key: "service_rating", label: "Como você avalia o serviço prestado?" },
  { key: "professional_rating", label: "Como foi o atendimento do profissional?" },
  { key: "scheduling_rating", label: "O que achou da experiência com o sistema de agendamento?" },
];

interface RatingQuestionProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const RatingQuestion = ({ label, value, onChange }: RatingQuestionProps) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-foreground">{label}</Label>
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }).map((_, index) => {
        const position = index + 1;
        const active = position <= value;
        return (
          <button
            key={position}
            type="button"
            className={cn(
              "rounded-full p-1 transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              active ? "scale-105" : "hover:scale-105",
            )}
            onClick={() => onChange(position)}
            aria-label={`Selecionar ${position} de 5 estrelas`}
          >
            <Star className={cn("h-6 w-6", active ? "text-amber-500 fill-amber-500" : "text-muted-foreground")} />
          </button>
        );
      })}
      <span className="text-xs text-muted-foreground">{value} / 5</span>
    </div>
  </div>
);

export default FeedbackPublico;
