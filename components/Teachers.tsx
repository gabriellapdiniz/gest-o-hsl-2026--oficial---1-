import React, { useState, useMemo, FC } from 'react';
import { Teacher, RoleInfo } from '../types';

type TeacherFormData = Omit<Teacher, 'id' | 'username_lowercase' | 'role'> & { role: 'admin' | 'teacher' };

const TeacherModal: FC<{
    teacher: Teacher | null;
    onSave: (teacher: Teacher | TeacherFormData) => void;
    onClose: () => void;
}> = ({ teacher, onSave, onClose }) => {
    const [formData, setFormData] = useState<Teacher | TeacherFormData>(
        teacher || {
            name: '',
            username: '',
            email: '',
            password: '',
            // FIX: Added `role` property to satisfy the TeacherFormData type for new teachers.
            role: 'teacher',
            status: 'active',
            birthDate: '',
            roles: [],
        }
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (index: number, field: keyof RoleInfo, value: string | number) => {
        const newRoles = [...formData.roles];
        if (field === 'payRate') {
            newRoles[index] = { ...newRoles[index], [field]: Number(value) || 0 };
        } else {
            newRoles[index] = { ...newRoles[index], [field]: value as RoleInfo['type'] };
        }
        setFormData(prev => ({ ...prev, roles: newRoles }));
    };

    const addRole = () => {
        setFormData(prev => ({ ...prev, roles: [...prev.roles, { type: 'professor', payRate: 0 }] }));
    };

    const removeRole = (index: number) => {
        setFormData(prev => ({ ...prev, roles: prev.roles.filter((_, i) => i !== index) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const inputStyle = "w-full p-2 border border-gray-300 rounded-md shadow-sm";
    const roleTypes: RoleInfo['type'][] = ['professor', 'psicologo', 'psicopedagogo', 'musica', 'arte', 'reforco'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl z-10">&times;</button>
                <div className="p-6 border-b"><h2 className="text-2xl font-bold">{teacher ? 'Editar Colaborador' : 'Novo Colaborador'}</h2></div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-sm">Nome completo</label><input className={inputStyle} name="name" value={formData.name} onChange={handleChange} required /></div>
                            <div><label className="text-sm">Usuário (para login)</label><input className={inputStyle} name="username" value={formData.username} onChange={handleChange} required disabled={!!teacher} /></div>
                            <div><label className="text-sm">Email</label><input className={inputStyle} name="email" type="email" value={formData.email} onChange={handleChange} required /></div>
                            <div><label className="text-sm">Senha</label><input className={inputStyle} name="password" type="password" onChange={handleChange} placeholder={teacher ? "Deixe em branco para não alterar" : ""} required={!teacher} /></div>
                            <div><label className="text-sm">Nascimento</label><input className={inputStyle} name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} required /></div>
                            <div><label className="text-sm">WhatsApp</label><input className={inputStyle} name="whatsapp" value={formData.whatsapp || ''} onChange={handleChange} /></div>
                            <div className="md:col-span-2"><label className="text-sm">Endereço</label><input className={inputStyle} name="address" value={formData.address || ''} onChange={handleChange} /></div>
                            <div><label className="text-sm">CPF</label><input className={inputStyle} name="cpf" value={formData.cpf || ''} onChange={handleChange} /></div>
                            <div><label className="text-sm">Chave PIX</label><input className={inputStyle} name="pixKey" value={formData.pixKey || ''} onChange={handleChange} /></div>
                            <div><label className="text-sm">Status</label><select className={inputStyle} name="status" value={formData.status} onChange={handleChange}><option value="active">Ativo</option><option value="inactive">Inativo</option></select></div>
                        </div>
                        <div className="pt-4 border-t">
                            <h3 className="text-lg font-semibold mb-2">Funções e Pagamentos</h3>
                            {formData.roles.map((role, index) => (
                                <div key={index} className="flex items-center gap-2 mb-2 p-2 border rounded-md">
                                    <select value={role.type} onChange={e => handleRoleChange(index, 'type', e.target.value)} className={`${inputStyle} w-1/2`}>
                                        {roleTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                    <input type="number" placeholder="Valor/hora" value={role.payRate} onChange={e => handleRoleChange(index, 'payRate', e.target.value)} className={`${inputStyle} w-1/2`} />
                                    <button type="button" onClick={() => removeRole(index)} className="text-red-500 p-1 rounded hover:bg-red-100">&times;</button>
                                </div>
                            ))}
                            <button type="button" onClick={addRole} className="text-sm text-cyan-600 hover:underline">+ Adicionar função</button>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 p-6 bg-slate-50 border-t rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const Teachers: FC<{
    teachers: Teacher[];
    onSaveTeacher: (teacher: Teacher | TeacherFormData) => void;
}> = ({ teachers, onSaveTeacher }) => {
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

    const filteredTeachers = useMemo(() => {
        return (teachers || []).filter(t =>
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.email.toLowerCase().includes(search.toLowerCase())
        );
    }, [teachers, search]);

    const openModal = (teacher: Teacher | null = null) => {
        setEditingTeacher(teacher);
        setIsModalOpen(true);
    };
    
    const handleSave = (data: Teacher | TeacherFormData) => {
        onSaveTeacher(data);
        setIsModalOpen(false);
    };

    const statusBadge = (status: Teacher['status']) => {
        const styles = { active: 'bg-green-100 text-green-800', inactive: 'bg-red-100 text-red-800' };
        const text = { active: 'Ativo', inactive: 'Inativo' };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{text[status]}</span>;
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Colaboradores</h1>
                <button onClick={() => openModal()} className="bg-cyan-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-cyan-700">Adicionar Novo</button>
            </div>
            <div className="mb-4">
                <input type="text" placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} className="w-full max-w-xs p-2 border rounded-md" />
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b text-slate-600">
                        <tr>
                            <th className="p-3 font-semibold">Nome</th>
                            <th className="p-3 font-semibold">Status</th>
                            <th className="p-3 font-semibold">Email</th>
                            <th className="p-3 font-semibold">Funções</th>
                            <th className="p-3 font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTeachers.map(teacher => (
                            <tr key={teacher.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-medium text-slate-800">{teacher.name}</td>
                                <td className="p-3">{statusBadge(teacher.status)}</td>
                                <td className="p-3">{teacher.email}</td>
                                <td className="p-3">{teacher.roles.map(r => r.type).join(', ')}</td>
                                <td className="p-3"><button onClick={() => openModal(teacher)} className="text-cyan-600 hover:underline">Detalhes/Editar</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <TeacherModal teacher={editingTeacher} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default Teachers;