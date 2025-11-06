import React, { useState, useMemo, FC, useEffect } from 'react';
import { User, Student, Teacher, FinancialEntry, MiscIncome, GeneralExpense } from '../types';

// Helper to format currency
const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

// MonthYear selector component
const MonthYearSelector: FC<{
    selectedMonthYear: string;
    onChange: (value: string) => void;
}> = ({ selectedMonthYear, onChange }) => {
    const months = Array.from({ length: 12 }, (_, i) => ({
        value: String(i + 1).padStart(2, '0'),
        label: new Date(0, i).toLocaleString('pt-BR', { month: 'long' }),
    }));
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const [year, month] = selectedMonthYear.split('-');

    return (
        <div className="flex gap-2 items-center">
            <select
                value={month}
                onChange={(e) => onChange(`${year}-${e.target.value}`)}
                className="p-2 border rounded-md bg-white shadow-sm"
            >
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select
                value={year}
                onChange={(e) => onChange(`${e.target.value}-${month}`)}
                className="p-2 border rounded-md bg-white shadow-sm"
            >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>
    );
};

// --- SUB-COMPONENTS FOR TABS ---

// StudentPayments component
const StudentPayments: FC<{
    students: Student[],
    financialEntries: FinancialEntry[],
    selectedMonthYear: string;
    updateFinancialEntry: (entry: FinancialEntry) => void;
    generateMonthlyEntries: (month: number, year: number) => void;
}> = ({ students, financialEntries, selectedMonthYear, updateFinancialEntry, generateMonthlyEntries }) => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
    
    const filteredEntries = useMemo(() => {
        let entries = financialEntries.filter(e => (e.monthYear || '').startsWith(selectedMonthYear));

        if (statusFilter !== 'all') {
            entries = entries.filter(e => e.status === statusFilter);
        }

        const query = search.toLowerCase();
        if (query) {
            entries = entries.filter(entry => {
                const student = students.find(s => s.id === entry.studentId);
                return student && student.name.toLowerCase().includes(query);
            });
        }
        return entries;
    }, [financialEntries, selectedMonthYear, search, statusFilter, students]);

    const hasActiveStudents = useMemo(() => students.some(s => s.status === 'active'), [students]);

    const handleGenerate = () => {
        const [year, month] = selectedMonthYear.split('-').map(Number);
        if(window.confirm(`Gerar mensalidades para ${new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long' })}/${year}?`)){
            generateMonthlyEntries(month - 1, year);
        }
    };
    
    const statusConfig = {
        paid: { label: 'Pago', color: 'bg-green-100 text-green-800' },
        pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
        overdue: { label: 'Atrasado', color: 'bg-red-100 text-red-800' },
    };

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <h2 className="text-xl font-bold">Lançamentos de Mensalidades</h2>
                <button onClick={handleGenerate} className="bg-cyan-600 text-white px-4 py-2 rounded-md text-sm">
                    Gerar Mensalidades do Mês
                </button>
            </div>
             <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                 <input
                    type="text"
                    placeholder="Buscar por nome do aluno..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-sm p-2 border rounded-md"
                />
                 <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="p-2 border rounded-md bg-white">
                    <option value="all">Todos</option>
                    <option value="paid">Pago</option>
                    <option value="pending">Pendente</option>
                    <option value="overdue">Atrasado</option>
                </select>
            </div>
            <div className="overflow-x-auto">
                {filteredEntries.length === 0 && hasActiveStudents ? (
                     <div className="text-center py-10 px-4 bg-slate-50 rounded-lg">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum lançamento encontrado para este mês.</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Clique em "Gerar Mensalidades do Mês" para criar os registros para todos os alunos ativos.
                        </p>
                    </div>
                ) : filteredEntries.length === 0 ? (
                    <p className="text-center py-10 text-gray-500">Nenhum lançamento encontrado para os filtros selecionados.</p>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="border-b text-gray-700">
                            <tr>
                                <th className="p-2">Aluno</th>
                                <th className="p-2">Descrição</th>
                                <th className="p-2">Valor</th>
                                <th className="p-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntries.map(entry => {
                                const student = students.find(s => s.id === entry.studentId);
                                return (
                                    <tr key={entry.id} className="border-b hover:bg-slate-50">
                                        <td className="p-2 font-medium">{student?.name || 'Aluno não encontrado'}</td>
                                        <td className="p-2">{entry.description}</td>
                                        <td className="p-2">{formatCurrency(entry.amount)}</td>
                                        <td className="p-2">
                                            <select
                                                value={entry.status}
                                                onChange={(e) => updateFinancialEntry({ ...entry, status: e.target.value as any })}
                                                className={`text-xs p-1 border rounded-md ${statusConfig[entry.status].color}`}
                                            >
                                                <option value="paid">Pago</option>
                                                <option value="pending">Pendente</option>
                                                <option value="overdue">Atrasado</option>
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};


// MiscIncomeManager Component
const MiscIncomeManager: FC<{
    miscIncomes: MiscIncome[];
    selectedMonthYear: string;
    addMiscIncome: (income: Omit<MiscIncome, 'id'>) => void;
    updateMiscIncome: (income: MiscIncome) => void;
    deleteMiscIncome: (id: string) => void;
}> = ({ miscIncomes, selectedMonthYear, addMiscIncome, updateMiscIncome, deleteMiscIncome }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState<MiscIncome | null>(null);

    const filteredIncomes = useMemo(() => miscIncomes.filter(i => (i.monthYear || '').startsWith(selectedMonthYear)), [miscIncomes, selectedMonthYear]);

    const openModal = (income: MiscIncome | null = null) => {
        setEditingIncome(income);
        setIsModalOpen(true);
    };

    const handleSave = (incomeData: Omit<MiscIncome, 'id'> | MiscIncome) => {
        if ('id' in incomeData) {
            updateMiscIncome(incomeData);
        } else {
            addMiscIncome({ ...incomeData, monthYear: selectedMonthYear });
        }
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Outras Receitas</h2>
                <button onClick={() => openModal()} className="bg-cyan-600 text-white px-4 py-2 rounded-md text-sm">Adicionar Receita</button>
            </div>
            <table className="w-full text-sm text-left">
                <thead className="border-b"><tr><th className="p-2">Descrição</th><th className="p-2">Valor</th><th className="p-2">Ações</th></tr></thead>
                <tbody>
                    {filteredIncomes.map(income => (
                        <tr key={income.id} className="border-b hover:bg-slate-50">
                            <td className="p-2">{income.description}</td>
                            <td className="p-2">{formatCurrency(income.amount)}</td>
                            <td className="p-2 flex gap-2"><button onClick={() => openModal(income)} className="text-xs">Editar</button><button onClick={() => deleteMiscIncome(income.id)} className="text-xs text-red-500">Excluir</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {isModalOpen && <IncomeExpenseModal type="income" item={editingIncome} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

// GeneralExpenseManager Component
const GeneralExpenseManager: FC<{
    generalExpenses: GeneralExpense[];
    selectedMonthYear: string;
    addGeneralExpense: (expense: Omit<GeneralExpense, 'id'>) => void;
    updateGeneralExpense: (expense: GeneralExpense) => void;
    deleteGeneralExpense: (id: string) => void;
}> = ({ generalExpenses, selectedMonthYear, addGeneralExpense, updateGeneralExpense, deleteGeneralExpense }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<GeneralExpense | null>(null);

    const filteredExpenses = useMemo(() => generalExpenses.filter(e => (e.monthYear || '').startsWith(selectedMonthYear)), [generalExpenses, selectedMonthYear]);

    const openModal = (expense: GeneralExpense | null = null) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleSave = (expenseData: Omit<GeneralExpense, 'id'> | GeneralExpense) => {
        if ('id' in expenseData) {
            updateGeneralExpense(expenseData);
        } else {
            addGeneralExpense({ ...expenseData, monthYear: selectedMonthYear } as Omit<GeneralExpense, 'id'>);
        }
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Despesas Gerais</h2>
                <button onClick={() => openModal()} className="bg-cyan-600 text-white px-4 py-2 rounded-md text-sm">Adicionar Despesa</button>
            </div>
            <table className="w-full text-sm text-left">
                <thead className="border-b"><tr><th className="p-2">Descrição</th><th className="p-2">Valor</th><th className="p-2">Status</th><th className="p-2">Ações</th></tr></thead>
                <tbody>
                    {filteredExpenses.map(expense => (
                        <tr key={expense.id} className="border-b hover:bg-slate-50">
                            <td className="p-2">{expense.description}</td>
                            <td className="p-2">{formatCurrency(expense.amount)}</td>
                            <td className="p-2 capitalize">{expense.status}</td>
                            <td className="p-2 flex gap-2"><button onClick={() => openModal(expense)} className="text-xs">Editar</button><button onClick={() => deleteGeneralExpense(expense.id)} className="text-xs text-red-500">Excluir</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {isModalOpen && <IncomeExpenseModal type="expense" item={editingExpense} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};


// Modal for Adding/Editing Income and Expenses
const IncomeExpenseModal: FC<{
    type: 'income' | 'expense';
    item: MiscIncome | GeneralExpense | null;
    onSave: (data: any) => void;
    onClose: () => void;
}> = ({ type, item, onSave, onClose }) => {
    const [description, setDescription] = useState(item?.description || '');
    const [amount, setAmount] = useState(item?.amount || 0);
    const [status, setStatus] = useState((item as GeneralExpense)?.status || 'pending');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const baseData = { description, amount };
        const data = type === 'expense' ? { ...baseData, status } : baseData;
        onSave(item ? { ...item, ...data } : data);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                <h2 className="text-2xl font-bold mb-4">{item ? 'Editar' : 'Adicionar'} {type === 'income' ? 'Receita' : 'Despesa'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição" className="w-full p-2 border rounded-md" required />
                    <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} placeholder="Valor" className="w-full p-2 border rounded-md" required />
                    {type === 'expense' && (
                        <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full p-2 border rounded-md bg-white">
                            <option value="pending">Pendente</option>
                            <option value="paid">Pago</option>
                        </select>
                    )}
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Main Financial Component ---
const Financial: FC<{
    user: User;
    students: Student[];
    teachers: Teacher[];
    financialEntries: FinancialEntry[];
    miscIncomes: MiscIncome[];
    generalExpenses: GeneralExpense[];
    generateMonthlyEntries: (month: number, year: number) => void;
    updateFinancialEntry: (entry: FinancialEntry) => void;
    addMiscIncome: (income: Omit<MiscIncome, 'id'>) => void;
    updateMiscIncome: (income: MiscIncome) => void;
    deleteMiscIncome: (id: string) => void;
    addGeneralExpense: (expense: Omit<GeneralExpense, 'id'>) => void;
    updateGeneralExpense: (expense: GeneralExpense) => void;
    deleteGeneralExpense: (id: string) => void;
}> = (props) => {
    const { students, teachers, financialEntries, miscIncomes, generalExpenses } = props;

    const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'income' | 'expenses'>('payments');
    const [selectedMonthYear, setSelectedMonthYear] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);

    const financialSummary = useMemo(() => {
        const monthYearStr = selectedMonthYear;
        
        const paidEntries = financialEntries.filter(e => (e.monthYear || '').startsWith(monthYearStr) && e.status === 'paid');
        const totalFromStudents = paidEntries.reduce((acc, curr) => acc + curr.amount, 0);

        const currentMiscIncomes = miscIncomes.filter(i => (i.monthYear || '').startsWith(monthYearStr));
        const totalMiscIncome = currentMiscIncomes.reduce((acc, curr) => acc + curr.amount, 0);

        const totalIncome = totalFromStudents + totalMiscIncome;

        const currentExpenses = generalExpenses.filter(e => (e.monthYear || '').startsWith(monthYearStr));
        const totalExpenses = currentExpenses.reduce((acc, curr) => acc + curr.amount, 0);

        const profit = totalIncome - totalExpenses;

        return { totalIncome, totalExpenses, profit };
    }, [selectedMonthYear, financialEntries, miscIncomes, generalExpenses]);

    const renderContent = () => {
        const commonProps = { selectedMonthYear };
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-700">Resumo de {new Date(selectedMonthYear + '-02').toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <StatCard title="Receita Total" value={formatCurrency(financialSummary.totalIncome)} color="text-green-600" />
                            <StatCard title="Despesa Total" value={formatCurrency(financialSummary.totalExpenses)} color="text-red-600" />
                            <StatCard title="Balanço" value={formatCurrency(financialSummary.profit)} color={financialSummary.profit >= 0 ? "text-blue-600" : "text-orange-600"} />
                        </div>
                    </div>
                );
            case 'payments':
                return <StudentPayments {...props} {...commonProps} />;
            case 'income':
                return <MiscIncomeManager {...props} {...commonProps} />;
            case 'expenses':
                return <GeneralExpenseManager {...props} {...commonProps} />;
            default: return null;
        }
    };
    
    const navItems = [
        { id: 'overview', label: 'Visão Geral' },
        { id: 'payments', label: 'Mensalidades' },
        { id: 'income', label: 'Outras Receitas' },
        { id: 'expenses', label: 'Despesas Gerais' },
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Financeiro</h1>
                <MonthYearSelector selectedMonthYear={selectedMonthYear} onChange={setSelectedMonthYear} />
            </div>

            <div className="border-b mb-6">
                <nav className="flex space-x-4">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`py-2 px-1 border-b-2 text-sm font-medium ${activeTab === item.id ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
                {renderContent()}
            </div>
        </div>
    );
};

// StatCard component
const StatCard: FC<{ title: string; value: string; color: string; }> = ({ title, value, color }) => (
    <div className="bg-slate-50 p-4 rounded-lg border">
        <h3 className="text-sm font-semibold text-slate-500">{title}</h3>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
);

export default Financial;