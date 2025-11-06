import React, { FC } from 'react';
import { Student, Teacher, ClassEvent, FinancialEntry, MiscIncome, GeneralExpense } from '../types';

// Helper function to convert data to CSV and trigger download
const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        alert('Não há dados para exportar.');
        return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};


const ReportCard: FC<{ title: string; children: React.ReactNode; onExport?: () => void }> = ({ title, children, onExport }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-700">{title}</h2>
            {onExport && (
                <button
                    onClick={onExport}
                    className="text-sm bg-slate-200 px-3 py-1 rounded-md hover:bg-slate-300"
                >
                    Exportar para CSV
                </button>
            )}
        </div>
        <div>{children}</div>
    </div>
);

const Reports: FC<{
    students: Student[];
    teachers: Teacher[];
    events: ClassEvent[];
    financialEntries: FinancialEntry[];
    miscIncomes: MiscIncome[];
    generalExpenses: GeneralExpense[];
}> = ({ students, teachers, events, financialEntries, miscIncomes, generalExpenses }) => {

    const currentMonthYear = new Date().toISOString().slice(0, 7); // YYYY-MM

    // --- Financial Analytics ---
    const financialData = React.useMemo(() => {
        const revenueByService: { [key: string]: number } = {};
        
        financialEntries.forEach(entry => {
            const student = students.find(s => s.id === entry.studentId);
            if (student && entry.status === 'paid') {
                revenueByService[student.service] = (revenueByService[student.service] || 0) + entry.amount;
            }
        });
        
        const totalMiscIncome = miscIncomes.reduce((sum, item) => sum + item.amount, 0);
        if(totalMiscIncome > 0) revenueByService['Outras Receitas'] = totalMiscIncome;
        
        const totalExpenses = generalExpenses.reduce((sum, item) => sum + item.amount, 0);
        
        return { revenueByService, totalExpenses };

    }, [financialEntries, miscIncomes, generalExpenses, students]);

    const handleExportFinancial = () => {
         const dataToExport = Object.entries(financialData.revenueByService).map(([service, revenue]) => ({
            servico: service,
            // FIX: Cast `revenue` to `number` to resolve `toFixed` error on `unknown` type from Object.entries.
            receita: `R$ ${(revenue as number).toFixed(2)}`
         }));
         dataToExport.push({ servico: 'DESPESA TOTAL', receita: `R$ ${financialData.totalExpenses.toFixed(2)}`});
         exportToCSV(dataToExport, 'relatorio_financeiro');
    };

    // --- Team Performance ---
    const teamPerformanceData = React.useMemo(() => {
        return teachers.map(teacher => {
            const completedSessions = (events || []).filter(e =>
                e.teacherUsername === teacher.username &&
                e.status === 'completed' &&
                e.date.startsWith(currentMonthYear)
            ).length;
            
            // Simplified earnings calculation for the report
            const estimatedEarnings = completedSessions * (teacher.roles[0]?.payRate || 0);

            return {
                name: teacher.name,
                completedSessions,
                estimatedEarnings: formatCurrency(estimatedEarnings)
            };
        });
    }, [teachers, events, currentMonthYear]);
    
    const handleExportTeam = () => {
         const dataToExport = teamPerformanceData.map(d => ({
            colaborador: d.name,
            sessoes_concluidas_mes: d.completedSessions,
            ganhos_estimados: d.estimatedEarnings
         }));
         exportToCSV(dataToExport, 'desempenho_equipe');
    };


    // --- Student Analytics ---
    const studentAnalyticsData = React.useMemo(() => {
        const statusCount = { active: 0, inactive: 0 };
        const serviceCount: { [key: string]: number } = {};

        students.forEach(student => {
            statusCount[student.status]++;
            serviceCount[student.service] = (serviceCount[student.service] || 0) + 1;
        });

        return { statusCount, serviceCount };
    }, [students]);

    const handleExportStudents = () => {
        const dataToExport = students.map(s => ({
            nome: s.name,
            status: s.status,
            servico: s.service,
            responsavel: teachers.find(t => t.username === s.teacherUsername)?.name || 'N/A'
        }));
        exportToCSV(dataToExport, 'lista_alunos');
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Relatórios e Análises</h1>
            
            <ReportCard title="Análise Financeira (Geral)" onExport={handleExportFinancial}>
                <div className="space-y-2">
                    <h3 className="font-semibold text-slate-600">Receita por Serviço</h3>
                     {Object.keys(financialData.revenueByService).length > 0 ? Object.entries(financialData.revenueByService).map(([service, total]) => (
                        <div key={service} className="flex justify-between items-center text-sm">
                            <span>{service}</span>
                            {/* FIX: Cast `total` to `number` to resolve error when passing `unknown` type from Object.entries to formatCurrency. */}
                            <span className="font-bold text-green-600">{formatCurrency(total as number)}</span>
                        </div>
                    )) : <p className="text-sm text-slate-500">Nenhuma receita registrada.</p>}
                     <div className="flex justify-between items-center text-sm pt-2 border-t">
                        <span>Despesa Total</span>
                        <span className="font-bold text-red-600">{formatCurrency(financialData.totalExpenses)}</span>
                    </div>
                </div>
            </ReportCard>

            <ReportCard title="Desempenho da Equipe (Mês Atual)" onExport={handleExportTeam}>
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2 font-semibold">Colaborador</th>
                            <th className="p-2 font-semibold text-center">Aulas/Sessões Concluídas</th>
                            <th className="p-2 font-semibold text-right">Ganhos Estimados</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teamPerformanceData.map(item => (
                            <tr key={item.name}>
                                <td className="p-2">{item.name}</td>
                                <td className="p-2 text-center">{item.completedSessions}</td>
                                <td className="p-2 text-right">{item.estimatedEarnings}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </ReportCard>

            <ReportCard title="Análise de Alunos e Pacientes" onExport={handleExportStudents}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-semibold text-slate-600 mb-2">Status</h3>
                        <div className="space-y-1 text-sm">
                           <div className="flex justify-between"><span>Ativos</span><span className="font-bold">{studentAnalyticsData.statusCount.active}</span></div>
                           <div className="flex justify-between"><span>Inativos</span><span className="font-bold">{studentAnalyticsData.statusCount.inactive}</span></div>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-600 mb-2">Distribuição por Serviço</h3>
                        <div className="space-y-1 text-sm">
                             {Object.entries(studentAnalyticsData.serviceCount).map(([service, count]) => (
                                <div key={service} className="flex justify-between"><span>{service}</span><span className="font-bold">{count}</span></div>
                            ))}
                        </div>
                    </div>
                </div>
            </ReportCard>

        </div>
    );
};

const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

export default Reports;