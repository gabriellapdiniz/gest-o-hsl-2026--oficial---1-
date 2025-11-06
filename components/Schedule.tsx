import React, { useState, useMemo, FC } from 'react';
import { User, ClassEvent, Student, Teacher } from '../types';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { EventClickArg, DateSelectArg } from '@fullcalendar/core';

type EventFormData = Omit<ClassEvent, 'id' | 'title'>;

const EventModal: FC<{
    event: ClassEvent | null;
    eventDate: Date;
    students: Student[];
    teachers: Teacher[];
    user: User;
    onSave: (event: Omit<ClassEvent, 'id'> | ClassEvent) => void;
    onDelete: (eventId: string) => void;
    onClose: () => void;
}> = ({ event, eventDate, students, teachers, user, onSave, onDelete, onClose }) => {
    const [formData, setFormData] = useState<EventFormData & { observations?: string }>(
        event ?
        {
            studentId: event.studentId,
            teacherUsername: event.teacherUsername,
            date: event.date,
            time: event.time,
            status: event.status,
            service: event.service,
            observations: event.observations || ''
        } :
        {
            studentId: '',
            teacherUsername: user.role === 'admin' ? '' : user.username,
            date: eventDate.toISOString().split('T')[0],
            time: `${String(eventDate.getHours()).padStart(2, '0')}:${String(eventDate.getMinutes()).padStart(2, '0')}`,
            status: 'scheduled',
            service: '',
            observations: ''
        }
    );

    const filteredStudents = useMemo(() => {
        if (user.role === 'admin') return students;
        return (students || []).filter(s => s.teacherUsername === user.username);
    }, [students, user]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const studentId = e.target.value;
        const student = students.find(s => s.id === studentId);
        if (student) {
            setFormData(prev => ({
                ...prev,
                studentId: student.id,
                teacherUsername: student.teacherUsername,
                service: student.service
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const student = students.find(s => s.id === formData.studentId);
        if (!student) return;

        const eventToSave: Omit<ClassEvent, 'id'> = {
            ...formData,
            title: student.name,
        };
        onSave(event ? { ...event, ...eventToSave } : eventToSave);
        onClose();
    };

    const inputStyle = "w-full p-2 border border-gray-300 rounded-md shadow-sm";

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl z-10">&times;</button>
                 <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold">{event ? 'Editar Evento' : 'Nova Aula/Sessão'}</h2>
                </div>
                 <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label className="text-sm">Aluno/Paciente</label>
                            <select name="studentId" value={formData.studentId} onChange={handleStudentChange} className={inputStyle} required>
                                <option value="">Selecione...</option>
                                {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        {user.role === 'admin' && (
                            <div>
                                <label className="text-sm">Professor/Responsável</label>
                                <select name="teacherUsername" value={formData.teacherUsername} onChange={handleChange} className={inputStyle} required>
                                    <option value="">Selecione...</option>
                                    {(teachers || []).map(t => <option key={t.id} value={t.username}>{t.name}</option>)}
                                </select>
                            </div>
                        )}
                         <div><label className="text-sm">Data</label><input type="date" name="date" value={formData.date} onChange={handleChange} className={inputStyle} required /></div>
                         <div><label className="text-sm">Horário</label><input type="time" name="time" value={formData.time} onChange={handleChange} className={inputStyle} required /></div>
                         <div>
                            <label className="text-sm">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className={inputStyle}>
                                <option value="scheduled">Agendada</option>
                                <option value="completed">Concluída</option>
                                <option value="cancelled">Cancelada</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm">Observações (Opcional)</label>
                            <textarea
                                name="observations"
                                value={formData.observations || ''}
                                onChange={handleChange}
                                className={`${inputStyle} h-24`}
                                rows={3}
                            />
                        </div>
                    </div>
                     <div className="flex justify-between items-center p-6 bg-slate-50 border-t">
                        <div>
                            {event && <button type="button" onClick={() => onDelete(event.id)} className="px-4 py-2 text-red-600 rounded-md hover:bg-red-100">Excluir</button>}
                        </div>
                        <div className="flex gap-2">
                             <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
                             <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700">Salvar</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Schedule: FC<{
    user: User;
    events: ClassEvent[];
    students: Student[];
    teachers: Teacher[];
    onSaveEvent: (event: Omit<ClassEvent, 'id'> | ClassEvent) => void;
    onDeleteEvent: (eventId: string) => void;
}> = ({ user, events, students, teachers, onSaveEvent, onDeleteEvent }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<ClassEvent | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    
    const calendarEvents = useMemo(() => {
        const statusColors = {
            scheduled: '#06b6d4', // cyan-500
            completed: '#10b981', // green-500
            cancelled: '#ef4444', // red-500
        };
        const userEvents = (events || []).filter(event => user.role === 'admin' || event.teacherUsername === user.username);
        
        return userEvents.map(event => ({
            id: event.id,
            title: `${event.time} - ${event.title}`,
            start: `${event.date}T${event.time}`,
            allDay: false,
            backgroundColor: statusColors[event.status] || '#64748b', // slate-500
            borderColor: statusColors[event.status] || '#64748b',
            extendedProps: {
                ...event
            }
        }));
    }, [events, user]);

    const handleDateSelect = (selectInfo: DateSelectArg) => {
        setSelectedDate(selectInfo.start);
        setSelectedEvent(null);
        setIsModalOpen(true);
    };

    const handleEventClick = (clickInfo: EventClickArg) => {
        const eventId = clickInfo.event.id;
        const originalEvent = (events || []).find(e => e.id === eventId);
        if (originalEvent) {
            setSelectedEvent(originalEvent);
            setSelectedDate(new Date(originalEvent.date + 'T' + originalEvent.time));
            setIsModalOpen(true);
        }
    };
    
    const handleSaveEvent = (data: Omit<ClassEvent, 'id'> | ClassEvent) => {
        onSaveEvent(data);
        setIsModalOpen(false); // Close modal after saving
    };
    
    const handleDeleteEvent = (eventId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este evento?')) {
            onDeleteEvent(eventId);
            setIsModalOpen(false);
        }
    };
    
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Agenda</h1>
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    initialView="dayGridMonth"
                    locale={ptBrLocale}
                    weekends={true}
                    events={calendarEvents}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    select={handleDateSelect}
                    eventClick={handleEventClick}
                />
            </div>
            {isModalOpen && <EventModal event={selectedEvent} eventDate={selectedDate} students={students} teachers={teachers} user={user} onSave={handleSaveEvent} onDelete={handleDeleteEvent} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default Schedule;
