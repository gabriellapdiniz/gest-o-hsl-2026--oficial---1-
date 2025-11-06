import React, { FC, useState, useMemo } from 'react';
import { Task, User, Teacher } from '../types';

type TaskStatus = 'todo' | 'in-progress' | 'done';

const TaskModal: FC<{
    task: Omit<Task, 'id' | 'status'> | null;
    teachers: Teacher[];
    onSave: (task: Omit<Task, 'id' | 'status'>) => void;
    onClose: () => void;
}> = ({ task, teachers, onSave, onClose }) => {
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [assignedTo, setAssignedTo] = useState<string[]>(task?.assignedTo || []);

    const handleSave = () => {
        if (title.trim()) {
            onSave({ title, description, assignedTo });
            onClose();
        }
    };

    const handleAssigneeChange = (username: string) => {
        setAssignedTo(prev =>
            prev.includes(username)
                ? prev.filter(u => u !== username)
                : [...prev, username]
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-bold">Nova Tarefa</h3>
                </div>
                <div className="p-4 space-y-4">
                    <input type="text" placeholder="Título da Tarefa" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-md" />
                    <textarea placeholder="Descrição (opcional)" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded-md" rows={4}></textarea>
                    <div>
                        <h4 className="font-semibold mb-2">Atribuir para:</h4>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                            {teachers.map(t => (
                                <label key={t.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 cursor-pointer">
                                    <input type="checkbox" checked={assignedTo.includes(t.username)} onChange={() => handleAssigneeChange(t.username)} />
                                    <span>{t.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-4 flex justify-end gap-2 bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-md">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-cyan-600 text-white rounded-md">Salvar</button>
                </div>
            </div>
        </div>
    );
};

const TaskCard: FC<{ task: Task; onDragStart: (e: React.DragEvent, taskId: string) => void }> = ({ task, onDragStart }) => (
    <div
        draggable
        onDragStart={(e) => onDragStart(e, task.id)}
        className="p-3 bg-white border rounded-md shadow-sm cursor-grab mb-2"
    >
        <h4 className="font-semibold text-sm">{task.title}</h4>
        <p className="text-xs text-slate-600 mt-1">{task.description}</p>
        <div className="flex flex-wrap gap-1 mt-2">
            {task.assignedTo.map(username => (
                <span key={username} className="text-[10px] bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded-full">{username}</span>
            ))}
        </div>
    </div>
);

const TaskColumn: FC<{
    title: string;
    status: TaskStatus;
    tasks: Task[];
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onDrop: (e: React.DragEvent, status: TaskStatus) => void;
}> = ({ title, status, tasks, onDragStart, onDrop }) => {
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div
            onDrop={(e) => onDrop(e, status)}
            onDragOver={handleDragOver}
            className="flex-1 bg-slate-100 p-3 rounded-lg min-h-[300px]"
        >
            <h3 className="font-bold text-slate-700 mb-3 text-center">{title} ({tasks.length})</h3>
            <div className="space-y-2">
                {tasks.map(task => (
                    <TaskCard key={task.id} task={task} onDragStart={onDragStart} />
                ))}
            </div>
        </div>
    );
};


const Tasks: FC<{
    user: User;
    tasks: Task[];
    teachers: Teacher[];
    onAddTask: (task: Omit<Task, 'id' | 'status'>) => void;
    onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
}> = ({ user, tasks, teachers, onAddTask, onUpdateTaskStatus }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filteredTasks = useMemo(() => {
        if (user.role === 'admin') return tasks;
        return tasks.filter(t => t.assignedTo.includes(user.username));
    }, [tasks, user]);

    const columns: { title: string; status: TaskStatus }[] = [
        { title: 'A Fazer', status: 'todo' },
        { title: 'Em Andamento', status: 'in-progress' },
        { title: 'Concluído', status: 'done' },
    ];
    
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
    };

    const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
        const taskId = e.dataTransfer.getData('taskId');
        onUpdateTaskStatus(taskId, status);
    };


    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Gestor de Tarefas</h1>
                {user.role === 'admin' && (
                    <button onClick={() => setIsModalOpen(true)} className="bg-cyan-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-cyan-700">+ Nova Tarefa</button>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                {columns.map(col => (
                    <TaskColumn
                        key={col.status}
                        title={col.title}
                        status={col.status}
                        tasks={filteredTasks.filter(t => t.status === col.status)}
                        onDragStart={handleDragStart}
                        onDrop={handleDrop}
                    />
                ))}
            </div>
            {isModalOpen && <TaskModal task={null} teachers={teachers} onSave={onAddTask} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default Tasks;