import { Teacher, Student, ClassEvent, Notice, FinancialEntry, MiscIncome, GeneralExpense, Task } from './types';

export const MOCK_TEACHERS: Teacher[] = [
    {
        id: 'teacher-gabriella',
        name: 'Gabriella',
        username: 'gabriella',
        username_lowercase: 'gabriella',
        email: 'gabriella@hsl.com',
        password: '1718',
        role: 'admin',
        status: 'active',
        birthDate: '1993-11-18',
        whatsapp: '61999999999',
        address: 'Brasília, DF',
        pixKey: 'pix.gabriella@email.com',
        cpf: '111.222.333-44',
        roles: [
            { type: 'psicopedagogo', payRate: 100 },
            { type: 'professor', payRate: 80 }
        ]
    },
    {
        id: 'teacher-2',
        name: 'Bruno Costa',
        username: 'bruno.costa',
        username_lowercase: 'bruno.costa',
        email: 'bruno.costa@hsl.com',
        password: 'password123',
        role: 'teacher',
        status: 'active',
        birthDate: '1990-07-20',
        whatsapp: '21912345678',
        address: 'Avenida Copacabana, 456, Rio de Janeiro, RJ',
        pixKey: '21912345678',
        cpf: '098.765.432-11',
        roles: [
            { type: 'professor', payRate: 70 },
            { type: 'musica', payRate: 75 }
        ]
    }
];

export const MOCK_STUDENTS: Student[] = [
    {
        id: 'student-1',
        name: 'Carlos Eduardo',
        status: 'active',
        birthDate: '2010-01-25',
        parentName: 'Mariana Eduardo',
        parentContact: '11988887777',
        service: 'Psicopedagogia',
        teacherUsername: 'gabriella',
        monthlyFee: 450,
        observations: 'Apresenta dificuldades em matemática.',
        progressLog: [
            {
                id: 'prog-1',
                author: 'gabriella',
                date: '2024-05-10T10:00:00Z',
                content: 'Demonstrou melhora significativa na resolução de problemas de adição.'
            }
        ]
    },
    {
        id: 'student-2',
        name: 'Fernanda Lima',
        status: 'active',
        birthDate: '2012-06-10',
        parentName: 'Ricardo Lima',
        parentContact: '21977776666',
        service: 'Aula de Violão',
        teacherUsername: 'bruno.costa',
        monthlyFee: 300,
        progressLog: []
    },
    {
        id: 'student-3',
        name: 'Gustavo Pereira',
        status: 'inactive',
        birthDate: '2011-11-05',
        parentName: 'Sandra Pereira',
        parentContact: '11966665555',
        service: 'Reforço de Português',
        teacherUsername: 'gabriella',
        monthlyFee: 350,
        progressLog: []
    }
];

const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split('T')[0];


export const MOCK_EVENTS: ClassEvent[] = [
    {
        id: 'event-1',
        studentId: 'student-1',
        teacherUsername: 'gabriella',
        title: 'Carlos Eduardo',
        date: todayStr,
        time: '14:00',
        status: 'scheduled',
        service: 'Psicopedagogia'
    },
    {
        id: 'event-2',
        studentId: 'student-2',
        teacherUsername: 'bruno.costa',
        title: 'Fernanda Lima',
        date: todayStr,
        time: '16:30',
        status: 'scheduled',
        service: 'Aula de Violão'
    },
     {
        id: 'event-3',
        studentId: 'student-1',
        teacherUsername: 'gabriella',
        title: 'Carlos Eduardo',
        date: yesterdayStr,
        time: '14:00',
        status: 'completed',
        service: 'Psicopedagogia'
    },
    {
        id: 'event-4',
        studentId: 'student-2',
        teacherUsername: 'bruno.costa',
        title: 'Fernanda Lima',
        date: tomorrowStr,
        time: '16:30',
        status: 'scheduled',
        service: 'Aula de Violão'
    }
];


export const MOCK_NOTICES: Notice[] = [
    {
        id: 'notice-1',
        author: 'gabriella',
        content: 'Lembrete: Reunião geral de alinhamento amanhã às 10h. A pauta será enviada por email. Conto com a presença de todos! 😊',
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        recipients: 'all',
        reactions: [{ emoji: '✔️', user: 'bruno.costa' }],
        comments: [
            { id: 'comment-1', author: 'bruno.costa', content: 'Confirmado!', date: new Date().toISOString(), reactions: [] }
        ]
    },
    {
        id: 'notice-2',
        author: 'bruno.costa',
        content: 'O ar-condicionado da sala 2 será consertado na sexta-feira. A sala estará interditada no período da manhã.',
        date: new Date().toISOString(), // Today
        recipients: 'all',
        reactions: [],
        comments: []
    }
];

const currentYear = new Date().getFullYear();
const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
const currentMonthYear = `${currentYear}-${currentMonth}`;

export const MOCK_FINANCIAL_ENTRIES: FinancialEntry[] = [
    { id: 'fin-1', studentId: 'student-1', description: `Mensalidade ${currentMonthYear}`, amount: 450, monthYear: currentMonthYear, status: 'paid' },
    { id: 'fin-2', studentId: 'student-2', description: `Mensalidade ${currentMonthYear}`, amount: 300, monthYear: currentMonthYear, status: 'pending' },
];

export const MOCK_MISC_INCOMES: MiscIncome[] = [
    { id: 'misc-inc-1', description: 'Venda de material didático', amount: 150, monthYear: currentMonthYear }
];

export const MOCK_GENERAL_EXPENSES: GeneralExpense[] = [
    { id: 'misc-exp-1', description: 'Conta de luz', amount: 250, monthYear: currentMonthYear, status: 'paid' },
    { id: 'misc-exp-2', description: 'Material de escritório', amount: 80, monthYear: currentMonthYear, status: 'pending' }
];

export const MOCK_TASKS: Task[] = [
    { id: 'task-1', title: 'Preparar avaliação de Carlos Eduardo', description: 'Focar nos últimos tópicos de matemática.', assignedTo: ['gabriella'], status: 'todo' },
    { id: 'task-2', title: 'Comprar novos encordoamentos', description: 'Para as aulas de violão.', assignedTo: ['bruno.costa'], status: 'in-progress' },
    { id: 'task-3', title: 'Finalizar relatório semestral', description: 'Enviar para todos os pais até o fim do mês.', assignedTo: ['gabriella'], status: 'done' }
];