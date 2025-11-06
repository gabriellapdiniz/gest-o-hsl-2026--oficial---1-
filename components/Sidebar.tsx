import React, { FC } from 'react';
import { User } from '../types';
import { DashboardIcon, CalendarIcon, UsersIcon, BriefcaseIcon, DollarSignIcon, UserIcon, LogOutIcon, ReportsIcon, TasksIcon } from './icons';

interface SidebarProps {
    user: User;
    activeView: string;
    setActiveView: (view: string) => void;
    onLogout: () => void;
}

const Sidebar: FC<SidebarProps> = ({ user, activeView, setActiveView, onLogout }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, roles: ['admin', 'teacher'] },
        { id: 'schedule', label: 'Agenda', icon: CalendarIcon, roles: ['admin', 'teacher'] },
        { id: 'students', label: 'Alunos', icon: UsersIcon, roles: ['admin', 'teacher'] },
        { id: 'teachers', label: 'Colaboradores', icon: BriefcaseIcon, roles: ['admin'] },
        { id: 'financial', label: 'Financeiro', icon: DollarSignIcon, roles: ['admin'] },
        { id: 'reports', label: 'Relatórios', icon: ReportsIcon, roles: ['admin'] },
        { id: 'tasks', label: 'Tarefas', icon: TasksIcon, roles: ['admin', 'teacher'] },
    ];

    const profileNavItems = [
         { id: 'my-profile', label: 'Meu Perfil', icon: UserIcon, roles: ['admin', 'teacher'] },
    ];

    const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

    return (
        <div className="flex flex-col h-full w-64 bg-[#004a52] text-white">
            <div className="flex items-center justify-center h-20 border-b border-white/10">
                <h1 className="text-2xl font-bold">HSL</h1>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                {filteredNavItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                            activeView === item.id ? 'bg-cyan-400/30 text-white' : 'text-cyan-100 hover:bg-cyan-400/20'
                        }`}
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.label}
                    </button>
                ))}
            </nav>
            <div className="px-4 py-4 border-t border-white/10">
                <div className="mb-4">
                    {profileNavItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                             className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                activeView === item.id ? 'bg-cyan-400/30 text-white' : 'text-cyan-100 hover:bg-cyan-400/20'
                            }`}
                        >
                            <item.icon className="w-5 h-5 mr-3" />
                            {item.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center mb-4 px-2">
                    <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center font-bold mr-3">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-cyan-200 capitalize">{user.role === 'admin' ? 'Administrador' : 'Colaborador'}</p>
                    </div>
                </div>
                 <button
                    onClick={onLogout}
                    className="flex items-center w-full px-4 py-2 text-sm font-medium text-cyan-100 rounded-md hover:bg-cyan-400/20"
                >
                    <LogOutIcon className="w-5 h-5 mr-3" />
                    Sair
                </button>
            </div>
        </div>
    );
};

export default Sidebar;