import React, { useState, useMemo, FC } from 'react';
import { Teacher, ClassEvent, Student } from '../types';

const TimesheetView: FC<{ teacher: Teacher; events: ClassEvent[]; students: Student[] }> = ({ teacher, events, students }) => {
    const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;
    
    const timesheetData = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const detailedEvents = (events || [])
            .filter(e => {
                const [year, month, day] = e.date.split('-').map(Number);
                const eventDate = new Date(year, month - 1, day);

                return e.teacherUsername === teacher.username &&
                       e.status === 'completed' &&
                       eventDate.getMonth() === currentMonth &&
                       eventDate.getFullYear() === currentYear;
            })
            .map(event => {
                const student = (students || []).find(s => s.id === event.studentId);
                if (!student) return { ...event, earning: 0, studentName: 'N/A', service: 'N/A' };

                const service = student.service.toLowerCase();
                const teacherRoles = teacher.roles || [];
                const role = teacherRoles.find(r => service.includes(r.type)) || teacherRoles.find(r => r.type === 'reforco') || teacherRoles[0];
                const earning = role ? role.payRate : 0;

                return { ...event, earning, studentName: student.name, service: student.service };
            })
            .sort((a, b) => a.date.localeCompare(b.date));

        const totalEarnings = detailedEvents.reduce((acc, event) => acc + event.earning, 0);

        return {
            completedClasses: detailedEvents.length,
            totalEarnings,
            detailedEvents,
        };
    }, [events, students, teacher]);

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-slate-700 mb-4">Resumo (Mês Atual)</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <span className="text-slate-600">Aulas/Sessões Concluídas:</span>
                        <span className="text-2xl font-bold text-cyan-600">{timesheetData.completedClasses}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-slate-600">Ganhos Estimados:</span>
                        <span className="text-2xl font-bold text-green-600">{formatCurrency(timesheetData.totalEarnings)}</span>
                    </div>
                </div>
            </div>
             <div>
                <h3 className="text-lg font-bold text-slate-700 mb-4">Detalhamento</h3>
                 {timesheetData.detailedEvents.length > 0 ? (
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="p-2 font-semibold">Data</th>
                                    <th className="p-2 font-semibold">Aluno(a)</th>
                                    <th className="p-2 font-semibold">Serviço</th>
                                    <th className="p-2 font-semibold text-right">Valor Recebido</th>
                                </tr>
                            </thead>
                            <tbody>
                                {timesheetData.detailedEvents.map(event => (
                                    <tr key={event.id} className="border-b">
                                        <td className="p-2">{new Date(event.date + 'T03:00:00Z').toLocaleDateString('pt-BR')}</td>
                                        <td className="p-2">{event.studentName}</td>
                                        <td className="p-2">{event.service}</td>
                                        <td className="p-2 text-right">{formatCurrency(event.earning)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-slate-500 text-center py-4">Nenhuma aula ou sessão concluída este mês.</p>
                )}
            </div>
        </div>
    );
};


const MyProfile: FC<{
    user: Teacher;
    onUpdateUser: (user: Teacher) => void;
    events: ClassEvent[];
    students: Student[];
}> = ({ user, onUpdateUser, events, students }) => {
    const [activeTab, setActiveTab] = useState<'data' | 'timesheet'>('data');
    const [formData, setFormData] = useState<Teacher>(user);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateUser(formData);
        alert('Perfil atualizado com sucesso!');
    };
    
    const inputStyle = "w-full p-2 border border-gray-300 rounded-md shadow-sm";

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Meu Perfil</h1>
            <div className="bg-white rounded-lg shadow-sm">
                 <div className="border-b">
                    <nav className="flex space-x-2 px-6">
                        <button onClick={() => setActiveTab('data')} className={`py-3 px-1 border-b-2 text-sm font-medium ${activeTab === 'data' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>Meus Dados</button>
                        <button onClick={() => setActiveTab('timesheet')} className={`py-3 px-1 border-b-2 text-sm font-medium ${activeTab === 'timesheet' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>Folha de Ponto</button>
                    </nav>
                </div>
                {activeTab === 'data' ? (
                     <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-4 max-h-[65vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-sm">Nome completo</label><input className={inputStyle} name="name" value={formData.name} onChange={handleChange} /></div>
                                {/* FIX: Combined duplicate `className` attributes into a single attribute to resolve JSX error. */}
                                <div><label className="text-sm">Usuário (login)</label><input className={`${inputStyle} bg-slate-100`} name="username" value={formData.username} disabled /></div>
                                <div><label className="text-sm">Email</label><input className={inputStyle} name="email" type="email" value={formData.email} onChange={handleChange} /></div>
                                <div><label className="text-sm">Senha</label><input className={inputStyle} name="password" type="password" onChange={handleChange} placeholder="Deixe em branco para não alterar" /></div>
                                <div><label className="text-sm">WhatsApp</label><input className={inputStyle} name="whatsapp" value={formData.whatsapp || ''} onChange={handleChange} /></div>
                                <div><label className="text-sm">Data de Nascimento</label><input className={inputStyle} name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} /></div>
                                <div className="md:col-span-2"><label className="text-sm">Endereço</label><input className={inputStyle} name="address" value={formData.address || ''} onChange={handleChange} /></div>
                                <div><label className="text-sm">CPF</label><input className={inputStyle} name="cpf" value={formData.cpf || ''} onChange={handleChange} /></div>
                                <div><label className="text-sm">Chave PIX</label><input className={inputStyle} name="pixKey" value={formData.pixKey || ''} onChange={handleChange} /></div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 p-6 bg-slate-50 border-t -m-6 mt-6 rounded-b-lg">
                            <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700">Salvar Alterações</button>
                        </div>
                    </form>
                ) : (
                    <div className="p-6">
                        <TimesheetView teacher={user} events={events} students={students} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyProfile;