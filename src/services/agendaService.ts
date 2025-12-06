import { 
  Agendamento, 
  Servico, 
  ConfiguracoesBarbearia,
  agendamentosMock, 
  servicosMock, 
  configuracoesMock 
} from '@/data/mockData';

// Simula delay de API
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ========== AGENDAMENTOS ==========

export async function fetchAgendamentos(): Promise<Agendamento[]> {
  await delay(300);
  return [...agendamentosMock];
}

export async function fetchAgendamentosPorData(data: string): Promise<Agendamento[]> {
  await delay(200);
  return agendamentosMock.filter(a => a.data === data);
}

export async function fetchAgendamentosPorPeriodo(dataInicio: string, dataFim: string): Promise<Agendamento[]> {
  await delay(200);
  return agendamentosMock.filter(a => a.data >= dataInicio && a.data <= dataFim);
}

export async function createAgendamento(agendamento: Omit<Agendamento, 'id'>): Promise<Agendamento> {
  await delay(300);
  const novoAgendamento: Agendamento = {
    ...agendamento,
    id: Math.max(...agendamentosMock.map(a => a.id)) + 1
  };
  agendamentosMock.push(novoAgendamento);
  return novoAgendamento;
}

export async function updateAgendamento(id: number, dados: Partial<Agendamento>): Promise<Agendamento | null> {
  await delay(200);
  const index = agendamentosMock.findIndex(a => a.id === id);
  if (index === -1) return null;
  
  agendamentosMock[index] = { ...agendamentosMock[index], ...dados };
  return agendamentosMock[index];
}

export async function cancelarAgendamento(id: number): Promise<boolean> {
  await delay(200);
  const agendamento = agendamentosMock.find(a => a.id === id);
  if (!agendamento) return false;
  
  agendamento.status = 'cancelado';
  return true;
}

export async function concluirAgendamento(id: number): Promise<boolean> {
  await delay(200);
  const agendamento = agendamentosMock.find(a => a.id === id);
  if (!agendamento) return false;
  
  agendamento.status = 'concluido';
  return true;
}

// ========== SERVIÇOS ==========

export async function fetchServicos(): Promise<Servico[]> {
  await delay(200);
  return [...servicosMock];
}

export async function createServico(servico: Omit<Servico, 'id'>): Promise<Servico> {
  await delay(200);
  const novoServico: Servico = {
    ...servico,
    id: Math.max(...servicosMock.map(s => s.id)) + 1
  };
  servicosMock.push(novoServico);
  return novoServico;
}

export async function updateServico(id: number, dados: Partial<Servico>): Promise<Servico | null> {
  await delay(200);
  const index = servicosMock.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  servicosMock[index] = { ...servicosMock[index], ...dados };
  return servicosMock[index];
}

export async function deleteServico(id: number): Promise<boolean> {
  await delay(200);
  const index = servicosMock.findIndex(s => s.id === id);
  if (index === -1) return false;
  
  servicosMock.splice(index, 1);
  return true;
}

// ========== CONFIGURAÇÕES ==========

export async function fetchConfiguracoes(): Promise<ConfiguracoesBarbearia> {
  await delay(200);
  return { ...configuracoesMock };
}

export async function updateConfiguracoes(config: Partial<ConfiguracoesBarbearia>): Promise<ConfiguracoesBarbearia> {
  await delay(200);
  Object.assign(configuracoesMock, config);
  return { ...configuracoesMock };
}

// ========== HELPERS ==========

export function gerarHorariosDisponiveis(data: string, config: ConfiguracoesBarbearia): string[] {
  const horarios: string[] = [];
  const [horaInicio, minInicio] = config.horarioInicio.split(':').map(Number);
  const [horaFim, minFim] = config.horarioFim.split(':').map(Number);
  
  let hora = horaInicio;
  let min = minInicio;
  
  while (hora < horaFim || (hora === horaFim && min <= minFim)) {
    const horarioStr = `${hora.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    
    // Verifica se horário já está ocupado
    const ocupado = agendamentosMock.some(
      a => a.data === data && a.horario === horarioStr && a.status !== 'cancelado'
    );
    
    if (!ocupado) {
      horarios.push(horarioStr);
    }
    
    min += config.intervaloMinutos;
    if (min >= 60) {
      hora += Math.floor(min / 60);
      min = min % 60;
    }
  }
  
  return horarios;
}

export function formatarData(data: string): string {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function formatarPreco(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
