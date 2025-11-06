import React, { FC, useState } from 'react';
import { User, Notice, Teacher } from '../types';

interface NoticeBoardProps {
    user: User;
    notices: Notice[];
    teachers: Teacher[];
    onAddNotice?: (notice: Omit<Notice, 'id' | 'date' | 'author' | 'reactions' | 'comments'>) => void;
    onToggleReaction: (noticeId: string, emoji: string) => void;
    onAddComment: (noticeId: string, content: string) => void;
    onToggleCommentReaction: (noticeId: string, commentId: string, emoji: string) => void;
    onUpdateNotice: (noticeId: string, content: string) => void;
    onDeleteNotice: (noticeId: string) => void;
}

const NoticeBoard: FC<NoticeBoardProps> = ({ user, notices, teachers, onAddNotice, onToggleReaction, onAddComment, onToggleCommentReaction, onUpdateNotice, onDeleteNotice }) => {
    const [newNoticeContent, setNewNoticeContent] = useState('');
    const [recipients, setRecipients] = useState<'all' | string[]>('all');
    const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
    const [editingNotice, setEditingNotice] = useState<{ id: string; content: string } | null>(null);
    const [showAllNotices, setShowAllNotices] = useState(false); // State to control visibility
    
    const reactionEmojis = ['😊', '😢', '✔️', '❤️'];

    const filteredNotices = (notices || []).filter(n =>
        n.recipients === 'all' || (Array.isArray(n.recipients) && n.recipients.includes(user.username))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const noticesToDisplay = showAllNotices ? filteredNotices : filteredNotices.slice(0, 2);

    const getAuthorName = (username: string) => (teachers || []).find(t => t.username === username)?.name || username;

    const handleNoticeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newNoticeContent.trim() && onAddNotice) {
            onAddNotice({ content: newNoticeContent.trim(), recipients });
            setNewNoticeContent('');
        }
    };
    
    const handleCommentSubmit = (noticeId: string) => {
        const content = commentInputs[noticeId];
        if (content && content.trim()) {
            onAddComment(noticeId, content.trim());
            setCommentInputs(prev => ({ ...prev, [noticeId]: '' }));
        }
    };

    const handleUpdateSubmit = () => {
        if (editingNotice && editingNotice.content.trim()) {
            onUpdateNotice(editingNotice.id, editingNotice.content.trim());
            setEditingNotice(null);
        }
    };

    const handleDelete = (noticeId: string) => {
        if (window.confirm('Tem certeza que deseja apagar este aviso?')) {
            onDeleteNotice(noticeId);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-bold text-slate-700 mb-3">Mural de Avisos</h2>
            {user.role === 'admin' && onAddNotice && (
                <form onSubmit={handleNoticeSubmit} className="mb-4 p-3 border rounded-md bg-slate-50">
                    <textarea
                        value={newNoticeContent}
                        onChange={e => setNewNoticeContent(e.target.value)}
                        placeholder="Escreva um novo aviso..."
                        className="w-full p-2 border rounded-md text-sm"
                        rows={2}
                    />
                    <div className="flex justify-end items-center mt-2">
                        <button type="submit" className="bg-cyan-600 text-white px-3 py-1 rounded-md text-sm">Postar</button>
                    </div>
                </form>
            )}
            <div className={`space-y-4 ${showAllNotices ? 'max-h-[500px] overflow-y-auto pr-2' : ''}`}>
                {noticesToDisplay.length > 0 ? noticesToDisplay.map(notice => {
                     const isEditing = editingNotice?.id === notice.id;
                     const canEditOrDelete = user.role === 'admin' || user.username === notice.author;

                     return (
                         <div key={notice.id} className="p-3 border rounded-md bg-slate-50">
                            {isEditing ? (
                                <div className="mb-2">
                                    <textarea
                                        value={editingNotice.content}
                                        onChange={e => setEditingNotice({ ...editingNotice, content: e.target.value })}
                                        className="w-full p-2 border rounded-md text-sm"
                                        rows={3}
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button onClick={() => setEditingNotice(null)} className="text-xs px-3 py-1 bg-slate-200 rounded-md">Cancelar</button>
                                        <button onClick={handleUpdateSubmit} className="text-xs px-3 py-1 bg-cyan-600 text-white rounded-md">Salvar</button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-800 whitespace-pre-wrap">{notice.content}</p>
                            )}

                            <div className="flex justify-between items-center mt-2">
                                <p className="text-xs text-slate-500">
                                    <strong>{getAuthorName(notice.author)}</strong> - {new Date(notice.date).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {!isEditing && (
                                    <div className="flex items-center gap-2">
                                        {reactionEmojis.map(emoji => {
                                            const reactionCount = (notice.reactions || []).filter(r => r.emoji === emoji).length;
                                            const userReacted = (notice.reactions || []).some(r => r.emoji === emoji && r.user === user.username);
                                            return (
                                                <button key={emoji} onClick={() => onToggleReaction(notice.id, emoji)} className={`text-xs px-2 py-0.5 rounded-full flex items-center ${userReacted ? 'bg-cyan-200' : 'bg-slate-200 hover:bg-slate-300'}`}>
                                                    {emoji} <span className="ml-1 font-semibold">{reactionCount > 0 && reactionCount}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            
                            {!isEditing && canEditOrDelete && (
                                <div className="flex justify-end gap-3 mt-2 text-xs">
                                    <button onClick={() => setEditingNotice({ id: notice.id, content: notice.content })} className="text-slate-500 hover:underline">Editar</button>
                                    <button onClick={() => handleDelete(notice.id)} className="text-red-500 hover:underline">Apagar</button>
                                </div>
                            )}

                             <div className="mt-3 pt-3 border-t">
                                 {(notice.comments || []).map(comment => (
                                     <div key={comment.id} className="text-xs mb-2 p-2 bg-white rounded">
                                         <p><strong>{getAuthorName(comment.author)}:</strong> {comment.content}</p>
                                         <div className="flex items-center justify-end gap-2 mt-1">
                                            {reactionEmojis.map(emoji => {
                                                const reactionCount = (comment.reactions || []).filter(r => r.emoji === emoji).length;
                                                const userReacted = (comment.reactions || []).some(r => r.emoji === emoji && r.user === user.username);
                                                return (
                                                    <button key={emoji} onClick={() => onToggleCommentReaction(notice.id, comment.id, emoji)} className={`text-[10px] px-1.5 py-0.5 rounded-full flex items-center ${userReacted ? 'bg-cyan-100' : 'bg-slate-100 hover:bg-slate-200'}`}>
                                                        {emoji} <span className="ml-1 font-semibold">{reactionCount > 0 && reactionCount}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                     </div>
                                 ))}
                                 <div className="flex items-center gap-2 mt-2">
                                     <input
                                         value={commentInputs[notice.id] || ''}
                                         onChange={e => setCommentInputs(prev => ({ ...prev, [notice.id]: e.target.value }))}
                                         placeholder="Comentar..."
                                         className="w-full p-1 text-xs border rounded-md"
                                     />
                                     <button onClick={() => handleCommentSubmit(notice.id)} className="text-xs bg-slate-200 px-2 py-1 rounded-md">Enviar</button>
                                 </div>
                             </div>
                         </div>
                     )
                }) : <p className="text-sm text-slate-500 text-center py-4">Nenhum aviso no mural.</p>}
            </div>
            {filteredNotices.length > 2 && (
                <div className="text-center mt-4">
                    <button 
                        onClick={() => setShowAllNotices(!showAllNotices)} 
                        className="text-sm text-cyan-600 hover:underline"
                    >
                        {showAllNotices ? 'Mostrar menos' : `Ver todos os ${filteredNotices.length} avisos...`}
                    </button>
                </div>
            )}
        </div>
    );
};

export default NoticeBoard;