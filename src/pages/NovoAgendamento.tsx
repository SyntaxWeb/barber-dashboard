import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Calendar as CalendarIcon, Clock, Scissors, FileText, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layout } from '@/components/layout/Layout';
import { Servico, ConfiguracoesBarbearia } from '@/data/mockData';
import { 
  fetchServicos, 
  fetchConfiguracoes, 
  createAgendamento,
  gerarHorariosDisponiveis,
  formatarPreco 
} from '@/services/agendaService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function NovoAgendamento() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesBarbearia | null>(null);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [cliente, setCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [servicoId, setServicoId] = useState('');
  const [data, setData] = useState<Date | undefined>(new Date());
  const [horario, setHorario] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    async function loadData() {
      const [servicosData, configData] = await Promise.all([
        fetchServicos(),
        fetchConfiguracoes()
      ]);
      setServicos(servicosData);
      setConfiguracoes(configData);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (data && configuracoes) {
      const dataStr = format(data, 'yyyy-MM-dd');
      const horarios = gerarHorariosDisponiveis(dataStr, configuracoes);
      setHorariosDisponiveis(horarios);
      if (!horarios.includes(horario)) {
        setHorario('');
      }
    }
  }, [data, configuracoes]);

  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 2) return `(${numeros}`;
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatarTelefone(e.target.value));
  };

  const servicoSelecionado = servicos.find(s => s.id.toString() === servicoId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cliente.trim()) {
      toast({ title: 'Nome do cliente é obrigatório', variant: 'destructive' });
      return;
    }
    if (!telefone.trim()) {
      toast({ title: 'Telefone é obrigatório', variant: 'destructive' });
      return;
    }
    if (!servicoId) {
      toast({ title: 'Selecione um serviço', variant: 'destructive' });
      return;
    }
    if (!data) {
      toast({ title: 'Selecione uma data', variant: 'destructive' });
      return;
    }
    if (!horario) {
      toast({ title: 'Selecione um horário', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      await createAgendamento({
        cliente: cliente.trim(),
        telefone: telefone.trim(),
        data: format(data, 'yyyy-MM-dd'),
        horario,
        servico: servicoSelecionado!.nome,
        preco: servicoSelecionado!.preco,
        status: 'confirmado',
        observacoes: observacoes.trim() || undefined
      });

      toast({
        title: 'Agendamento criado!',
        description: `${cliente} agendado para ${format(data, "dd/MM/yyyy")} às ${horario}`
      });

      navigate('/agenda');
    } catch {
      toast({
        title: 'Erro ao criar agendamento',
        description: 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Novo Agendamento</h1>
            <p className="text-muted-foreground">
              Preencha os dados do cliente
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Agendamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cliente */}
              <div className="space-y-2">
                <Label htmlFor="cliente">Nome do Cliente</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cliente"
                    placeholder="João Silva"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="telefone"
                    placeholder="(11) 99999-9999"
                    value={telefone}
                    onChange={handleTelefoneChange}
                    className="pl-10"
                    maxLength={15}
                  />
                </div>
              </div>

              {/* Serviço */}
              <div className="space-y-2">
                <Label>Serviço</Label>
                <Select value={servicoId} onValueChange={setServicoId}>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Selecione um serviço" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {servicos.map((servico) => (
                      <SelectItem key={servico.id} value={servico.id.toString()}>
                        <div className="flex items-center justify-between w-full gap-4">
                          <span>{servico.nome}</span>
                          <span className="text-primary font-medium">
                            {formatarPreco(servico.preco)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {servicoSelecionado && (
                  <p className="text-sm text-muted-foreground">
                    Duração: {servicoSelecionado.duracao} minutos • {formatarPreco(servicoSelecionado.preco)}
                  </p>
                )}
              </div>

              {/* Data e Horário */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !data && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {data ? format(data, "dd/MM/yyyy") : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={data}
                        onSelect={setData}
                        locale={ptBR}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Select value={horario} onValueChange={setHorario} disabled={!data}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Selecione" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {horariosDisponiveis.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          Nenhum horário disponível
                        </div>
                      ) : (
                        horariosDisponiveis.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="observacoes"
                    placeholder="Alguma observação sobre o cliente..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="pl-10 min-h-[100px]"
                  />
                </div>
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full shadow-gold"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Salvando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Criar Agendamento
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
