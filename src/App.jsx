import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Upload as UploadIcon, FileSpreadsheet, Users, LogOut,
  Search, Filter, Download, CheckCircle2, AlertCircle, TrendingUp, DollarSign,
  FileText, ChevronLeft, ChevronRight, ShieldCheck, Menu, X, Eye, EyeOff,
  UserPlus, Trash2, Edit2, Save, XCircle, AlertTriangle, Target, PlusCircle,
  BarChart3, Tag, Clock, History, FileDown, Plus
} from 'lucide-react';
// CORRIGIDO #19: Removidos imports 'Settings' e 'Minus' que não eram utilizados em nenhum lugar do código.
import * as XLSX from 'xlsx';

// ═══════════════════════════════════════════════════════════════
// CONSTANTES GLOBAIS
// ═══════════════════════════════════════════════════════════════

const MONTHS = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },   { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },    { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },   { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
];

const generateYears = () => {
  const y = new Date().getFullYear();
  return Array.from({ length: 11 }, (_, i) => y - 5 + i);
};

const YEARS        = generateYears();
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = String(new Date().getMonth() + 1).padStart(2, '0');
const USER_ROLES   = ['master', 'gerente', 'analista', 'visualizador'];

// Tipos de upload — centralizado para reaproveitar em modelo e histórico
const UPLOAD_TYPES = [
  { value: 'extrato',   label: 'Upload Extrato',     color: 'purple' },
  { value: 'recalculo', label: 'Upload Recálculo',  color: 'blue'   },
  { value: 'metas',     label: 'Upload Metas',       color: 'emerald'},
];

// Colunas modelo para download — define o template CSV de cada tipo
const TEMPLATE_COLUMNS = {
  extrato: [
    'LOGIN VENDEDOR', 'CNPJ', 'NOME REDE', 'SEGMENTAÇÃO', 'CANAL', 'CNPJ / CPF CLIENTE', 'NOME CLIENTE', 'SEGMENTO', 'OPERAÇÃO', 'MOVIMENTO PRINCIPAL', 'REGRA DE CÁLCULO', 'DETALHE CÁLCULO', 'QUANTIDADE', 'ID COMISSIONAMENTO', 'ORDEM / PEDIDO', 'NÚMERO LINHA', 'UF LINHA / CLIENTE', 'COMPETÊNCIA', 'DATA EVENTO', 'DATA BAIXA', 'DATA ÚLTIMO MOVIMENTO', 'DIAS SUSPENSÃO', 'CONTAGEM BAIXA', 'SUBSCRIÇÃO MÓVEL', 'RPON SVA', 'RPON VOZ', 'RPON BL', 'RPON TV', 'CÓDIGO PRODUTO ATUAL', 'PRODUTO ATUAL', 'VALOR PRODUTO ATUAL', 'VALOR DESCONTO', 'CÓDIGO PRODUTO ANTERIOR', 'PRODUTO ANTERIOR', 'VALOR PRODUTO ANTERIOR', 'PRODUTOS FIXA', 'VALOR LÍQUIDO / DELTA', 'ICCID / SERIAL', 'FATOR', 'INDICADORES', 'VALOR APURADO', 'REL', 'DOCUMENTO SAP', 'FORNECEDOR SAP', 'ITEM RECÁLCULO', 'MOTIVO ITEM RECÁLCULO', 'OBSERVAÇÃO', 'CHAVE', 'GRUPO COMISSÃO', 'ESTEIRA', 'TIPO COMISSÃO', 'CONSULTOR', 'SUPERVISOR', 'TIME', 'REGIONAL', 'REF'
  ],
  recalculo: [
    'LOGIN VENDEDOR', 'CNPJ', 'NOME REDE', 'SEGMENTAÇÃO', 'CANAL', 'CNPJ / CPF CLIENTE', 'NOME CLIENTE', 'SEGMENTO', 'OPERAÇÃO', 'MOVIMENTO PRINCIPAL', 'REGRA DE CÁLCULO', 'DETALHE CÁLCULO', 'QUANTIDADE', 'ID COMISSIONAMENTO', 'ORDEM / PEDIDO', 'NÚMERO LINHA', 'UF LINHA / CLIENTE', 'COMPETÊNCIA', 'DATA EVENTO', 'DATA BAIXA', 'DATA ÚLTIMO MOVIMENTO', 'DIAS SUSPENSÃO', 'CONTAGEM BAIXA', 'SUBSCRIÇÃO MÓVEL', 'RPON SVA', 'RPON VOZ', 'RPON BL', 'RPON TV', 'CÓDIGO PRODUTO ATUAL', 'PRODUTO ATUAL', 'VALOR PRODUTO ATUAL', 'VALOR DESCONTO', 'CÓDIGO PRODUTO ANTERIOR', 'PRODUTO ANTERIOR', 'VALOR PRODUTO ANTERIOR', 'PRODUTOS FIXA', 'VALOR LÍQUIDO / DELTA', 'ICCID / SERIAL', 'FATOR', 'INDICADORES', 'VALOR APURADO', 'REL', 'DOCUMENTO SAP', 'FORNECEDOR SAP', 'ITEM RECÁLCULO', 'MOTIVO ITEM RECÁLCULO', 'OBSERVAÇÃO', 'CHAVE', 'GRUPO COMISSÃO', 'ESTEIRA', 'TIPO COMISSÃO', 'CONSULTOR', 'SUPERVISOR', 'TIME', 'REGIONAL', 'REF'
  ],
  metas: ['CONSULTOR','SUPERVISOR','COORDENADOR','TIME','REGIONAL','INDICADOR','META','VALOR REALIZADO'],
};

// ═══════════════════════════════════════════════════════════════
// VALIDAÇÕES
// ═══════════════════════════════════════════════════════════════

const CRED = {
  username: { min: 3, max: 30, pattern: /^[a-zA-Z0-9._@-]+$/ },
  password: { min: 8, max: 64 },
};

function validateUsername(v) {
  if (!v?.trim()) return 'Campo obrigatório.';
  if (v.length < CRED.username.min) return `Mínimo ${CRED.username.min} caracteres.`;
  if (v.length > CRED.username.max) return `Máximo ${CRED.username.max} caracteres.`;
  if (!CRED.username.pattern.test(v)) return 'Apenas letras, números e . _ @ - são permitidos.';
  return '';
}

function validatePassword(v) {
  if (!v) return 'Campo obrigatório.';
  if (v.length < CRED.password.min) return `Mínimo ${CRED.password.min} caracteres.`;
  if (v.length > CRED.password.max) return `Máximo ${CRED.password.max} caracteres.`;
  if (!/[A-Z]/.test(v)) return 'Deve conter ao menos uma letra maiúscula.';
  if (!/[0-9]/.test(v)) return 'Deve conter ao menos um número.';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(v)) return 'Deve conter ao menos um caractere especial.';
  return '';
}

function validateCompetencia(month, year) {
  const errs = [];
  if (!month) errs.push('Mês é obrigatório.');
  if (!year)  errs.push('Ano é obrigatório.');
  const y = parseInt(year, 10);
  const cy = new Date().getFullYear();
  if (y < cy - 5 || y > cy + 5) errs.push(`Ano fora do intervalo (${cy - 5}–${cy + 5}).`);
  return errs;
}

// ═══════════════════════════════════════════════════════════════
// DADOS INICIAIS
// ═══════════════════════════════════════════════════════════════

const INITIAL_USERS = [
  { id: 1, username: 'teste@msconnect.com',  name: 'Usuário Teste (Master)', role: 'master',      active: true,  createdAt: '2024-01-15' },
  { id: 2, username: 'gerente@empresa.com',  name: 'Gerente Comercial',      role: 'gerente',     active: true,  createdAt: '2024-03-10' },
  { id: 3, username: 'analista@empresa.com', name: 'Analista de Comissões',  role: 'analista',    active: false, createdAt: '2024-06-01' },
];

// Domínios de filtro — cada chave vira um filtro nos dashboards
const INITIAL_DOMAINS = {
  regional:      ['PR', 'SC', 'RS', 'SP', 'RJ', 'MG'],
  time:          ['CARTEIRA', 'AQUISIÇÃO', 'NOVOS NEGÓCIOS', 'RETENÇÃO', 'B2B DIRETO'],
  supervisor:    ['Carlos', 'Roberto', 'Fernanda', 'Marcos'],
  grupoComissao: ['Carteira recorrente', 'Vendas Novas', 'Aparelhos', 'Upgrade'],
  esteira:       ['MOVEL', 'FIXA', 'BANDA LARGA', 'SVA', 'DADOS AVANÇADOS'],
  tipoComissao:  ['Plano', 'Aparelho', 'Serviço'],
};

const INITIAL_METAS = [
  { id: 1, consultor: 'João Silva',   supervisor: 'Carlos',  time: 'AQUISIÇÃO',      regional: 'PR', coordenador: 'Ana',    meta: 50000, indicador: 'Receita Bruta', valor: 45000 },
  { id: 2, consultor: 'Maria Souza',  supervisor: 'Carlos',  time: 'CARTEIRA',       regional: 'PR', coordenador: 'Ana',    meta: 30000, indicador: 'Receita Bruta', valor: 32000 },
  { id: 3, consultor: 'Pedro Alves',  supervisor: 'Roberto', time: 'NOVOS NEGÓCIOS', regional: 'SC', coordenador: 'Marcos', meta: 40000, indicador: 'Receita Bruta', valor: 25000 },
  { id: 4, consultor: 'Lucia Costa',  supervisor: 'Roberto', time: 'B2B DIRETO',     regional: 'RS', coordenador: 'Marcos', meta: 60000, indicador: 'Receita Bruta', valor: 60500 },
];

const MOCK_HISTORIC_DATA = [
  { month: 'Fev', value: 120000 }, { month: 'Mar', value: 135000 },
  { month: 'Abr', value: 125000 }, { month: 'Mai', value: 150000 },
  { month: 'Jun', value: 180000 }, { month: 'Jul', value: 170000 },
  { month: 'Ago', value: 190000 }, { month: 'Set', value: 210000 },
  { month: 'Out', value: 205000 }, { month: 'Nov', value: 230000 },
  { month: 'Dez', value: 250000 }, { month: 'Jan', value: 240000 },
];

// CORRIGIDO #20: Dados mock fixos para evitar re-renders causados por Math.random() dentro de useMemo.
// Antes, generateMockTableData() usava Math.random(), o que fazia os dados mudarem a cada reavaliação.
const MOCK_TABLE_DATA = Array.from({ length: 50 }, (_, i) => {
  const statusOpts = ['OK', 'OK', 'OK', 'OK', 'Divergente'];
  const status = statusOpts[i % statusOpts.length];
  return {
    ID: `TRX-${1000 + i + 1}`,
    Consultor: `Consultor ${(i % 20) + 1}`,
    Cliente: `Empresa Parceira ${String.fromCharCode(65 + (i % 26))} LTDA`,
    Produto: i % 3 === 0 ? 'Plano LD VIP' : 'Banda Larga Fibra',
    'Valor Prévia': ((i + 1) * 9.87).toFixed(2),
    'Valor Extrato': status === 'OK' ? '-' : ((i + 1) * 7.43).toFixed(2),
    Status: status,
    _motivo: status === 'Divergente' ? 'Valor Inferior' : null,
  };
});

// ═══════════════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════════════

// CORRIGIDO #10: Adicionada sanitização de CSV Injection.
// Células que iniciam com =, +, -, @ são prefixadas com apóstrofo para evitar
// execução de fórmulas caso o CSV seja aberto em Excel/Sheets.
const sanitizeCSVCell = (val) => {
  if (typeof val === 'string' && /^[=+\-@]/.test(val)) {
    return "'" + val;
  }
  return val;
};

const parseCSV = (text) => {
  const lines = text.split('\n');
  if (!lines.length) return [];
  const headers = lines[0].split(',').map(h => h.replace(/["\r]/g, '').trim());
  const data = [];
  const limit = Math.min(lines.length, 5000);
  for (let i = 1; i < limit; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
    const row = {};
    headers.forEach((h, idx) => {
      const raw = values[idx] ? values[idx].replace(/["\r]/g, '').trim() : '';
      row[h] = sanitizeCSVCell(raw); // CORRIGIDO #10
    });
    row._status = Math.random() > 0.85 ? 'divergente' : 'ok';
    if (row._status === 'divergente') row._motivo = Math.random() > 0.5 ? 'Valor Inferior' : 'Venda Não Paga';
    data.push(row);
  }
  return data;
};

// Gera e dispara download de XLSX modelo
const downloadTemplate = (type) => {
  // 1. Pegar as colunas definidas no TEMPLATE_COLUMNS
  const cols = TEMPLATE_COLUMNS[type];
  if (!cols) return;

  // 2. Criar uma folha (worksheet) com a linha de cabeçalhos
  const worksheet = XLSX.utils.aoa_to_sheet([cols]);

  // 3. Criar o livro de Excel (workbook) e anexar a folha
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Modelo");

  // 4. Gerar o nome do ficheiro e forçar o download
  const dataHoje = new Date().toISOString().split('T')[0];
  const fileName = `modelo_${type}_${dataHoje}.xlsx`;
  
  XLSX.writeFile(workbook, fileName);
};

// CORRIGIDO #9: Geração de IDs via crypto.randomUUID() em vez de Date.now().
// Date.now() é previsível e pode colidir em operações rápidas.
// crypto.randomUUID() gera UUIDs únicos de forma segura.
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para ambientes que não suportam crypto.randomUUID
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE RAIZ
// ═══════════════════════════════════════════════════════════════

export default function App() {
  // CORRIGIDO #1/#2 (parcial — frontend only):
  // Antes: o objeto completo do usuário era salvo no localStorage e
  // a sessão era reconstruída sem nenhuma revalidação, permitindo forjar
  // uma sessão com role:'master' editando o localStorage manualmente.
  //
  // Agora: salvamos apenas name e role (sem dados sensíveis extras).
  // O role vindo do localStorage é VALIDADO contra USER_ROLES antes de ser aceito.
  // Se inválido, a sessão é descartada e o usuário precisa logar novamente.
  //
  // ⚠️ AÇÃO NECESSÁRIA NO BACKEND (ver relatório):
  // A solução completa exige que a sessão seja validada via endpoint /api/me
  // usando um token JWT em cookie httpOnly a cada inicialização do app.
  // O localStorage nunca deve ser a fonte de verdade para autenticação.

  const [loggedUser, setLoggedUser] = useState(() => {
    try {
      const saved = localStorage.getItem('@ExtratoConnect:user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Valida que o role salvo é um valor legítimo antes de aceitar
      if (!parsed?.role || !USER_ROLES.includes(parsed.role)) {
        localStorage.removeItem('@ExtratoConnect:user');
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem('@ExtratoConnect:user');
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const saved = localStorage.getItem('@ExtratoConnect:user');
      if (!saved) return false;
      const parsed = JSON.parse(saved);
      // Só considera autenticado se o role for válido
      return !!(parsed?.role && USER_ROLES.includes(parsed.role));
    } catch {
      return false;
    }
  });

  const [currentView, setCurrentView]               = useState('dashboard');
  const [sidebarOpen, setSidebarOpen]               = useState(true);
  const [parsedData, setParsedData]                 = useState([]);
  const [isProcessing, setIsProcessing]             = useState(false);
  const [activeCompetencia, setActiveCompetencia]   = useState({ month: CURRENT_MONTH, year: CURRENT_YEAR });
  const [users, setUsers]                           = useState(INITIAL_USERS);
  const [metasData, setMetasData]                   = useState(INITIAL_METAS);
  const [domains, setDomains]                       = useState(INITIAL_DOMAINS);
  const [uploadHistory, setUploadHistory]           = useState([]);
  // CORRIGIDO #15: Estado para o toast de feedback após uploads
  const [uploadToast, setUploadToast]               = useState(null);

  // Exibe toast e remove automaticamente após 4 segundos
  const showToast = useCallback((message, type = 'success') => {
    setUploadToast({ message, type });
    setTimeout(() => setUploadToast(null), 4000);
  }, []);

  const handleLogin = useCallback((user) => {
    // CORRIGIDO #3: Valida o role recebido da API antes de aceitar.
    // Se a API retornar um cargo inválido, usa 'visualizador' como fallback seguro.
    const safeRole = USER_ROLES.includes(user.role) ? user.role : 'visualizador';
    const safeUser = { name: user.name, role: safeRole };
    setLoggedUser(safeUser);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
    localStorage.setItem('@ExtratoConnect:user', JSON.stringify(safeUser));
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setLoggedUser(null);
    setParsedData([]);
    setCurrentView('dashboard');
    localStorage.removeItem('@ExtratoConnect:user');
  }, []);

  if (!isAuthenticated) {
    return <LoginScreen users={users} onLogin={handleLogin} />;
  }

  const competenciaLabel = `${activeCompetencia.month}/${activeCompetencia.year}`;
  const userRole = loggedUser?.role ?? 'visualizador';
  const isMaster = userRole === 'master';

  const viewTitle = {
    dashboard: 'Dashboard Principal',
    metas:     'Dashboard e Gestão de Metas',
    analysis:  'Análise Prévia vs Extrato',
    upload:    'Upload de Bases',
    users:     'Gestão de Usuários',
    domains:   'Cadastro de Domínios de Filtros',
  }[currentView] ?? 'Dashboard';

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-slate-800 overflow-hidden">

      {/* ── SIDEBAR ── */}
      <div className={`bg-slate-900 text-slate-300 w-64 flex-shrink-0 flex flex-col transition-all duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full absolute h-full z-20'}`}>

        <div className="h-16 flex items-center px-6 border-b border-slate-800 font-bold text-white tracking-wider flex-shrink-0">
          <ShieldCheck className="w-6 h-6 mr-2 text-purple-500" />
          EXTRATO MS CONNECT
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs uppercase font-semibold text-slate-500 mb-4 mt-2">Menu Principal</div>
          <nav className="space-y-1">
            <NavItem icon={<LayoutDashboard />} label="Dashboard Principal"   active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
            <NavItem icon={<BarChart3 />}        label="Dashboard Metas"       active={currentView === 'metas'}     onClick={() => setCurrentView('metas')} />
            <NavItem icon={<FileSpreadsheet />}  label="Análise vs Extrato"    active={currentView === 'analysis'}  onClick={() => setCurrentView('analysis')} />

            {isMaster && (
              <>
                <div className="text-xs uppercase font-semibold text-slate-500 mb-2 mt-8">Administração</div>
                <NavItem icon={<UploadIcon />} label="Upload de Bases"      active={currentView === 'upload'}  onClick={() => setCurrentView('upload')} />
                <NavItem icon={<Tag />}         label="Domínios de Filtros"  active={currentView === 'domains'} onClick={() => setCurrentView('domains')} />
                <NavItem icon={<Users />}       label="Gestão de Usuários"   active={currentView === 'users'}   onClick={() => setCurrentView('users')} />
              </>
            )}
          </nav>
        </div>

        {/* Rodapé — nome e role reais do usuário logado */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center mb-4">
            <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {loggedUser?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="ml-3 overflow-hidden">
              <div className="text-sm font-medium text-white truncate">{loggedUser?.name ?? 'Usuário'}</div>
              <div className="text-xs text-slate-400 capitalize">{userRole}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center w-full text-slate-400 hover:text-white transition-colors text-sm">
            <LogOut className="w-4 h-4 mr-2" /> Sair do sistema
          </button>
        </div>
      </div>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-10 shadow-sm">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(s => !s)} className="p-2 mr-4 rounded-md text-gray-500 hover:bg-gray-100 lg:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-slate-800">{viewTitle}</h1>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200 flex items-center">
            Competência Ativa: <strong className="ml-1 text-slate-700">{competenciaLabel}</strong>
          </span>
        </header>

        {/* CORRIGIDO #15: Toast de feedback de upload */}
        {uploadToast && (
          <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all
            ${uploadToast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {uploadToast.type === 'success'
              ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
            {uploadToast.message}
            <button onClick={() => setUploadToast(null)} className="ml-2 text-current opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          {/* CORRIGIDO #7: Guard de autorização nas views administrativas.
              Se um usuário não-master tentar acessar upload/domains/users
              via manipulação de estado (DevTools), é redirecionado ao dashboard
              com uma mensagem de acesso negado. */}
          {currentView === 'dashboard' && <DashboardView data={parsedData} domains={domains} />}
          {currentView === 'metas'     && <MetasDashboardView data={metasData} setMetasData={setMetasData} domains={domains} />}
          {currentView === 'analysis'  && <AnalysisView data={parsedData} />}
          {currentView === 'upload'    && (
            isMaster
              ? <UploadView
                  setParsedData={setParsedData}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                  setCurrentView={setCurrentView}
                  setActiveCompetencia={setActiveCompetencia}
                  uploadHistory={uploadHistory}
                  setUploadHistory={setUploadHistory}
                  loggedUser={loggedUser}
                  showToast={showToast}
                />
              : <AccessDeniedView onBack={() => setCurrentView('dashboard')} />
          )}
          {currentView === 'domains' && (
            isMaster
              ? <DomainsView domains={domains} setDomains={setDomains} />
              : <AccessDeniedView onBack={() => setCurrentView('dashboard')} />
          )}
          {currentView === 'users' && (
            isMaster
              ? <UsersView users={users} setUsers={setUsers} />
              : <AccessDeniedView onBack={() => setCurrentView('dashboard')} />
          )}
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CORRIGIDO #7: Componente de acesso negado
// Exibido quando um usuário sem permissão tenta acessar uma view restrita.
// ═══════════════════════════════════════════════════════════════

function AccessDeniedView({ onBack }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-10">
      <ShieldCheck className="w-16 h-16 text-red-300 mb-4" />
      <h2 className="text-2xl font-bold text-slate-700 mb-2">Acesso Negado</h2>
      <p className="text-gray-500 mb-6 max-w-sm">
        Você não tem permissão para acessar esta área. Apenas usuários com perfil <strong>master</strong> podem acessar as funções de administração.
      </p>
      <button onClick={onBack} className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
        Voltar ao Dashboard
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════

function LoginScreen({ users, onLogin }) {
  // CORRIGIDO #4/#5: Removido e-mail pré-preenchido e credenciais demo visíveis na tela.
  // Antes: useState('teste@msconnect.com') expunha um login real na interface.
  // Antes: bloco <p> exibia usuário e senha Demo publicamente.
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors]             = useState({});
  const [loginError, setLoginError]     = useState('');
  const [attempts, setAttempts]         = useState(0);
  const [blocked, setBlocked]           = useState(false);
  const [blockTimer, setBlockTimer]     = useState(0);
  // CORRIGIDO #16: Estado de loading durante o fetch da API
  const [isLoading, setIsLoading]       = useState(false);

  useEffect(() => { if (attempts >= 5) { setBlocked(true); setBlockTimer(30); } }, [attempts]);

  useEffect(() => {
    if (!blocked) return;
    if (blockTimer > 0) {
      const t = setTimeout(() => setBlockTimer(b => b - 1), 1000);
      return () => clearTimeout(t);
    }
    setBlocked(false);
    setAttempts(0);
  }, [blocked, blockTimer]);

  const validate = () => {
    const errs = {};
    const uErr = validateUsername(email);
    if (uErr) errs.email = uErr;
    if (!password) errs.password = 'Campo obrigatório.';
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (blocked || !validate()) return;

    // CORRIGIDO #16: Ativa o estado de loading antes do fetch
    setIsLoading(true);
    setLoginError('');

    try {
      // CORRIGIDO #17: Adicionado AbortController para timeout de 10s.
      // Antes, uma falha de rede genérica retornava sempre 'Erro ao conectar'.
      // Agora distingue timeout de erro de rede.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const resposta = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, senha: password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const dados = await resposta.json();

      if (resposta.ok && dados.sucesso) {
        setLoginError('');
        onLogin({ name: dados.usuario, role: dados.cargo });
      } else {
        setAttempts(a => a + 1);
        setLoginError(dados.erro || `Credenciais inválidas. Tentativa ${attempts + 1}/5.`);
      }

    } catch (error) {
      // CORRIGIDO #17: Mensagem de erro diferenciada por tipo de falha
      if (error.name === 'AbortError') {
        setLoginError('Tempo de resposta esgotado. Verifique sua conexão e tente novamente.');
      } else {
        setLoginError('Não foi possível conectar ao servidor. Verifique sua conexão.');
      }
    } finally {
      // CORRIGIDO #16: Desativa loading independente do resultado
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border-t-4 border-purple-600">
        <div className="flex items-center justify-center mb-8 text-slate-800">
          <ShieldCheck className="w-10 h-10 mr-2 text-purple-600" />
          <h1 className="text-3xl font-bold tracking-tight">Extrato MS Connect</h1>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail corporativo</label>
            <input
              type="email" value={email} disabled={blocked || isLoading}
              onChange={e => { setEmail(e.target.value); setErrors(er => ({ ...er, email: '' })); }}
              className={`mt-1 block w-full rounded-md shadow-sm p-2.5 border ${errors.email ? 'border-red-400' : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'}`}
              placeholder="seunome@empresa.com" autoComplete="username"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'} value={password} disabled={blocked || isLoading}
                onChange={e => { setPassword(e.target.value); setErrors(er => ({ ...er, password: '' })); }}
                className={`block w-full rounded-md shadow-sm p-2.5 border pr-10 ${errors.password ? 'border-red-400' : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'}`}
                placeholder="••••••••" autoComplete="current-password"
              />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          {loginError && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{loginError}
            </div>
          )}
          {blocked && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Conta bloqueada. Tente em {blockTimer}s.
            </div>
          )}

          {/* CORRIGIDO #16: Botão exibe spinner e texto "Entrando..." durante o fetch */}
          <button
            type="submit" disabled={blocked || isLoading}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Entrando...
              </>
            ) : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">Ambiente seguro. Monitoramento de acesso ativo.</p>
        {/* CORRIGIDO #4: Removido bloco que exibia credenciais demo publicamente */}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// CORRIGIDO #11: Filtros agora têm estado e filtram os dados reais.
// Antes: FilterSelect não tinha value nem onChange — era puramente decorativo.
// ═══════════════════════════════════════════════════════════════

function DashboardView({ data, domains }) {
  const hasData = data?.length > 0;

  // CORRIGIDO #11: Estado dos filtros — cada um controla sua seleção
  const [filterGrupo, setFilterGrupo]         = useState('Todos');
  const [filterEsteira, setFilterEsteira]     = useState('Todos');
  const [filterTipo, setFilterTipo]           = useState('Todos');
  const [filterSupervisor, setFilterSupervisor] = useState('Todos');
  const [filterTime, setFilterTime]           = useState('Todos');
  const [filterRegional, setFilterRegional]   = useState('Todos');

  // CORREÇÃO 7: Filtros agora usam os campos mapeados do banco (snake_case)
  // em vez dos cabeçalhos brutos do Excel (ex: 'GRUPO COMISSÃO').
  // Após o upload, os dados em parsedData têm chaves como grupo_comissao, equipe, etc.
  const filteredData = useMemo(() => {
    if (!hasData) return [];
    return data.filter(d =>
      (filterGrupo      === 'Todos' || d.grupo_comissao === filterGrupo) &&
      (filterEsteira    === 'Todos' || d.esteira        === filterEsteira) &&
      (filterTipo       === 'Todos' || d.tipo_comissao  === filterTipo) &&
      (filterSupervisor === 'Todos' || d.supervisor     === filterSupervisor) &&
      (filterTime       === 'Todos' || d.equipe         === filterTime) &&
      (filterRegional   === 'Todos' || d.regional       === filterRegional)
    );
  }, [data, hasData, filterGrupo, filterEsteira, filterTipo, filterSupervisor, filterTime, filterRegional]);

  const displayData   = hasData ? filteredData : [];
  // CORREÇÃO 7 (continuação): valor_apurado e _status usam os campos do banco
  const totalValue    = hasData ? displayData.reduce((a, c) => a + (parseFloat(c.valor_apurado) || 0), 0) : 1245000.50;
  const totalRows     = hasData ? displayData.length : 254302;
  const inconsist     = hasData ? displayData.filter(d => d._status === 'divergente').length : 1420;

  const mkOpts = (arr) => ['Todos', ...arr];

  const resetFilters = () => {
    setFilterGrupo('Todos'); setFilterEsteira('Todos'); setFilterTipo('Todos');
    setFilterSupervisor('Todos'); setFilterTime('Todos'); setFilterRegional('Todos');
  };

  const hasActiveFilters = [filterGrupo, filterEsteira, filterTipo, filterSupervisor, filterTime, filterRegional]
    .some(f => f !== 'Todos');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">

      {/* FILTROS — agora funcionais */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-600 flex items-center">
              <Filter className="w-4 h-4 mr-2" /> Filtros do Dashboard
            </h3>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="text-xs text-purple-600 hover:text-purple-800 underline">
                Limpar filtros
              </button>
            )}
          </div>
          {/* CORRIGIDO #12: Botão PDF desabilitado com tooltip — não tinha ação implementada */}
          <button
            disabled
            title="Exportação para PDF será disponibilizada em breve"
            className="text-sm flex items-center text-gray-400 bg-white border border-gray-200 px-3 py-1.5 rounded-lg cursor-not-allowed opacity-60">
            <Download className="w-4 h-4 mr-2" /> PDF
          </button>
        </div>
        {/* CORRIGIDO #11: Cada FilterSelect agora recebe value e onChange */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <FilterSelect label="Grupo Comissão" options={mkOpts(domains.grupoComissao)} value={filterGrupo}      onChange={setFilterGrupo} />
          <FilterSelect label="Esteira"        options={mkOpts(domains.esteira)}       value={filterEsteira}    onChange={setFilterEsteira} />
          <FilterSelect label="Tipo Comissão"  options={mkOpts(domains.tipoComissao)}  value={filterTipo}       onChange={setFilterTipo} />
          <FilterSelect label="Supervisor"     options={mkOpts(domains.supervisor)}    value={filterSupervisor} onChange={setFilterSupervisor} />
          <FilterSelect label="Time"           options={mkOpts(domains.time)}          value={filterTime}       onChange={setFilterTime} />
          <FilterSelect label="Regional"       options={mkOpts(domains.regional)}      value={filterRegional}   onChange={setFilterRegional} />
        </div>
        {!hasData && (
          <p className="text-xs text-purple-600 bg-purple-50 border border-purple-100 rounded-md px-3 py-2">
            ℹ️ Os filtros exibem os itens cadastrados em <strong>Domínios de Filtros</strong>. Importe um arquivo para cruzar com dados reais.
          </p>
        )}
        {hasData && hasActiveFilters && (
          <p className="text-xs text-purple-600 bg-purple-50 border border-purple-100 rounded-md px-3 py-2">
            ℹ️ Exibindo {displayData.length} de {data.length} registros conforme filtros aplicados.
          </p>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title="Valor Total Apurado"      value={`R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<DollarSign className="text-emerald-500" />} trend="+12.5% vs Mês Ant." trendUp />
        <KpiCard title="Linhas Processadas"       value={totalRows.toLocaleString('pt-BR')} icon={<FileText className="text-purple-500" />} subtitle="Competência atual" />
        <KpiCard title="Divergências Identificadas" value={inconsist.toLocaleString('pt-BR')} icon={<AlertCircle className="text-amber-500" />} trend="Ação Requerida" alert />
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-slate-400" /> Evolução de Comissionamento (12 Meses)
          </h3>
          <div className="h-64 flex items-end space-x-2 sm:space-x-3 justify-between pt-4 border-b border-gray-200">
            {MOCK_HISTORIC_DATA.map((item, i) => {
              const height = (item.value / 250000) * 100;
              return (
                <div key={i} className="flex flex-col items-center w-full group">
                  <div className="relative w-full flex justify-center h-full items-end pb-2">
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none transition-opacity whitespace-nowrap z-10">
                      R$ {item.value.toLocaleString('pt-BR')}
                    </div>
                    <div className={`w-full max-w-[36px] rounded-t-sm transition-all duration-500 hover:opacity-80 ${i === MOCK_HISTORIC_DATA.length - 1 ? 'bg-purple-600' : 'bg-purple-200'}`}
                      style={{ height: `${height}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 mt-2">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Composição por Tipo de Serviço</h3>
          <div className="space-y-4">
            <BarChartRow label="Voz móvel + ADC"  percentage={45} value="R$ 560.250"  color="bg-indigo-500" />
            <BarChartRow label="Banda larga"       percentage={25} value="R$ 311.250"  color="bg-purple-500" />
            <BarChartRow label="Dados Avançados"   percentage={15} value="R$ 186.750"  color="bg-cyan-500" />
            <BarChartRow label="VVN"               percentage={10} value="R$ 124.500"  color="bg-teal-500" />
            <BarChartRow label="Outros"            percentage={5}  value="R$ 62.250"   color="bg-slate-300" />
          </div>
        </div>
      </div>

      {!hasData && (
        <div className="bg-purple-50 text-purple-800 p-4 rounded-lg flex items-start border border-purple-100">
          <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Modo de Demonstração</h4>
            <p className="text-sm mt-1">Dados ilustrativos. Vá em "Upload de Bases" para importar o arquivo real.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD DE METAS
// CORRIGIDO #8: Confirmação de exclusão adicionada na tabela de metas.
// ═══════════════════════════════════════════════════════════════

function MetasDashboardView({ data, setMetasData, domains }) {
  const [isAdding, setIsAdding] = useState(false);
  const [filterTime, setFilterTime]         = useState('Todos');
  const [filterRegional, setFilterRegional] = useState('Todas');
  // CORRIGIDO #8: Estado para controlar qual meta está aguardando confirmação de exclusão
  const [deleteMetaConfirm, setDeleteMetaConfirm] = useState(null);
  const [newMeta, setNewMeta] = useState({
    consultor: '', supervisor: '', time: '', regional: '', coordenador: '', meta: '', indicador: 'Receita Bruta', valor: '',
  });

  const totalMeta      = data.reduce((a, c) => a + Number(c.meta), 0);
  const totalRealizado = data.reduce((a, c) => a + Number(c.valor), 0);
  const atingPercent   = totalMeta > 0 ? ((totalRealizado / totalMeta) * 100).toFixed(1) : 0;

  const filteredData = useMemo(() => data.filter(r =>
    (filterTime === 'Todos' || r.time === filterTime) &&
    (filterRegional === 'Todas' || r.regional === filterRegional)
  ), [data, filterTime, filterRegional]);

  const handleAddSubmit = () => {
    if (!newMeta.consultor || !newMeta.meta) return;
    // CORRIGIDO #9: Usa generateId() em vez de Date.now()
    setMetasData(prev => [...prev, { ...newMeta, id: generateId(), meta: Number(newMeta.meta), valor: Number(newMeta.valor) || 0 }]);
    setIsAdding(false);
    setNewMeta({ consultor: '', supervisor: '', time: '', regional: '', coordenador: '', meta: '', indicador: 'Receita Bruta', valor: '' });
  };

  const inp = (field) => ({
    value: newMeta[field],
    onChange: e => setNewMeta(m => ({ ...m, [field]: e.target.value })),
    className: 'w-full text-xs p-1.5 border border-purple-300 rounded bg-white',
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">

      {/* FILTROS — via domínios */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center flex-wrap">
          <h2 className="font-bold text-gray-800 flex items-center"><Target className="w-5 h-5 mr-2 text-purple-600" /> Acompanhamento de Metas</h2>
          <div className="h-6 w-px bg-gray-200 hidden sm:block" />
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center text-sm gap-2">
              <span className="text-gray-500">Time:</span>
              <select value={filterTime} onChange={e => setFilterTime(e.target.value)}
                className="border border-gray-200 bg-gray-50 text-slate-700 text-xs py-1.5 px-2 rounded-md focus:ring-purple-500">
                {['Todos', ...domains.time].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="flex items-center text-sm gap-2">
              <span className="text-gray-500">Regional:</span>
              <select value={filterRegional} onChange={e => setFilterRegional(e.target.value)}
                className="border border-gray-200 bg-gray-50 text-slate-700 text-xs py-1.5 px-2 rounded-md focus:ring-purple-500">
                {['Todas', ...domains.regional].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title="Meta Total"          value={`R$ ${totalMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}      icon={<Target className="text-blue-500" />} />
        <KpiCard title="Realizado Total"     value={`R$ ${totalRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<DollarSign className="text-emerald-500" />} />
        <div className={`bg-white p-6 rounded-xl shadow-sm border ${atingPercent >= 100 ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">% Atingimento Geral</p>
              <h4 className={`text-3xl font-bold mt-2 ${atingPercent >= 100 ? 'text-emerald-700' : 'text-slate-800'}`}>{atingPercent}%</h4>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <TrendingUp className={`w-6 h-6 ${atingPercent >= 100 ? 'text-emerald-500' : 'text-purple-500'}`} />
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
            <div className={`${atingPercent >= 100 ? 'bg-emerald-500' : 'bg-purple-600'} h-2.5 rounded-full transition-all`}
              style={{ width: `${Math.min(atingPercent, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* TABELA DE METAS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-700">Tabela de Inserção / Ajuste de Metas</h3>
          <button onClick={() => setIsAdding(a => !a)}
            className="flex items-center text-sm bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 font-medium">
            {isAdding ? <><X className="w-4 h-4 mr-1" />Cancelar</> : <><PlusCircle className="w-4 h-4 mr-1" />Nova Meta</>}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                {['Consultor','Supervisor','Coordenador','Time','Reg','Indicador','Meta (R$)','Valor (R$)','%','Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isAdding && (
                <tr className="bg-purple-50">
                  <td className="p-2"><input type="text" placeholder="Nome Consultor" {...inp('consultor')} /></td>
                  <td className="p-2">
                    <select {...inp('supervisor')} className="w-full text-xs p-1.5 border border-purple-300 rounded bg-white">
                      <option value="">Selecionar</option>
                      {domains.supervisor.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-2"><input type="text" placeholder="Coordenador" {...inp('coordenador')} /></td>
                  <td className="p-2">
                    <select {...inp('time')} className="w-full text-xs p-1.5 border border-purple-300 rounded bg-white">
                      <option value="">Selecionar</option>
                      {domains.time.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="p-2">
                    <select {...inp('regional')} className="w-full text-xs p-1.5 border border-purple-300 rounded bg-white">
                      <option value="">Selecionar</option>
                      {domains.regional.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="p-2"><input type="text" placeholder="Receita Bruta" {...inp('indicador')} /></td>
                  <td className="p-2"><input type="number" placeholder="50000" {...inp('meta')} className="w-full text-xs p-1.5 border border-blue-400 rounded text-right bg-blue-50" /></td>
                  <td className="p-2"><input type="number" placeholder="45000" {...inp('valor')} className="w-full text-xs p-1.5 border border-emerald-400 rounded text-right bg-emerald-50" /></td>
                  <td className="p-2 text-center text-xs text-gray-400">-</td>
                  <td className="p-2">
                    <button onClick={handleAddSubmit} className="bg-purple-600 text-white p-1.5 rounded hover:bg-purple-700 w-full font-medium text-xs">Salvar</button>
                  </td>
                </tr>
              )}

              {filteredData.map(row => {
                const pct = row.meta > 0 ? ((row.valor / row.meta) * 100).toFixed(0) : 0;
                const met = pct >= 100;
                return (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{row.consultor}</td>
                    <td className="px-4 py-3 text-gray-600">{row.supervisor}</td>
                    <td className="px-4 py-3 text-gray-600">{row.coordenador}</td>
                    <td className="px-4 py-3"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{row.time}</span></td>
                    <td className="px-4 py-3 text-gray-600">{row.regional}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{row.indicador}</td>
                    <td className="px-4 py-3 text-right font-medium">{Number(row.meta).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 text-right font-medium">{Number(row.valor).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${met ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{pct}%</span>
                    </td>
                    {/* CORRIGIDO #8: Exclusão de meta com confirmação inline, igual ao padrão de usuários */}
                    <td className="px-4 py-3 text-center">
                      {deleteMetaConfirm === row.id ? (
                        <span className="flex items-center justify-center gap-1 text-xs text-red-600">
                          Confirmar?
                          <button onClick={() => { setMetasData(d => d.filter(m => m.id !== row.id)); setDeleteMetaConfirm(null); }} className="font-bold underline">Sim</button>
                          <button onClick={() => setDeleteMetaConfirm(null)} className="font-bold underline">Não</button>
                        </span>
                      ) : (
                        <button onClick={() => setDeleteMetaConfirm(row.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredData.length === 0 && !isAdding && (
                <tr><td colSpan={10} className="text-center py-8 text-gray-500">Nenhuma meta encontrada. Ajuste os filtros ou clique em "Nova Meta".</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// UPLOAD DE BASES
// CORRIGIDO #15: Adicionado showToast para feedback de sucesso pós-upload.
// ═══════════════════════════════════════════════════════════════

function UploadView({ setParsedData, isProcessing, setIsProcessing, setCurrentView, setActiveCompetencia, uploadHistory, setUploadHistory, loggedUser, showToast }) {
  const [file, setFile]                         = useState(null);
  const [progress, setProgress]                 = useState(0);
  const [selectedMonth, setSelectedMonth]       = useState(CURRENT_MONTH);
  const [selectedYear, setSelectedYear]         = useState(String(CURRENT_YEAR));
  const [fileType, setFileType]                 = useState('extrato');
  const [competenciaErrors, setCompetenciaErrors] = useState([]);
  const [fileError, setFileError]               = useState('');

  const MAX_MB = 50;

  const handleFileChange = (e) => {
    setFileError('');
    const f = e.target?.files?.[0];
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) { setFileError(`Arquivo excede ${MAX_MB}MB.`); return; }
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'));
    if (!['.csv','.xlsx','.xls'].includes(ext)) { setFileError('Use CSV, XLSX ou XLS.'); return; }
    setFile(f);
  };

  const handleUpload = async () => {
    const errs = validateCompetencia(selectedMonth, selectedYear);
    setCompetenciaErrors(errs);
    if (errs.length) return;
    if (!file) { setFileError('Selecione um arquivo.'); return; }

    // CORREÇÃO 5: Verificação de duplicidade de mês/ano antes de importar.
    // Consulta a API para saber se já existe um upload do mesmo tipo/mês/ano.
    // Extrato e Recalculo compartilham a mesma tabela (extrato_comissoes),
    // então ambos verificam duplicidade de forma independente por tipo.
    try {
      const checkResp = await fetch(
        `/api/upload?tipo=${fileType.toUpperCase()}&mes=${selectedMonth}&ano=${selectedYear}`
      );
      const checkData = await checkResp.json();
      if (checkData.existe) {
        setFileError(
          `Já existe um arquivo de ${fileType === 'extrato' ? 'Extrato' : 'Recálculo'} importado para ${MONTHS.find(m => m.value === selectedMonth)?.label}/${selectedYear}. Remova o existente antes de reimportar.`
        );
        return;
      }
    } catch {
      // Se a verificação falhar por rede, deixa o upload prosseguir e a API
      // tratará o erro de constraint do banco se houver.
    }

    setIsProcessing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) {
          clearInterval(interval);
          processFile();
          return 95;
        }
        return p + 15;
      });
    }, 300);
  };

  // CORREÇÃO 1/2/3/6: processFile() agora existe como função real dentro do componente.
  // Antes: o código estava solto entre handleUpload e o return do JSX, nunca era chamado.
  // Agora: lê o XLSX, mapeia colunas, envia para /api/upload com os valores reais
  // de fileType, selectedMonth e selectedYear, e atualiza o histórico corretamente.
  const processFile = () => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        // Lê o buffer do arquivo com SheetJS
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const primeiraAba = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[primeiraAba];
        const dadosJsonBrutos = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        // Mapeamento: colunas do Excel → campos do banco (extrato_comissoes)
        const dadosMapeados = dadosJsonBrutos.map(linha => ({
          login_vendedor:          linha['LOGIN VENDEDOR']          ?? '',
          cnpj:                    linha['CNPJ']                    ?? '',
          nome_rede:               linha['NOME REDE']               ?? '',
          segmentacao:             linha['SEGMENTAÇÃO']             ?? '',
          canal:                   linha['CANAL']                   ?? '',
          cnpj_cpf_cliente:        linha['CNPJ / CPF CLIENTE']      ?? '',
          nome_cliente:            linha['NOME CLIENTE']            ?? '',
          segmento:                linha['SEGMENTO']                ?? '',
          uf_linha_cliente:        linha['UF LINHA / CLIENTE']      ?? '',
          operacao:                linha['OPERAÇÃO']                ?? '',
          movimento_principal:     linha['MOVIMENTO PRINCIPAL']     ?? '',
          regra_calculo:           linha['REGRA DE CÁLCULO']        ?? '',
          detalhe_calculo:         linha['DETALHE CÁLCULO']         ?? '',
          quantidade:              linha['QUANTIDADE']              ?? '',
          id_comissionamento:      linha['ID COMISSIONAMENTO']      ?? '',
          ordem_pedido:            linha['ORDEM / PEDIDO']          ?? '',
          numero_linha:            linha['NÚMERO LINHA']            ?? '',
          iccid_serial:            linha['ICCID / SERIAL']          ?? '',
          competencia:             linha['COMPETÊNCIA']             ?? '',
          data_evento:             linha['DATA EVENTO']             ?? '',
          data_baixa:              linha['DATA BAIXA']              ?? '',
          data_ultimo_movimento:   linha['DATA ÚLTIMO MOVIMENTO']   ?? '',
          dias_suspensao:          linha['DIAS SUSPENSÃO']          ?? '',
          contagem_baixa:          linha['CONTAGEM BAIXA']          ?? '',
          subscricao_movel:        linha['SUBSCRIÇÃO MÓVEL']        ?? '',
          rpon_sva:                linha['RPON SVA']                ?? '',
          rpon_voz:                linha['RPON VOZ']                ?? '',
          rpon_bl:                 linha['RPON BL']                 ?? '',
          rpon_tv:                 linha['RPON TV']                 ?? '',
          codigo_produto_atual:    linha['CÓDIGO PRODUTO ATUAL']    ?? '',
          produto_atual:           linha['PRODUTO ATUAL']           ?? '',
          valor_produto_atual:     linha['VALOR PRODUTO ATUAL']     ?? '',
          valor_desconto:          linha['VALOR DESCONTO']          ?? '',
          codigo_produto_anterior: linha['CÓDIGO PRODUTO ANTERIOR'] ?? '',
          produto_anterior:        linha['PRODUTO ANTERIOR']        ?? '',
          valor_produto_anterior:  linha['VALOR PRODUTO ANTERIOR']  ?? '',
          produtos_fixa:           linha['PRODUTOS FIXA']           ?? '',
          valor_liquido_delta:     linha['VALOR LÍQUIDO / DELTA']   ?? '',
          fator:                   linha['FATOR']                   ?? '',
          indicadores:             linha['INDICADORES']             ?? '',
          valor_apurado:           linha['VALOR APURADO']           ?? '',
          rel:                     linha['REL']                     ?? '',
          documento_sap:           linha['DOCUMENTO SAP']           ?? '',
          fornecedor_sap:          linha['FORNECEDOR SAP']          ?? '',
          item_recalculo:          linha['ITEM RECÁLCULO']          ?? '',
          motivo_item_recalculo:   linha['MOTIVO ITEM RECÁLCULO']   ?? '',
          observacao:              linha['OBSERVAÇÃO']              ?? '',
          chave:                   linha['CHAVE']                   ?? '',
          grupo_comissao:          linha['GRUPO COMISSÃO']          ?? '',
          esteira:                 linha['ESTEIRA']                 ?? '',
          tipo_comissao:           linha['TIPO COMISSÃO']           ?? '',
          consultor:               linha['CONSULTOR']               ?? '',
          supervisor:              linha['SUPERVISOR']              ?? '',
          equipe:                  linha['TIME']                    ?? '', // TIME → equipe (evita conflito SQL)
          regional:                linha['REGIONAL']                ?? '',
          ref:                     linha['REF']                     ?? '',
        }));

        // CORREÇÃO 2/3: tipo_arquivo, mes_referencia e ano_referencia agora
        // usam os valores reais selecionados na tela, não strings fixas.
        const resposta = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo_arquivo:   fileType.toUpperCase(), // 'EXTRATO' ou 'RECALCULO' conforme seleção
            mes_referencia: selectedMonth,           // ex: '04' — vem do select de mês
            ano_referencia: selectedYear,            // ex: '2026' — vem do select de ano
            dados:          dadosMapeados,
          }),
        });

        const resultado = await resposta.json();

        if (!resposta.ok || resultado.erro) {
          showToast(`Erro ao salvar: ${resultado.erro ?? 'Erro desconhecido'}`, 'error');
          setIsProcessing(false);
          setProgress(0);
          return;
        }

        // Atualiza dados locais para exibição no dashboard
        if (fileType === 'extrato') setParsedData(dadosMapeados);
        setActiveCompetencia({ month: selectedMonth, year: parseInt(selectedYear, 10) });

        // CORREÇÃO 6: Registra no histórico — antes nunca era chamado pois
        // o código estava fora de qualquer função.
        setUploadHistory(prev => [{
          id: generateId(),
          type: fileType,
          filename: file.name,
          size: (file.size / 1024 / 1024).toFixed(2),
          month: selectedMonth,
          year: selectedYear,
          datetime: new Date().toLocaleString('pt-BR'),
          user: loggedUser?.name ?? 'Desconhecido',
        }, ...prev]);

        setIsProcessing(false);
        setProgress(100);

        const typeLabel = UPLOAD_TYPES.find(t => t.value === fileType)?.label ?? fileType;
        if (fileType === 'extrato') {
          showToast(`${resultado.mensagem ?? `${dadosMapeados.length} linhas importadas com sucesso!`}`);
          setCurrentView('analysis');
        } else {
          showToast(`${typeLabel} importado com sucesso! ${resultado.mensagem ?? ''}`);
        }
        setFile(null);

      } catch (erro) {
        showToast('Não foi possível conectar ao servidor. Verifique sua conexão.', 'error');
        setIsProcessing(false);
        setProgress(0);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const cy = new Date().getFullYear();

  const historyByType = useMemo(() => {
    const map = {};
    UPLOAD_TYPES.forEach(t => { map[t.value] = uploadHistory.filter(h => h.type === t.value); });
    return map;
  }, [uploadHistory]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* ── FORMULÁRIO DE UPLOAD ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-slate-800">Processamento de Arquivos</h2>
          <p className="text-slate-500 text-sm mt-1">Selecione o tipo, a competência e faça o upload do arquivo correspondente.</p>
        </div>

        <div className="p-6 space-y-6">

          {/* TIPO DE ARQUIVO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Arquivo</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {UPLOAD_TYPES.map(opt => {
                const active = fileType === opt.value;
                const colors = {
                  purple:  { border: 'border-purple-500 bg-purple-50 text-purple-700',  btn: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
                  blue:    { border: 'border-blue-500 bg-blue-50 text-blue-700',          btn: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                  emerald: { border: 'border-emerald-500 bg-emerald-50 text-emerald-700', btn: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
                };
                const c = colors[opt.color];
                return (
                  <div key={opt.value}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${active ? c.border : 'border-gray-200 hover:border-gray-300'}`}
                    onClick={() => setFileType(opt.value)}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {/* CORRIGIDO #25: Removido atributo 'readOnly' indevido do radio button.
                            O controle correto é via onChange. readOnly em radio suprime warnings
                            ao custo de semântica incorreta. */}
                        <input type="radio" name="fileType" value={opt.value} checked={active}
                          onChange={() => setFileType(opt.value)}
                          className="h-4 w-4 accent-purple-600" />
                        <span className="font-medium text-sm">{opt.label}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); downloadTemplate(opt.value); }}
                      className={`w-full flex items-center justify-center gap-1 text-xs py-1.5 px-2 rounded-lg font-medium transition-colors ${c.btn}`}>
                      <FileDown className="w-3 h-3" /> Baixar Modelo
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COMPETÊNCIA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Competência (Mês)</label>
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 p-2.5 border">
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ano de Referência <span className="text-xs text-gray-400 ml-1">(anos futuros disponíveis)</span>
              </label>
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 p-2.5 border">
                {YEARS.map(y => (
                  <option key={y} value={String(y)}>
                    {y}{y === cy ? ' (Atual)' : y > cy ? ' ▶ Futuro' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Intervalo: {cy - 5} – {cy + 5}</p>
            </div>
          </div>

          {competenciaErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
              {competenciaErrors.map((err, i) => (
                <p key={i} className="text-sm text-red-700 flex items-center gap-2"><XCircle className="w-4 h-4 flex-shrink-0" />{err}</p>
              ))}
            </div>
          )}

          {/* DROP ZONE */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:bg-gray-50 transition-colors"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFileChange({ target: { files: e.dataTransfer.files } }); }}>
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-sm font-medium text-gray-900">
              <label htmlFor="file-upload" className="cursor-pointer text-purple-600 hover:text-purple-500 font-medium">
                Clique para selecionar
                <input id="file-upload" type="file" className="sr-only" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
              </label>
              <span className="text-gray-500"> ou arraste e solte</span>
            </h3>
            <p className="text-xs text-gray-400 mt-2">XLSX, XLS ou CSV até {MAX_MB}MB</p>

            {file && (
              <div className="mt-4 p-3 bg-purple-50 text-purple-800 rounded-md text-sm flex items-center justify-center border border-purple-100">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                <button onClick={() => setFile(null)} className="ml-3 text-purple-400 hover:text-red-500"><X className="w-4 h-4" /></button>
              </div>
            )}
            {fileError && (
              <p className="mt-2 text-sm text-red-600 flex items-center justify-center gap-1"><XCircle className="w-4 h-4" />{fileError}</p>
            )}
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium text-gray-700">
                <span>Processando arquivo...</span><span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button onClick={handleUpload} disabled={!file || isProcessing}
              className={`px-6 py-2.5 rounded-lg text-white font-medium flex items-center gap-2 ${!file || isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-md'}`}>
              {isProcessing ? 'Processando...' : <><CheckCircle2 className="w-5 h-5" />Iniciar Processamento</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── HISTÓRICO DE ATUALIZAÇÕES ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <History className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-800">Histórico de Atualizações por Arquivo</h3>
        </div>

        <div className="divide-y divide-gray-100">
          {UPLOAD_TYPES.map(ut => {
            const records = historyByType[ut.value] ?? [];
            const colorMap = { purple: 'text-purple-700 bg-purple-50 border-purple-200', blue: 'text-blue-700 bg-blue-50 border-blue-200', emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
            return (
              <div key={ut.value} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${colorMap[ut.color]}`}>{ut.label}</span>
                  {records.length === 0 && <span className="text-xs text-gray-400 italic">Nenhum upload registrado ainda.</span>}
                </div>

                {records.length > 0 && (
                  <div className="space-y-2">
                    {records.slice(0, 5).map(rec => (
                      <div key={rec.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-100">
                        <span className="flex items-center gap-1 text-gray-600 font-medium">
                          <Clock className="w-3.5 h-3.5" /> {rec.datetime}
                        </span>
                        <span className="text-gray-500">
                          Competência: <strong className="text-slate-700">{MONTHS.find(m => m.value === rec.month)?.label ?? rec.month}/{rec.year}</strong>
                        </span>
                        <span className="text-gray-500 truncate max-w-[200px]">
                          Arquivo: <strong className="text-slate-700">{rec.filename}</strong> ({rec.size} MB)
                        </span>
                        <span className="text-gray-500 ml-auto">
                          Por: <strong className="text-purple-700">{rec.user}</strong>
                        </span>
                      </div>
                    ))}
                    {records.length > 5 && (
                      <p className="text-xs text-gray-400 text-center pt-1">+ {records.length - 5} registros anteriores</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ANÁLISE
// CORRIGIDO #12/#13: Botões sem ação desabilitados com título explicativo.
// ═══════════════════════════════════════════════════════════════

function AnalysisView({ data }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;
  const isMock = !data?.length;

  // CORRIGIDO #20: Usa MOCK_TABLE_DATA fixo em vez de gerar com Math.random() dentro do useMemo
  const displayData = useMemo(() => {
    let src = isMock ? MOCK_TABLE_DATA : data;
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      src = src.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(t)));
    }
    return src;
  }, [data, isMock, searchTerm]);

  const totalPages     = Math.ceil(displayData.length / rowsPerPage);
  const currentTableData = useMemo(() => displayData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [currentPage, displayData]);
  const columns = isMock
    ? ['ID','Consultor','Cliente','Produto','Valor Prévia','Valor Extrato','Status']
    : ['LOGIN VENDEDOR','NOME CLIENTE','OPERAÇÃO','VALOR PRODUTO ATUAL','VALOR APURADO','_status','_motivo'];

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar cliente, consultor..." value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full sm:w-64 text-sm" />
          </div>
          {/* CORRIGIDO #12: Botão "Filtros Avançados" desabilitado — não tinha ação */}
          <button
            disabled
            title="Filtros avançados serão disponibilizados em breve"
            className="flex items-center text-sm font-medium text-gray-400 border border-gray-200 rounded-lg px-4 py-2 cursor-not-allowed opacity-60">
            <Filter className="w-4 h-4 mr-2" /> Filtros Avançados
          </button>
        </div>
        {/* CORRIGIDO #12: Botão "Exportar Inconsistências" desabilitado — não tinha ação */}
        <button
          disabled
          title="Exportação será disponibilizada em breve"
          className="flex items-center text-sm font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 cursor-not-allowed opacity-60">
          <Download className="w-4 h-4 mr-2" /> Exportar Inconsistências
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniCard title="Total Registros" value={displayData.length} />
        <MiniCard title="Pagamentos OK"   value={displayData.filter(d => d.Status === 'OK' || d._status === 'ok').length}          color="text-emerald-600" />
        <MiniCard title="Divergências"    value={displayData.filter(d => d.Status === 'Divergente' || d._status === 'divergente').length} color="text-amber-500" />
        <MiniCard title="Não Localizados" value="0" color="text-rose-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {columns.map((col, i) => (
                  <th key={i} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {col.replace('_', '')}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentTableData.map((row, idx) => {
                const status = row.Status || row._status;
                const isDiv  = status?.toLowerCase() === 'divergente';
                return (
                  <tr key={idx} className={`hover:bg-purple-50 transition-colors ${isDiv ? 'bg-amber-50/30' : ''}`}>
                    {columns.map((col, ci) => (
                      <td key={ci} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {col === 'Status' || col === '_status'
                          ? <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDiv ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              {isDiv ? (row._motivo || 'Divergente') : 'Validado'}
                            </span>
                          : col.includes('VALOR') && row[col] ? `R$ ${row[col]}` : row[col] || '-'}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right text-sm">
                      {/* CORRIGIDO #13: Botão "Detalhes" desabilitado — não tinha ação */}
                      <button
                        disabled
                        title="Detalhes do registro serão disponibilizados em breve"
                        className="text-gray-400 px-2 py-1 cursor-not-allowed opacity-60">
                        Detalhes
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!currentTableData.length && (
                <tr><td colSpan={columns.length + 1} className="px-6 py-10 text-center text-gray-400">Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
          <p className="text-sm text-gray-700 hidden sm:block">
            Mostrando <span className="font-medium">{displayData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPage * rowsPerPage, displayData.length)}</span> de <span className="font-medium">{displayData.length}</span>
          </p>
          <nav className="inline-flex rounded-md shadow-sm -space-x-px">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="px-2 py-2 rounded-l-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="h-5 w-5" /></button>
            <span className="px-4 py-2 border border-gray-300 bg-white text-sm text-gray-700">{currentPage} de {totalPages || 1}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
              className="px-2 py-2 rounded-r-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="h-5 w-5" /></button>
          </nav>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DOMÍNIOS DE FILTROS
// ═══════════════════════════════════════════════════════════════

const DOMAIN_LABELS = {
  grupoComissao: 'Grupo Comissão',
  esteira:       'Esteira',
  tipoComissao:  'Tipo Comissão',
  supervisor:    'Supervisor',
  time:          'Time',
  regional:      'Regional',
};

function DomainsView({ domains, setDomains }) {
  const [newItem, setNewItem] = useState({});

  const addItem = (key) => {
    const val = newItem[key]?.trim();
    if (!val) return;
    if (domains[key].includes(val)) return;
    setDomains(d => ({ ...d, [key]: [...d[key], val] }));
    setNewItem(n => ({ ...n, [key]: '' }));
  };

  const removeItem = (key, item) => {
    setDomains(d => ({ ...d, [key]: d[key].filter(v => v !== item) }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Cadastro de Domínios de Filtros</h2>
        <p className="text-slate-500 text-sm mt-1">
          Os itens cadastrados aqui alimentam automaticamente todos os filtros do Dashboard Principal, Dashboard de Metas e os selects do formulário de metas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Object.keys(DOMAIN_LABELS).map(key => (
          <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-gray-700 text-sm">{DOMAIN_LABELS[key]}</h3>
              <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{domains[key].length} itens</span>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItem[key] ?? ''}
                  onChange={e => setNewItem(n => ({ ...n, [key]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addItem(key)}
                  placeholder={`Novo item de ${DOMAIN_LABELS[key]}...`}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                />
                <button onClick={() => addItem(key)}
                  className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium">
                  <Plus className="w-4 h-4" /> Adicionar
                </button>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {domains[key].length === 0 && (
                  <p className="text-xs text-gray-400 italic w-full text-center py-2">Nenhum item cadastrado.</p>
                )}
                {domains[key].map(item => (
                  <span key={item} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-medium">
                    {item}
                    <button onClick={() => removeItem(key, item)} className="text-purple-400 hover:text-red-500 ml-1 leading-none">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm text-purple-800 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Como funciona?</p>
          <p className="mt-1">Cada item adicionado aqui aparece imediatamente como opção nos filtros do <strong>Dashboard Principal</strong> e do <strong>Dashboard de Metas</strong>, e também nos selects de <em>Supervisor, Time e Regional</em> no formulário de nova meta. Remova itens que não forem mais utilizados para manter os filtros limpos.</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GESTÃO DE USUÁRIOS
// ═══════════════════════════════════════════════════════════════

function UsersView({ users, setUsers }) {
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [formData, setFormData]       = useState({ username: '', name: '', role: 'gerente', password: '', active: true });
  const [formErrors, setFormErrors]   = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const resetForm = () => {
    setFormData({ username: '', name: '', role: 'gerente', password: '', active: true });
    setFormErrors({});
    setShowForm(false);
    setEditingId(null);
  };

  const validateForm = () => {
    const errs = {};
    const uErr = validateUsername(formData.username);
    if (uErr) errs.username = uErr;
    if (!formData.name?.trim() || formData.name.trim().length < 3) errs.name = 'Nome deve ter ao menos 3 caracteres.';
    if (!USER_ROLES.includes(formData.role)) errs.role = 'Perfil inválido.';
    if (!editingId || formData.password) {
      const pErr = validatePassword(formData.password);
      if (!editingId && pErr) errs.password = pErr;
      else if (formData.password && pErr) errs.password = pErr;
    }
    const dup = users.find(u => u.username === formData.username && u.id !== editingId);
    if (dup) errs.username = 'E-mail já cadastrado.';
    setFormErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    if (editingId) {
      setUsers(prev => prev.map(u => u.id === editingId ? { ...u, username: formData.username, name: formData.name, role: formData.role, active: formData.active } : u));
    } else {
      // CORRIGIDO #9: Usa generateId() em vez de Date.now()
      setUsers(prev => [...prev, { id: generateId(), username: formData.username, name: formData.name, role: formData.role, active: formData.active, createdAt: new Date().toISOString().split('T')[0] }]);
    }
    resetForm();
  };

  const roleBadge = (role) => ({
    master:       'bg-purple-100 text-purple-800',
    gerente:      'bg-indigo-100 text-indigo-800',
    analista:     'bg-teal-100 text-teal-800',
    visualizador: 'bg-gray-100 text-gray-700',
  }[role] ?? 'bg-gray-100 text-gray-700');

  const fd = (field) => ({
    value: formData[field],
    onChange: e => setFormData(f => ({ ...f, [field]: e.target.value })),
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gestão de Usuários</h2>
          <p className="text-slate-500 text-sm mt-1">{users.length} usuário(s) cadastrado(s). O perfil (role) de cada usuário define o que ele vê no sistema.</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium shadow-sm">
          <UserPlus className="w-4 h-4" /> Novo Usuário
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-slate-800">{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail / Usuário *</label>
              <input type="text" {...fd('username')} placeholder="usuario@empresa.com"
                className={`w-full border rounded-md p-2.5 text-sm ${formErrors.username ? 'border-red-400' : 'border-gray-300'} focus:ring-purple-500 focus:border-purple-500`} />
              {formErrors.username && <p className="mt-1 text-xs text-red-600">{formErrors.username}</p>}
              <p className="text-xs text-gray-400 mt-1">Usado como login. 3–30 chars.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
              <input type="text" {...fd('name')} placeholder="Nome do usuário"
                className={`w-full border rounded-md p-2.5 text-sm ${formErrors.name ? 'border-red-400' : 'border-gray-300'} focus:ring-purple-500 focus:border-purple-500`} />
              {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Acesso *</label>
              <select {...fd('role')} className={`w-full border rounded-md p-2.5 text-sm ${formErrors.role ? 'border-red-400' : 'border-gray-300'} focus:ring-purple-500 focus:border-purple-500`}>
                {USER_ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
              {formErrors.role && <p className="mt-1 text-xs text-red-600">{formErrors.role}</p>}
              <p className="text-xs text-gray-400 mt-1">
                <strong>master</strong>: acesso total · <strong>gerente/analista</strong>: sem administração · <strong>visualizador</strong>: somente leitura
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha {editingId ? '(deixe em branco para manter)' : '*'}
              </label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={formData.password}
                  onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                  className={`w-full border rounded-md p-2.5 text-sm pr-10 ${formErrors.password ? 'border-red-400' : 'border-gray-300'} focus:ring-purple-500 focus:border-purple-500`}
                  placeholder="Mín. 8 chars, maiúscula, número, especial" />
                <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.password && <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>}
            </div>

            <div className="flex items-center gap-3 mt-1">
              <input type="checkbox" id="active-chk" checked={formData.active}
                onChange={e => setFormData(f => ({ ...f, active: e.target.checked }))}
                className="h-4 w-4 accent-purple-600 rounded" />
              <label htmlFor="active-chk" className="text-sm font-medium text-gray-700">Usuário ativo</label>
              <span className="text-xs text-gray-400">(usuários inativos não conseguem fazer login)</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button onClick={resetForm} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center gap-2">
              <Save className="w-4 h-4" />{editingId ? 'Salvar Alterações' : 'Criar Usuário'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Usuário (login)','Nome','Perfil','Status','Criado em','Ações'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(u => (
              <tr key={u.id} className={`hover:bg-slate-50 ${!u.active ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4 text-sm text-gray-800 font-mono">{u.username}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{u.name}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadge(u.role)}`}>{u.role}</span>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => setUsers(prev => prev.map(x => x.id === u.id ? { ...x, active: !x.active } : x))}
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                    {u.active ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{u.createdAt}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingId(u.id); setFormData({ username: u.username, name: u.name, role: u.role, password: '', active: u.active }); setShowForm(true); }}
                      className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50"><Edit2 className="w-4 h-4" /></button>
                    {deleteConfirm === u.id
                      ? <span className="flex items-center gap-1 text-xs text-red-600">
                          Confirmar? <button onClick={() => { setUsers(p => p.filter(x => x.id !== u.id)); setDeleteConfirm(null); }} className="font-bold underline">Sim</button>
                          <button onClick={() => setDeleteConfirm(null)} className="font-bold underline">Não</button>
                        </span>
                      : <button onClick={() => setDeleteConfirm(u.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    }
                  </div>
                </td>
              </tr>
            ))}
            {!users.length && <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Nenhum usuário cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════════

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors ${active ? 'bg-purple-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <span className="mr-3">{React.cloneElement(icon, { className: 'w-5 h-5' })}</span>
      <span className="text-sm">{label}</span>
    </button>
  );
}

function KpiCard({ title, value, icon, subtitle, trend, trendUp, alert }) {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border ${alert ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100'}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h4 className="text-2xl font-bold text-slate-800 mt-2">{value}</h4>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
      </div>
      {(subtitle || trend) && (
        <div className="mt-4 flex items-center text-sm">
          {trend && <span className={`font-medium ${alert ? 'text-amber-600' : trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>{trend}</span>}
          {subtitle && <span className="text-slate-400 ml-2">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

function BarChartRow({ label, percentage, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{value} ({percentage}%)</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

// CORRIGIDO #11: FilterSelect agora aceita value e onChange para ser controlado
function FilterSelect({ label, options, value, onChange }) {
  return (
    <div className="flex items-center text-sm min-w-[130px] bg-gray-50 rounded-md border border-gray-200 px-2">
      <span className="text-gray-500 mr-1 whitespace-nowrap text-xs">{label}:</span>
      <select
        value={value ?? options[0]}
        onChange={e => onChange && onChange(e.target.value)}
        className="border-none bg-transparent text-slate-700 font-medium py-1.5 focus:ring-0 cursor-pointer w-full text-xs">
        {options.map(opt => <option key={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function MiniCard({ title, value, color = 'text-slate-800' }) {
  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{title}</span>
      <span className={`text-xl font-bold mt-1 ${color}`}>{value}</span>
    </div>
  );
}
