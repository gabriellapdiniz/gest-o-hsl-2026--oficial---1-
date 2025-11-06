export interface User {
    id: string;
    username: string;
    username_lowercase: string;
    name: string;
    role: 'admin' | 'teacher';
    password?: string;
}

export interface RoleInfo {
    type: 'professor' | 'psicologo' | 'psicopedagogo' | 'musica' | 'arte' | 'reforco';
    payRate: number;
}

export interface Teacher extends User {
    email: string;
    roles: RoleInfo[];
    status: 'active' | 'inactive';
    birthDate: string; // YYYY-MM-DD
    whatsapp?: string;
    address?: string;
    pixKey?: string;
    cpf?: string;
}

// FIX: Added ProgressLogEntry interface to be used in the Student interface.
export interface ProgressLogEntry {
    id: string;
    author: string; // username
    date: string; // ISO 8601
    content: string;
}

export interface Student {
    id: string;
    name: string;
    status: 'active' | 'inactive';
    birthDate: string; // YYYY-MM-DD
    parentName: string;
    parentContact: string;
    address?: string;
    service: string; // e.g., 'Reforço Escolar - Matemática'
    teacherUsername: string;
    monthlyFee: number;
    observations?: string;
    // FIX: Added optional progressLog property to match mock data structure.
    progressLog?: ProgressLogEntry[];
}

export interface ClassEvent {
    id: string;
    studentId: string;
    teacherUsername: string;
    title: string; // Student's name
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    status: 'scheduled' | 'completed' | 'cancelled';
    service: string;
    observations?: string;
}

export interface Reaction {
    emoji: string;
    user: string; // username
}

export interface Comment {
    id: string;
    author: string; // username
    content: string;
    date: string; // ISO 8601
    reactions: Reaction[];
}

export interface Notice {
    id: string;
    author: string; // username
    content: string;
    date: string; // ISO 8601
    recipients: 'all' | string[]; // 'all' or array of usernames
    reactions: Reaction[];
    comments: Comment[];
}

export interface FinancialEntry {
    id: string;
    studentId: string;
    description: string;
    amount: number;
    monthYear: string; // YYYY-MM
    status: 'paid' | 'pending' | 'overdue';
}

export interface MiscIncome {
    id: string;
    description: string;
    amount: number;
    monthYear: string; // YYYY-MM
}

export interface GeneralExpense {
    id: string;
    description: string;
    amount: number;
    monthYear: string; // YYYY-MM
    status: 'paid' | 'pending';
}

// FIX: Added Task interface to resolve import error in mock-data.ts.
export interface Task {
    id: string;
    title: string;
    description: string;
    assignedTo: string[]; // usernames
    status: 'todo' | 'in-progress' | 'done';
}
