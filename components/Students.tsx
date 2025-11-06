import React, { useState, useMemo, FC } from 'react';
import { Student, Teacher, User, ClassEvent, ProgressLogEntry } from '../types';

type StudentFormData = Omit<Student, 'id'>;

// --- Helper Functions ---
const formatCurrency = (value: number) => {
    if (isNaN(value)) return '0,00';
    return value.toFixed(2).replace('.', ',');
};

const parseCurrency = (value: string) => {
    const number = parseFloat(value.replace(/[^0-9,]/g, '').replace(',', '.'));
    return isNaN(number) ? 0 : number;
};

// --- Sub-components for the Modal ---

const HistoryTab: FC<{
    student: Student;
    events: ClassEvent[];
    onUpdateEvent: (event: ClassEvent) => void;
}> = ({ student, events, onUpdateEvent }) => {
    const studentHistory = useMemo(() => {
        return (events || [])
            .filter(e => e.studentId === student.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [events, student.id]);

    const handleCancel = (event: ClassEvent) => {
        if (window.confirm('Tem certeza que deseja cancelar esta aula/sessão?')) {
            onUpdateEvent({ ...event, status: 'cancelled' });
        }
    };

    const statusConfig: { [key in ClassEvent['status']]: { label: string; color: string } } = {
        scheduled: { label: 'Agendada', color: 'bg-blue-100 text-blue-800' },
        completed: { label: 'Concluída', color: 'bg-green-100 text-green-800' },
        cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
    };

    return (
        <div className="p-6 max-h-[60vh] overflow-y-auto">
            {studentHistory.length > 0 ? (
                <table className="w-full text-sm text-left">
                    <thead className="border-b">
                        <tr>
                            <th className="p-2">Data</th>
                            <th className="p-2">Horário</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentHistory.map(event => (
                            <tr key={event.id} className="border-b">
                                <td className="p-2">{new Date(event.date + 'T03:00:00Z').toLocaleDateString('pt-BR')}</td>
                                <td className="p-2">{event.time}</td>
                                <td className="p-2">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[event.status].color}`}>
                                        {statusConfig[event.status].label}
                                    </span>
                                </td>
                                <td className="p-2">
                                    {event.status === 'scheduled' && (
                                        <button onClick={() => handleCancel(event)} className="text-red-600 hover:underline text-xs">
                                            Cancelar Aula/Sessão
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="text-center text-slate-500 py-8">Nenhum histórico de aulas encontrado.</p>
            )}
        </div>
    );
};

const ProgressTab: FC<{
    student: Student;
    onAddProgress: (content: string) => void;
    user: User;
}> = ({ student, onAddProgress, user }) => {
    const [newProgress, setNewProgress] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProgress.trim()) {
            onAddProgress(newProgress.trim());
            setNewProgress('');
        }
    };
    
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
             printWindow.document.write(`
                <html>
                    <head>
                        <title>Relatório de Progresso - ${student.name}</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                    </head>
                    <body class="p-8 font-sans">
                        <h1 class="text-2xl font-bold mb-2">Relatório de Progresso Pedagógico</h1>
                        <h2 class="text-xl mb-6 text-slate-700">${student.name}</h2>
                        ${(student.progressLog || []).map(entry => `
                            <div class="mb-4 border-b pb-2">
                                <p class="text-sm text-slate-500">
                                    <strong>${new Date(entry.date).toLocaleDateString('pt-BR')}</strong> por <strong>${entry.author}</strong>
                                </p>
                                <p class="mt-1">${entry.content}</p>
                            </div>
                        `).join('')}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <div className="p-6 max-h-[60vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-700">Linha do Tempo de Marcos</h3>
                {(student.progressLog || []).length > 0 && (
                    <button onClick={handlePrint} className="text-sm bg-slate-200 px-3 py-1 rounded-md hover:bg-slate-300">
                        Imprimir Relatório
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-slate-50">
                <textarea
                    value={newProgress}
                    onChange={(e) => setNewProgress(e.target.value)}
                    placeholder="Adicione um novo marco ou observação sobre o progresso..."
                    className="w-full p-2 border rounded-md"
                    rows={3}
                />
                <div className="flex justify-end mt-2">
                    <button type="submit" className="bg-cyan-600 text-white px-4 py-1.5 rounded-md text-sm">Adicionar Registro</button>
                </div>
            </form>

            <div className="space-y-4">
                {(student.progressLog || []).length > 0 ? (
                    [...(student.progressLog || [])].reverse().map(entry => (
                        <div key={entry.id} className="border-l-4 border-cyan-500 pl-4">
                            <p className="text-xs text-slate-500">
                                <strong>{new Date(entry.date).toLocaleString('pt-BR', { dateStyle: 'long' })}</strong> por <strong>{entry.author}</strong>
                            </p>
                            <p className="text-sm mt-1">{entry.content}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-slate-500 py-8">Nenhum registro de progresso encontrado.</p>
                )}
            </div>
        </div>
    );
};

const DataTab: FC<{
    isEditMode: boolean;
    formData: Student | StudentFormData;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleFeeChange: (value: string) => void;
    feeDisplay: string;
    teachers: Teacher[];
}> = ({ isEditMode, formData, handleChange, handleFeeChange, feeDisplay, teachers }) => {
    const inputStyle = "w-full p-2 border border-gray-300 rounded-md shadow-sm";
    const viewStyle = "w-full p-2 bg-slate-50 rounded-md text-slate-700";

    const renderField = (label: string, value: React.ReactNode) => (
         <div>
            <label className="text-sm font-medium text-slate-600">{label}</label>
            <div className={viewStyle}>{value || '-'}</div>
        </div>
    );

    if (!isEditMode) {
        const teacher = teachers.find(t => t.username === formData.teacherUsername);
        return (
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField("Nome Completo", formData.name)}
                    {renderField("Responsável Financeiro", formData.parentName)}
                    {renderField("Data de Nascimento", formData.birthDate ? new Date(formData.birthDate + 'T03:00:00Z').toLocaleDateString('pt-BR') : '')}
                    {renderField("Data de Início", '')} {/* Placeholder as not in mock */}
                    {renderField("Serviço/Atendimento", formData.service)}
                    {renderField("Professor/Responsável", teacher ? teacher.name : 'Não encontrado')}
                    {renderField("Modalidade", '')} {/* Placeholder as not in mock */}
                    {renderField("Status", formData.status === 'active' ? 'Ativo' : 'Inativo')}
                </div>
                 <div className="pt-2">
                    <label className="text-sm font-medium text-slate-600">Observações</label>
                    <div className={`${viewStyle} min-h-[60px] whitespace-pre-wrap`}>
                        {formData.observations || '-'}
                    </div>
                </div>
            </div>
        );
    }
    
    // Admin Edit Mode
    return (
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm">Nome completo</label><input className={inputStyle} name="name" value={formData.name} onChange={handleChange} required /></div>
                <div><label className="text-sm">Responsável Financeiro</label><input className={inputStyle} name="parentName" value={formData.parentName} onChange={handleChange} required /></div>
                <div><label className="text-sm">WhatsApp Contato</label><input className={inputStyle} name="parentContact" value={formData.parentContact} onChange={handleChange} /></div>
                <div><label className="text-sm">Nascimento</label><input className={inputStyle} name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} required /></div>
                <div><label className="text-sm">Serviço/Atendimento</label><input className={inputStyle} name="service" value={formData.service} onChange={handleChange} required /></div>
                <div><label className="text-sm">Mensalidade (R$)</label><input className={inputStyle} value={feeDisplay} onChange={e => handleFeeChange(e.target.value)} /></div>
                <div>
                    <label className="text-sm">Professor/Responsável</label>
                    <select className={inputStyle} name="teacherUsername" value={formData.teacherUsername} onChange={handleChange} required>
                        <option value="">Selecione...</option>
                        {teachers.map(t => <option key={t.id} value={t.username}>{t.name}</option>)}
                    </select>
                </div>
                <div><label className="text-sm">Status</label><select className={inputStyle} name="status" value={formData.status} onChange={handleChange}><option value="active">Ativo</option><option value="inactive">Inativo</option></select></div>
                <div className="md:col-span-2"><label className="text-sm">Endereço</label><input className={inputStyle} name="address" value={formData.address || ''} onChange={handleChange} /></div>
                <div className="md:col-span-2"><label className="text-sm">Observações</label><textarea name="observations" value={formData.observations || ''} onChange={handleChange} className={inputStyle} rows={3}></textarea></div>
            </div>
        </div>
    );
};


// --- Main Modal Component ---

const StudentModal: FC<{
    student: Student | null;
    user: User;
    events: ClassEvent[];
    teachers: Teacher[];
    onSave: (student: Student | StudentFormData) => void;
    onClose: () => void;
    onUpdateEvent: (event: ClassEvent) => void;
    onAddProgress: (studentId: string, content: string) => void;
}> = ({ student, user, events, teachers, onSave, onClose, onUpdateEvent, onAddProgress }) => {
    const [activeTab, setActiveTab] = useState<'data' | 'history' | 'progress'>('data');
    const [formData, setFormData] = useState<Student | StudentFormData>(
        student || {
            name: '', status: 'active', birthDate: '', parentName: '',
            parentContact: '', service: '', teacherUsername: '', monthlyFee: 0, progressLog: []
        }
    );
    const [feeDisplay, setFeeDisplay] = useState(formatCurrency(student?.monthlyFee || 0));

    const isEditMode = user.role === 'admin';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFeeChange = (value: string) => {
        setFeeDisplay(value);
        setFormData(prev => ({ ...prev, monthlyFee: parseCurrency(value) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl z-10">&times;</button>
                <div className="p-6 border-b"><h2 className="text-2xl font-bold">Detalhes de: {formData.name || 'Novo Aluno'}</h2></div>

                <div className="border-b">
                    <nav className="flex space-x-2 px-6">
                        <button onClick={() => setActiveTab('data')} className={`py-3 px-1 border-b-2 text-sm font-medium ${activeTab === 'data' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>Dados Cadastrais</button>
                        <button onClick={() => setActiveTab('history')} className={`py-3 px-1 border-b-2 text-sm font-medium ${activeTab === 'history' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>Histórico de Aulas/Sessões</button>
                        <button onClick={() => setActiveTab('progress')} className={`py-3 px-1 border-b-2 text-sm font-medium ${activeTab === 'progress' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>Progresso Pedagógico</button>
                    </nav>
                </div>
                
                <form onSubmit={handleSubmit}>
                    {activeTab === 'data' && <DataTab isEditMode={isEditMode} formData={formData} handleChange={handleChange} handleFeeChange={handleFeeChange} feeDisplay={feeDisplay} teachers={teachers} />}
                    {activeTab === 'history' && student && <HistoryTab student={student} events={events} onUpdateEvent={onUpdateEvent} />}
                    {activeTab === 'progress' && student && <ProgressTab student={student} onAddProgress={(content) => onAddProgress(student.id, content)} user={user} />}

                    {isEditMode && activeTab === 'data' && (
                         <div className="flex justify-end gap-2 p-6 bg-slate-50 border-t rounded-b-lg">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
                            <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700">Salvar</button>
                        </div>
                    )}
                </form>

            </div>
        </div>
    );
};


const Students: FC<{ 
    user: User;
    students: Student[];
    teachers: Teacher[];
    events: ClassEvent[];
    onSaveStudent: (student: Student | StudentFormData) => void;
    onUpdateEvent: (event: ClassEvent) => void;
    onAddProgressEntry: (studentId: string, content: string) => void;
}> = ({ user, students, teachers, events, onSaveStudent, onUpdateEvent, onAddProgressEntry }) => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    const filteredStudents = useMemo(() => {
        let studentList = (students || []);
        if (user.role !== 'admin') {
            studentList = studentList.filter(s => s.teacherUsername === user.username);
        }

        return studentList.filter(s =>
            (s.name.toLowerCase().includes(search.toLowerCase()) || 
             s.service.toLowerCase().includes(search.toLowerCase()) ||
             teachers.find(t=>t.username === s.teacherUsername)?.name.toLowerCase().includes(search.toLowerCase())
            ) &&
            (statusFilter === 'all' || s.status === statusFilter)
        );
    }, [students, search, statusFilter, user, teachers]);

    const openModal = (student: Student | null = null) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };

    const handleSave = (data: Student | Omit<Student, 'id'>) => {
        onSaveStudent(data);
        setIsModalOpen(false);
    };

    const statusBadge = (status: Student['status']) => {
        const styles = { active: 'bg-green-100 text-green-800', inactive: 'bg-red-100 text-red-800' };
        const text = { active: 'Ativo', inactive: 'Inativo' };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{text[status]}</span>;
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">{user.role === 'admin' ? 'Alunos e Pacientes' : 'Meus Alunos/Pacientes'}</h1>
                {user.role === 'admin' && (
                    <button onClick={() => openModal()} className="bg-cyan-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-cyan-700">Adicionar Novo</button>
                )}
            </div>
            <div className="mb-4 flex flex-wrap gap-4">
                <input type="text" placeholder="Buscar por nome, colaborador, serviço..." value={search} onChange={e => setSearch(e.target.value)} className="w-full max-w-xs p-2 border rounded-md" />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="p-2 border rounded-md bg-white">
                    <option value="all">Todos os status</option>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                </select>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b text-slate-600">
                        <tr>
                            <th className="p-3 font-semibold">Nome</th>
                            <th className="p-3 font-semibold">Status</th>
                            <th className="p-3 font-semibold">Serviço</th>
                            <th className="p-3 font-semibold">Responsável</th>
                            <th className="p-3 font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map(student => (
                            <tr key={student.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-medium text-slate-800">{student.name}</td>
                                <td className="p-3">{statusBadge(student.status)}</td>
                                <td className="p-3">{student.service}</td>
                                <td className="p-3">{teachers.find(t => t.username === student.teacherUsername)?.name || 'N/A'}</td>
                                <td className="p-3"><button onClick={() => openModal(student)} className="text-cyan-600 hover:underline">Detalhes</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <StudentModal student={editingStudent} user={user} events={events} teachers={teachers} onSave={handleSave} onClose={() => setIsModalOpen(false)} onUpdateEvent={onUpdateEvent} onAddProgress={onAddProgressEntry} />}
        </div>
    );
};

export default Students;