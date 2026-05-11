
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  MessageSquare, 
  Bot
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import axiosClient from '../../api/axiosClient';

const ChatHistoryList = ({ onSelectSession, currentSessionId }) => {
  const [sessions, setSessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const url = searchQuery 
        ? `/api/v1/chat/sessions?query=${encodeURIComponent(searchQuery)}`
        : '/api/v1/chat/sessions';
      const response = await axiosClient.get(url);
      setSessions(response.data);
    } catch (error) {
      console.error("Failed to fetch chat sessions", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchSessions();
    });
  }, [fetchSessions]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    
    // Nếu là hôm nay, chỉ hiện giờ
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'HH:mm', { locale: vi });
    }
    // Nếu là năm nay, hiện ngày tháng
    if (date.getFullYear() === now.getFullYear()) {
      return format(date, 'dd/MM', { locale: vi });
    }
    // Còn lại hiện đầy đủ
    return format(date, 'dd/MM/yyyy', { locale: vi });
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-100 w-full sm:w-[320px] lg:w-[380px]">
      {/* Header & Search */}
      <div className="p-6 pb-4">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Lịch sử tư vấn</h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm cuộc hội thoại..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setLoading(true);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all"
          />
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 space-y-3">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Đang tải lịch sử...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-center px-6">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <MessageSquare size={24} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">Không tìm thấy hội thoại nào</p>
            <p className="text-xs text-slate-400 mt-1">Bắt đầu một phiên tư vấn mới ngay!</p>
          </div>
        ) : (
          sessions.map((session) => (
            <motion.button
              key={session.id}
              whileHover={{ x: 4 }}
              onClick={() => onSelectSession(session)}
              className={`w-full flex items-center p-3 rounded-2xl transition-all ${
                currentSessionId === session.id 
                  ? 'bg-primary-50 ring-1 ring-primary-100' 
                  : 'hover:bg-slate-50'
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  session.sessionType === 'TRIAGE' ? 'bg-primary-100 text-primary-600' : 'bg-success-100 text-success-600'
                }`}>
                  <Bot size={24} />
                </div>
                {session.status === 'ACTIVE' && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success border-2 border-white rounded-full" />
                )}
              </div>

              {/* Info */}
              <div className="ml-3 flex-1 text-left overflow-hidden">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-sm font-bold text-slate-800 truncate pr-2">
                    {session.title || `Phiên ${session.sessionType}`}
                  </h4>
                  <span className="text-[10px] font-medium text-slate-400 flex-shrink-0">
                    {formatDate(session.lastMessageTime || session.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 truncate pr-4">
                    {session.lastMessageContent || "Chưa có tin nhắn"}
                  </p>
                  {session.status === 'COMPLETED' && (
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                      Đã đóng
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatHistoryList;
