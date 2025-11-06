import React, { useState, useEffect, FC } from 'react';
import { onAuthStateChanged, User as FirebaseAuthUser, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, writeBatch, query, where, getDocs, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { User, Teacher, Student, ClassEvent, Notice, FinancialEntry, MiscIncome, GeneralExpense, Task, ProgressLogEntry } from './types';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Schedule from './components/Schedule';
import Students from './components/Students';
import Teachers from './components/Teachers';
import Financial from './components/Financial';
import Reports from './components/Reports';
import Tasks from './components/Tasks';
import MyProfile from './components/MyProfile';

const App: FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [activeView, setActiveView] = useState('dashboard');

    // Data states
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [events, setEvents] = useState<ClassEvent[]>([]);
    const [notices, setNotices] = useState<Notice[]>([]);
    const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>([]);
    const [miscIncomes, setMiscIncomes] = useState<MiscIncome[]>([]);
    const [generalExpenses, setGeneralExpenses] = useState<GeneralExpense[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    
    // Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseAuthUser | null) => {
            if (firebaseUser && firebaseUser.email) {
                // Find user in 'teachers' collection
                const q = query(collection(db, "teachers"), where("email", "==", firebaseUser.email));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const teacherData = querySnapshot.docs[0].data() as Teacher;
                    setUser(teacherData);
                } else {
                     console.error("User data not found in Firestore.");
                     setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Firestore Data Listeners
    useEffect(() => {
        if (!user) {
            // Clear data if user logs out
            setTeachers([]);
            setStudents([]);
            setEvents([]);
            setNotices([]);
            setFinancialEntries([]);
            setMiscIncomes([]);
            setGeneralExpenses([]);
            setTasks([]);
            return;
        }

        const collections: { name: string; setter: React.Dispatch<React.SetStateAction<any[]>> }[] = [
            { name: 'teachers', setter: setTeachers },
            { name: 'students', setter: setStudents },
            { name: 'events', setter: setEvents },
            { name: 'notices', setter: setNotices },
            { name: 'financialEntries', setter: setFinancialEntries },
            { name: 'miscIncomes', setter: setMiscIncomes },
            { name: 'generalExpenses', setter: setGeneralExpenses },
            { name: 'tasks', setter: setTasks },
        ];

        const unsubscribers = collections.map(({ name, setter }) => {
            const q = query(collection(db, name));
            return onSnapshot(q, (querySnapshot) => {
                const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setter(items);
            });
        });

        return () => unsubscribers.forEach(unsub => unsub());
    }, [user]);
    
    // --- Handlers ---
    const handleLogin = async (email: string, password: string) => {
        setLoginError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                 setLoginError('Email ou senha inválidos.');
            } else {
                 setLoginError('Ocorreu um erro ao fazer login.');
            }
        }
    };
    
    const handleLogout = async () => {
        await signOut(auth);
        setActiveView('dashboard');
    };

    const handleSaveStudent = async (studentData: Student | Omit<Student, 'id'>) => {
        if ('id' in studentData) {
            const { id, ...data } = studentData;
            await updateDoc(doc(db, 'students', id), data);
        } else {
            const newDocRef = doc(collection(db, 'students'));
            await setDoc(newDocRef, { ...studentData, id: newDocRef.id });
        }
    };

    const handleSaveTeacher = async (teacherData: Teacher | Omit<Teacher, 'id' | 'username_lowercase' | 'role'> & { role: 'admin' | 'teacher' }) => {
        try {
            if ('id' in teacherData) { // Editing existing teacher
                const { id, password, ...data } = teacherData;
                await updateDoc(doc(db, 'teachers', id), data);
                // NOTE: Password updates should be handled separately via Firebase Auth functions, not shown here for simplicity.
            } else { // Adding new teacher
                const { password, ...data } = teacherData;
                if (!password) {
                  alert("Senha é obrigatória para novos colaboradores.");
                  return;
                }
                // 1. Create user in Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(auth, data.email, password);
                const newUserId = `teacher-${data.username.replace(/\./g, '-')}`;
                // 2. Save user data in Firestore
                const teacherDoc: Teacher = {
                    ...data,
                    id: newUserId,
                    username_lowercase: data.username.toLowerCase(),
                    role: 'teacher' // New users are always teachers by default, admin can change this later if needed.
                };
                await setDoc(doc(db, 'teachers', newUserId), teacherDoc);
            }
        } catch (error: any) {
             console.error("Error saving teacher:", error);
             alert(`Erro ao salvar colaborador: ${error.message}`);
        }
    };
    
    const handleSaveEvent = async (eventData: ClassEvent | Omit<ClassEvent, 'id'>) => {
        if ('id' in eventData) {
            const { id, ...data } = eventData;
            await updateDoc(doc(db, 'events', id), data);
        } else {
            const newDocRef = doc(collection(db, 'events'));
            await setDoc(newDocRef, { ...eventData, id: newDocRef.id });
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        await deleteDoc(doc(db, 'events', eventId));
    };

    const handleAddProgressEntry = async (studentId: string, content: string) => {
        if (!user) return;
        const studentRef = doc(db, "students", studentId);
        const studentSnap = await getDoc(studentRef);

        if (studentSnap.exists()) {
            const studentData = studentSnap.data() as Student;
            const newEntry: ProgressLogEntry = {
                id: `prog-${Date.now()}`,
                author: user.username,
                date: new Date().toISOString(),
                content: content,
            };
            const newLog = [...(studentData.progressLog || []), newEntry];
            await updateDoc(studentRef, { progressLog: newLog });
        }
    };

    const handleUpdateFinancialEntry = async (entry: FinancialEntry) => {
        const { id, ...data } = entry;
        await updateDoc(doc(db, 'financialEntries', id), data);
    };

    const generateMonthlyEntries = async (month: number, year: number) => {
        const activeStudents = students.filter(s => s.status === 'active' && s.monthlyFee > 0);
        if (activeStudents.length === 0) {
            alert("Nenhum aluno ativo com mensalidade configurada.");
            return;
        }

        const monthYear = `${year}-${String(month + 1).padStart(2, '0')}`;
        const batch = writeBatch(db);

        for (const student of activeStudents) {
            // Check if an entry already exists for this student and month
            const q = query(
                collection(db, "financialEntries"),
                where("studentId", "==", student.id),
                where("monthYear", "==", monthYear)
            );
            const existingEntries = await getDocs(q);

            if (existingEntries.empty) {
                const newDocRef = doc(collection(db, 'financialEntries'));
                const newEntry: Omit<FinancialEntry, 'id'> = {
                    studentId: student.id,
                    description: `Mensalidade ${monthYear}`,
                    amount: student.monthlyFee,
                    monthYear: monthYear,
                    status: 'pending',
                };
                batch.set(newDocRef, {...newEntry, id: newDocRef.id});
            }
        }
        await batch.commit();
        alert("Mensalidades geradas com sucesso para alunos ativos!");
    };
    
    const CrudHandler = (collectionName: string) => ({
      add: async (data: any) => {
        const newDocRef = doc(collection(db, collectionName));
        await setDoc(newDocRef, { ...data, id: newDocRef.id });
      },
      update: async (item: any) => {
        const { id, ...data } = item;
        await updateDoc(doc(db, collectionName, id), data);
      },
      delete: async (id: string) => {
        await deleteDoc(doc(db, collectionName, id));
      },
    });

    const miscIncomeHandlers = CrudHandler('miscIncomes');
    const generalExpenseHandlers = CrudHandler('generalExpenses');
    const taskHandlers = {
        add: async (data: Omit<Task, 'id' | 'status'>) => {
            const newDocRef = doc(collection(db, 'tasks'));
            await setDoc(newDocRef, { ...data, id: newDocRef.id, status: 'todo' });
        },
        updateStatus: async (taskId: string, status: Task['status']) => {
            await updateDoc(doc(db, 'tasks', taskId), { status });
        }
    };
    
    // Notice Board Handlers
    const noticeHandlers = {
        add: async (noticeData: Omit<Notice, 'id' | 'date' | 'author' | 'reactions' | 'comments'>) => {
            if (!user) return;
            const newDocRef = doc(collection(db, 'notices'));
            const newNotice: Omit<Notice, 'id'> = {
                ...noticeData,
                author: user.username,
                date: new Date().toISOString(),
                reactions: [],
                comments: []
            };
            await setDoc(newDocRef, { ...newNotice, id: newDocRef.id });
        },
        toggleReaction: async (noticeId: string, emoji: string) => {
            if (!user) return;
            const noticeRef = doc(db, "notices", noticeId);
            const noticeSnap = await getDoc(noticeRef);
            if(noticeSnap.exists()) {
                const notice = noticeSnap.data() as Notice;
                const existingReactionIndex = notice.reactions.findIndex(r => r.user === user.username && r.emoji === emoji);
                let newReactions = [...notice.reactions];
                if (existingReactionIndex > -1) {
                    newReactions.splice(existingReactionIndex, 1);
                } else {
                    newReactions.push({ emoji, user: user.username });
                }
                await updateDoc(noticeRef, { reactions: newReactions });
            }
        },
        addComment: async (noticeId: string, content: string) => {
            if (!user) return;
            const noticeRef = doc(db, "notices", noticeId);
            const noticeSnap = await getDoc(noticeRef);
            if(noticeSnap.exists()) {
                const notice = noticeSnap.data() as Notice;
                const newComment = {
                    id: `comment-${Date.now()}`,
                    author: user.username,
                    content,
                    date: new Date().toISOString(),
                    reactions: []
                };
                await updateDoc(noticeRef, { comments: [...notice.comments, newComment] });
            }
        },
        toggleCommentReaction: async (noticeId: string, commentId: string, emoji: string) => {
             if (!user) return;
             const noticeRef = doc(db, "notices", noticeId);
             const noticeSnap = await getDoc(noticeRef);
             if (noticeSnap.exists()) {
                 const notice = noticeSnap.data() as Notice;
                 const newComments = notice.comments.map(c => {
                     if (c.id === commentId) {
                         const existingIndex = c.reactions.findIndex(r => r.user === user.username && r.emoji === emoji);
                         let newReactions = [...c.reactions];
                         if (existingIndex > -1) {
                            newReactions.splice(existingIndex, 1);
                         } else {
                            newReactions.push({ emoji, user: user.username });
                         }
                         return { ...c, reactions: newReactions };
                     }
                     return c;
                 });
                 await updateDoc(noticeRef, { comments: newComments });
             }
        },
        update: async (noticeId: string, content: string) => {
            await updateDoc(doc(db, "notices", noticeId), { content });
        },
        delete: async (noticeId: string) => {
            await deleteDoc(doc(db, "notices", noticeId));
        }
    };


    // Render logic
    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
    }

    if (!user) {
        return <Login onLogin={handleLogin} error={loginError} />;
    }

    const renderActiveView = () => {
        switch (activeView) {
            case 'dashboard':
                return <Dashboard
                            user={user}
                            events={events}
                            students={students}
                            notices={notices}
                            teachers={teachers}
                            financialEntries={financialEntries}
                            updateFinancialEntry={handleUpdateFinancialEntry}
                            onAddNotice={noticeHandlers.add}
                            onToggleReaction={noticeHandlers.toggleReaction}
                            onAddComment={noticeHandlers.addComment}
                            onToggleCommentReaction={noticeHandlers.toggleCommentReaction}
                            onUpdateNotice={noticeHandlers.update}
                            onDeleteNotice={noticeHandlers.delete}
                        />;
            case 'schedule':
                return <Schedule user={user} events={events} students={students} teachers={teachers} onSaveEvent={handleSaveEvent} onDeleteEvent={handleDeleteEvent} />;
            case 'students':
                return <Students user={user} students={students} teachers={teachers} events={events} onSaveStudent={handleSaveStudent} onUpdateEvent={handleSaveEvent} onAddProgressEntry={handleAddProgressEntry} />;
            case 'teachers':
                return <Teachers teachers={teachers} onSaveTeacher={handleSaveTeacher} />;
            case 'financial':
                return <Financial
                            user={user}
                            students={students}
                            teachers={teachers}
                            financialEntries={financialEntries}
                            miscIncomes={miscIncomes}
                            generalExpenses={generalExpenses}
                            generateMonthlyEntries={generateMonthlyEntries}
                            updateFinancialEntry={handleUpdateFinancialEntry}
                            addMiscIncome={miscIncomeHandlers.add}
                            updateMiscIncome={miscIncomeHandlers.update}
                            deleteMiscIncome={miscIncomeHandlers.delete}
                            addGeneralExpense={generalExpenseHandlers.add}
                            updateGeneralExpense={generalExpenseHandlers.update}
                            deleteGeneralExpense={generalExpenseHandlers.delete}
                         />;
            case 'reports':
                return <Reports students={students} teachers={teachers} events={events} financialEntries={financialEntries} miscIncomes={miscIncomes} generalExpenses={generalExpenses} />;
            case 'tasks':
                return <Tasks user={user} tasks={tasks} teachers={teachers} onAddTask={taskHandlers.add} onUpdateTaskStatus={taskHandlers.updateStatus} />;
            case 'my-profile':
                return <MyProfile user={user as Teacher} onUpdateUser={handleSaveTeacher} events={events} students={students} />;
            default:
                return <Dashboard user={user} events={events} students={students} notices={notices} teachers={teachers} financialEntries={financialEntries} updateFinancialEntry={handleUpdateFinancialEntry} onAddNotice={noticeHandlers.add} onToggleReaction={noticeHandlers.toggleReaction} onAddComment={noticeHandlers.addComment} onToggleCommentReaction={noticeHandlers.toggleCommentReaction} onUpdateNotice={noticeHandlers.update} onDeleteNotice={noticeHandlers.delete}/>;
        }
    };
    
    return (
        <div className="flex h-screen bg-slate-100">
            <Sidebar user={user} activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} />
            <main className="flex-1 overflow-y-auto">
                {renderActiveView()}
            </main>
        </div>
    );
};

export default App;
