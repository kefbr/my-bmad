export type ReportSource = "excel" | "bmad" | "manual";

export interface SlideRef {
  number: number;
  title: string;
  image: string;
  /** Where the numbers on this slide will come from on the weekly update. */
  source: ReportSource;
}

export interface FrenteRow {
  activity: string;
  owner: "Foursys" | "Equifax";
  status: "Concluído" | "Em Andamento" | "À Iniciar";
  done: string;
  planned: string;
  due: string;
}

export interface FrenteSection {
  title: string;
  rows: FrenteRow[];
}

export interface Frente {
  id: string;
  slide: number;
  title: string;
  subtitle: string;
  source: "excel";
  done: string;
  planned: string;
  sections: FrenteSection[];
}

const slide = (
  number: number,
  title: string,
  source: ReportSource,
): SlideRef => ({
  number,
  title,
  image: `/status-report/slides/slide-${String(number).padStart(2, "0")}.png`,
  source,
});

export const reportDate = "08/10/2026";

export const slides: SlideRef[] = [
  slide(1, "Capa", "manual"),
  slide(2, "Cronograma oficial", "bmad"),
  slide(3, "Cronograma · Fase 1", "bmad"),
  slide(4, "Cronograma · Fase 2", "bmad"),
  slide(5, "Andamento quinzenal", "bmad"),
  slide(6, "Backlog e sprints", "bmad"),
  slide(7, "Performance do time", "manual"),
  slide(8, "Frente funcional", "excel"),
  slide(9, "Frente tecnologia", "excel"),
  slide(10, "Frente integração", "excel"),
  slide(11, "Consolidado", "excel"),
  slide(12, "Semana", "manual"),
  slide(13, "Riscos", "manual"),
  slide(14, "Encerramento", "manual"),
];

function row(
  activity: string,
  owner: FrenteRow["owner"],
  status: FrenteRow["status"],
  done: string,
  planned: string,
  due: string,
): FrenteRow {
  return { activity, owner, status, done, planned, due };
}

const done = (
  activity: string,
  owner: FrenteRow["owner"],
  due: string,
): FrenteRow => row(activity, owner, "Concluído", "100%", "100%", due);

export const frentes: Frente[] = [
  {
    id: "funcional",
    slide: 8,
    title: "Frente funcional",
    subtitle: "Definição de Produto · 10 atividades",
    source: "excel",
    done: "55,5%",
    planned: "48,3%",
    sections: [
      {
        title: "Definição de Produto",
        rows: [
          done("Construção de Documento de Produto", "Foursys", "29/08/2026"),
          done("Validação de Documento de Produto", "Equifax", "29/08/2026"),
          done(
            "Priorização das funcionalidades pelos gestores",
            "Equifax",
            "29/08/2026",
          ),
          done("Definição de Fases de Desenvolvimento", "Foursys", "30/08/2026"),
          done("Criação de Cards no JIRA", "Foursys", "30/08/2026"),
          done("Divisão dos cards em Sprints", "Foursys", "02/09/2026"),
          done(
            "Criação da Engenharia de Software dos Componentes (12)",
            "Foursys",
            "18/09/2026",
          ),
          done(
            "Refinamento Técnico com o time de Devs (3 sprints mínimo)",
            "Foursys",
            "30/08/2026",
          ),
          done(
            "Validação de data final de Entrega da Fase 1 (MVP)",
            "Foursys",
            "18/09/2026",
          ),
          row(
            "Ciclo de Desenvolvimento - Fase 1 e 2",
            "Foursys",
            "Em Andamento",
            "50,0%",
            "42,0%",
            "31/01/2027",
          ),
        ],
      },
    ],
  },
  {
    id: "tecnologia",
    slide: 9,
    title: "Frente tecnologia",
    subtitle: "Ambiente e Infraestrutura · 11 atividades",
    source: "excel",
    done: "69,0%",
    planned: "65,8%",
    sections: [
      {
        title: "Ambiente e Infraestrutura",
        rows: [
          done(
            "Desenho de Arquitetura Base Projeto (Foursys)",
            "Foursys",
            "12/08/2026",
          ),
          done(
            "Adequação do Desenho para padrão interno Equifax",
            "Equifax",
            "31/08/2026",
          ),
          done(
            "Validação da Arquitetura do Sistema (Security)",
            "Equifax",
            "31/08/2026",
          ),
          done("Criação das BAPs dos Sistema", "Foursys", "21/08/2026"),
          done(
            "Criação de Card para Pedido de Infraestrutura (GCP)",
            "Foursys",
            "19/08/2026",
          ),
          done(
            "Configuração do Ambiente de Desenvolvimento",
            "Equifax",
            "31/08/2026",
          ),
          done(
            "Configuração da Esteira de Desenvolvimento (Pipelines)",
            "Equifax",
            "30/09/2026",
          ),
          row(
            "Liberação de Acessos às Bases e Tabelas Iniciais",
            "Equifax",
            "Em Andamento",
            "50%",
            "50%",
            "30/10/2026",
          ),
          row(
            "Validação da Capacity de Consultas aos Bancos de Dados",
            "Equifax",
            "Em Andamento",
            "50%",
            "50%",
            "30/10/2026",
          ),
          row(
            "Criação e Modelagem das Bases de Dados do Projeto",
            "Foursys",
            "Em Andamento",
            "50%",
            "42,0%",
            "30/11/2026",
          ),
          row(
            "Configuração SDWAN",
            "Foursys",
            "Em Andamento",
            "10%",
            "0%",
            "30/11/2026",
          ),
        ],
      },
    ],
  },
  {
    id: "integracao",
    slide: 10,
    title: "Frente integração",
    subtitle: "PagerDuty, SMTP, Saviynt, ServiceNow · 15 atividades",
    source: "excel",
    done: "2,5%",
    planned: "0,0%",
    sections: [
      {
        title: "Geração de Ocorrências (ServiceNow)",
        rows: [
          row(
            "Detalhamento de acesso a API do ServiceNow",
            "Equifax",
            "À Iniciar",
            "0%",
            "0%",
            "30/11/2026",
          ),
          row(
            "Detalhamento do funcionamento do ServiceNow (documentação)",
            "Equifax",
            "Em Andamento",
            "10%",
            "0%",
            "30/11/2026",
          ),
          row(
            "Detalhamento do Fluxo de Comunicação do ServiceNow",
            "Equifax",
            "Em Andamento",
            "10%",
            "0%",
            "30/11/2026",
          ),
          row(
            "Criação do Gerenciamento das Ocorrências Cockpit x ServiceNow",
            "Foursys",
            "À Iniciar",
            "0%",
            "0%",
            "20/01/2027",
          ),
          row(
            "Reavaliações funcionais de acordo com a especificação do Cockpit",
            "Foursys",
            "À Iniciar",
            "0%",
            "0%",
            "30/11/2026",
          ),
          row(
            "Acessos e Permissões",
            "Equifax",
            "À Iniciar",
            "0%",
            "0%",
            "30/11/2026",
          ),
        ],
      },
      {
        title: "Comunicação de Status de Fase (PagerDuty)",
        rows: [
          row(
            "Detalhamento de acesso a API do PagerDuty",
            "Equifax",
            "Em Andamento",
            "20%",
            "0%",
            "30/11/2026",
          ),
          row(
            "Detalhamento do funcionamento do PagerDuty (documentação)",
            "Equifax",
            "Em Andamento",
            "20%",
            "0%",
            "30/11/2026",
          ),
          row(
            "Criação do Gerenciamento das Comunicações Cockpit x PagerDuty",
            "Foursys",
            "À Iniciar",
            "0%",
            "0%",
            "20/01/2027",
          ),
          row(
            "Reavaliações funcionais de acordo com a especificação do Cockpit",
            "Foursys",
            "À Iniciar",
            "0%",
            "0%",
            "30/11/2026",
          ),
          row(
            "Acessos e Permissões",
            "Equifax",
            "À Iniciar",
            "0%",
            "0%",
            "30/11/2026",
          ),
        ],
      },
      {
        title: "Login e Permissões de Acessos (Saviynt)",
        rows: [
          row(
            "Detalhamento de acesso a API do Saviynt",
            "Equifax",
            "À Iniciar",
            "0%",
            "0%",
            "30/11/2026",
          ),
          row(
            "Detalhamento do funcionamento do Saviynt (documentação)",
            "Equifax",
            "À Iniciar",
            "0%",
            "0%",
            "30/11/2026",
          ),
          row(
            "Detalhamento de quais serão as Roles do sistema",
            "Foursys",
            "À Iniciar",
            "0%",
            "0%",
            "15/11/2026",
          ),
          row(
            "Reavaliações funcionais de acordo com a especificação do Cockpit",
            "Foursys",
            "À Iniciar",
            "0%",
            "0%",
            "15/11/2026",
          ),
        ],
      },
    ],
  },
];

export const consolidated = {
  slide: 11,
  source: "excel" as const,
  foursys: { done: "53,8%", planned: "47,0%" },
  equifax: { done: "68,8%", planned: "67,2%" },
  total: { done: "54,8%", planned: "48,4%" },
  deviation: { foursys: "6,5%", equifax: "5,3%" },
};
