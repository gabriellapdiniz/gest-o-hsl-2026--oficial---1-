import React, { FC, useState, useMemo, useEffect } from 'react';
import { User, ClassEvent, Student, Notice, Teacher, FinancialEntry } from '../types';
import { GoogleGenAI } from "@google/genai";
import NoticeBoard from './NoticeBoard'; // Import the new centralized component

// TodaysClasses component (integrated)
const TodaysClasses: FC<{ user: User, events: ClassEvent[], students: Student[] }> = ({ user, events, students }) => {
    const todaysClasses = useMemo(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        return (events || [])
            .filter(e => e.date === todayStr)
            .filter(e => user.role === 'admin' || e.teacherUsername === user.username)
            .sort((a, b) => a.time.localeCompare(b.time));
    }, [events, user]);

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-bold text-slate-700 mb-3">Agenda de Hoje</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {todaysClasses.length > 0 ? (
                    todaysClasses.map(c => {
                        const student = (students || []).find(s => s.id === c.studentId);
                        return (
                            <div key={c.id} className="p-2 border-l-4 border-cyan-500 bg-slate-50 rounded">
                                <p className="font-semibold text-sm">{c.time} - {c.title}</p>
                                <p className="text-xs text-slate-600">{student?.service}</p>
                                {user.role === 'admin' && <p className="text-xs text-cyan-700">{c.teacherUsername}</p>}
                            </div>
                        )
                    })
                ) : (
                    <p className="text-sm text-center text-slate-500 py-4">Nenhuma aula agendada para hoje.</p>
                )}
            </div>
        </div>
    );
};

// PaymentWarnings component
const PaymentWarnings: FC<{ financialEntries: FinancialEntry[], students: Student[], updateFinancialEntry: (entry: FinancialEntry) => void }> = ({ financialEntries, students, updateFinancialEntry }) => {
    const warnings = useMemo(() => {
        return (financialEntries || [])
            .filter(e => e.status === 'pending' || e.status === 'overdue')
            .sort((a,b) => (a.monthYear < b.monthYear ? -1 : 1));
    }, [financialEntries]);
    
    if (warnings.length === 0) {
        return (
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <h2 className="text-lg font-bold text-slate-700 mb-3">Avisos de Vencimento</h2>
                <p className="text-sm text-center text-slate-500 py-4">Nenhum vencimento ou pendência no momento.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-bold text-slate-700 mb-3">Avisos de Vencimento</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {warnings.map(entry => {
                    const student = students.find(s => s.id === entry.studentId);
                    return (
                        <div key={entry.id} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg flex justify-between items-center text-sm">
                            <div>
                                <span className="font-semibold">{student?.name || 'Aluno desconhecido'}:</span>
                                <span className="text-slate-700 ml-1">{entry.description} está {entry.status === 'pending' ? 'pendente' : 'atrasada'}.</span>
                            </div>
                            <button 
                                onClick={() => updateFinancialEntry({ ...entry, status: 'paid' })}
                                className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded-md flex-shrink-0"
                            >
                                Marcar como Pago
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


// StatCard component
const StatCard: FC<{ title: string; value: string | number; icon?: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
        {icon && <div className="p-3 mr-4 text-cyan-600 bg-cyan-100 rounded-full">{icon}</div>}
        <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-700">{value}</p>
        </div>
    </div>
);

// Gemini Helper
const GeminiSummary: FC<{ events: ClassEvent[], user: User, students: Student[] }> = ({ events, user, students }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const generateSummary = async () => {
        if (!process.env.API_KEY) {
            setError('A chave da API Gemini não foi configurada.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSummary('');

        try {
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
            
            const today = new Date().toISOString().split('T')[0];
            const upcomingEvents = (events || [])
                .filter(e => e.date >= today)
                .filter(e => user.role === 'admin' || e.teacherUsername === user.username)
                .slice(0, 10);

            if (upcomingEvents.length === 0) {
                setSummary("Você não tem nenhum compromisso futuro. Aproveite para planejar a semana!");
                setIsLoading(false);
                return;
            }

            const prompt = `
                Olá! Sou ${user.name}, um(a) ${user.role === 'admin' ? 'administrador(a)' : 'colaborador(a)'} na HSL.
                Baseado na minha agenda dos próximos dias, me dê um resumo rápido e amigável dos meus compromissos mais importantes e alguma sugestão de como posso me preparar.
                Seja breve e use emojis para deixar a mensagem mais leve.

                Meus próximos compromissos:
                ${upcomingEvents.map(e => {
                    const student = students.find(s => s.id === e.studentId);
                    return `- ${e.date} às ${e.time}: ${student?.service} com ${e.title}. Status: ${e.status}.`;
                }).join('\n')}
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setSummary(response.text);

        } catch (err) {
            console.error(err);
            setError('Ocorreu um erro ao gerar o resumo. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        generateSummary();
    }, []);

    return (
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-700 p-6 rounded-lg shadow-lg text-white">
            <h2 className="text-xl font-bold mb-3">Resumo Inteligente da Semana ✨</h2>
            {isLoading && <p className="text-cyan-200 animate-pulse">Gerando seu resumo personalizado...</p>}
            {error && <p className="text-yellow-300">{error}</p>}
            {summary && <p className="text-cyan-50 whitespace-pre-wrap">{summary}</p>}
            {!isLoading && <button onClick={generateSummary} className="mt-4 text-xs bg-white/30 hover:bg-white/40 px-3 py-1 rounded-full">Gerar novamente</button>}
        </div>
    );
};

// Main Dashboard Component
const Dashboard: FC<{
    user: User, 
    events: ClassEvent[],
    students: Student[],
    notices: Notice[],
    teachers: Teacher[],
    financialEntries: FinancialEntry[],
    updateFinancialEntry: (entry: FinancialEntry) => void,
    onAddNotice: (notice: Omit<Notice, 'id' | 'date' | 'author' | 'reactions' | 'comments'>) => void;
    onToggleReaction: (noticeId: string, emoji: string) => void;
    onAddComment: (noticeId: string, content: string) => void;
    onToggleCommentReaction: (noticeId: string, commentId: string, emoji: string) => void;
    onUpdateNotice: (noticeId: string, content: string) => void;
    onDeleteNotice: (noticeId: string) => void;
}> = (props) => {
    const { user, students } = props;

    const stats = useMemo(() => {
        const myStudents = user.role === 'admin' 
            ? students 
            : (students || []).filter(s => s.teacherUsername === user.username);
            
        const activeStudents = (myStudents || []).filter(s => s.status === 'active').length;
        
        return { activeStudents, totalStudents: myStudents.length };
    }, [students, user]);

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
            
            <NoticeBoard
                user={props.user}
                notices={props.notices}
                teachers={props.teachers}
                onAddNotice={props.onAddNotice}
                onToggleReaction={props.onToggleReaction}
                onAddComment={props.onAddComment}
                onToggleCommentReaction={props.onToggleCommentReaction}
                onUpdateNotice={props.onUpdateNotice}
                onDeleteNotice={props.onDeleteNotice}
            />
            <TodaysClasses user={props.user} events={props.events} students={props.students} />
            {user.role === 'admin' && (
                <PaymentWarnings 
                    financialEntries={props.financialEntries} 
                    students={props.students} 
                    updateFinancialEntry={props.updateFinancialEntry} 
                />
            )}

            <GeminiSummary events={props.events} user={props.user} students={props.students}/>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard title={user.role === 'admin' ? "Alunos Ativos" : "Meus Alunos Ativos"} value={stats.activeStudents} />
            </div>
        </div>
    );
};

export default Dashboard;