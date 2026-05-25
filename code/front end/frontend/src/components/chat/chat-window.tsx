import { useEffect, useRef, useState, useMemo, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, X, ChevronDown, WifiOff,
  Sparkles, RotateCcw, History, MessageSquarePlus, Paperclip, Loader2
} from 'lucide-react';
import MessageBubble from './message-bubble';
import TypingIndicator from './typing-indicator';
import EmergencyOverlay from './emergency-overlay';
import TriageConclusionCard from './triage-conclusion-card';

const QUICK_REPLIES = ['Đau đầu', 'Sốt cao', 'Ho có đờm', 'Khó thở', 'Đau ngực', 'Mất ngủ'];

const ChatWindow = ({
  messages = [],
  onSendMessage,
  loadMoreMessages,
  isTyping = false,
  isLoadingHistory = false,
  hasMore = true,
  onClose,
  onOpenHistory,
  onNewChat,
  onUploadAttachment,
  isSessionReady = false,
  isSessionLoading = false,
  isUploadingAttachment = false,
  isOpen = false,
  isConnected = false,
  isAiOnline = false,
  status = 'IDLE',
  onCompleteTriage,
  onResendMessage
}) => {
  const loadMoreMessagesFn: (() => void) | undefined = loadMoreMessages
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const [inputValue, setInputValue] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Reconnection and soft update state variables
  const [isCompletingTriage, setIsCompletingTriage] = useState(false);
  const [missingInfo, setMissingInfo] = useState(null);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);

  const userMessageCount = useMemo(() => {
    return messages.filter(m => m.senderType === 'USER').length;
  }, [messages]);

  const handleCompleteTriage = async (forceSubmit = false) => {
    if (!onCompleteTriage) return;
    setIsCompletingTriage(true);
    setMissingInfo(null);
    try {
      const data = await onCompleteTriage(forceSubmit);
      if (data) {
        if (data.recommendation_ready === false && !forceSubmit) {
          setMissingInfo(data.missing_information || []);
        } else if (data.ticket) {
          setCreatedTicket(data.ticket);
          setShowSuccessOverlay(true);
        }
      }
    } catch (err) {
      console.error('[ChatWindow] Failed to complete triage:', err);
    } finally {
      setIsCompletingTriage(false);
    }
  };

  // Triage Logic
  const triageResult = useMemo(() => {
    const lastAiWithMeta = [...messages].reverse().find(m => m.senderType === 'AI' && (m.metadata || m.content?.includes('### 🏥')));
    if (!lastAiWithMeta) return null;
    
    // If we have structured metadata, use it
    if (lastAiWithMeta.metadata) {
      try {
        const meta = typeof lastAiWithMeta.metadata === 'string' 
          ? JSON.parse(lastAiWithMeta.metadata) 
          : lastAiWithMeta.metadata;
        return meta.triage_result || meta;
      } catch { /* fall through to content parsing */ }
    }

    // Fallback: Parse from content if metadata is missing/malformed but looks like a result
    if (lastAiWithMeta.content?.includes('### 🏥')) {
      const content = lastAiWithMeta.content;
      const deptMatch = content.match(/Chuyên khoa đề xuất:\s*\*\*?(.*?)\*\*?(\n|$)/i);
      const urgencyMatch = content.match(/Mức độ ưu tiên:\s*\[(.*?)\]/i);
      
      return {
        suggested_department: deptMatch ? deptMatch[1].trim() : 'Nội tổng quát',
        urgency_level: urgencyMatch ? (urgencyMatch[1].includes('CẤP CỨU') ? 'EMERGENCY' : 'MEDIUM') : 'MEDIUM',
        summary: 'Dựa trên thông tin sơ chẩn vừa thực hiện.',
        is_complete: true
      };
    }
    
    return null;
  }, [messages]);

  const isEmergency = triageResult?.urgency_level === 'EMERGENCY';
  const isComplete = triageResult?.is_complete || triageResult?.urgency_level !== undefined;

  // ... (auto scroll logic remains same)
  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const nearBottom = scrollHeight - scrollTop - clientHeight < 150;

    if (messages.length <= 2) {
      el.scrollTop = el.scrollHeight;
    } else if (nearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      const delta = el.scrollHeight - prevScrollHeightRef.current;
      el.scrollTop = el.scrollTop + delta;
    }
    prevScrollHeightRef.current = el.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);


  const handleScroll = (e) => {
    const el = e.currentTarget;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(fromBottom > 200);

    if (el.scrollTop === 0 && hasMore && !isLoadingHistory) {
      prevScrollHeightRef.current = scrollRef.current?.scrollHeight || 0;
      loadMoreMessagesFn?.();
    }
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  const handleSubmit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const content = inputValue.trim();
    if (!content || isTyping || !isConnected || !isSessionReady) return;
    onSendMessage?.(content);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickReply = (text) => {
    console.log('[ChatWindow] Quick reply clicked:', text, { isTyping, isConnected });
    if (isTyping || !isConnected || !isSessionReady) {
      console.warn('[ChatWindow] Quick reply BLOCKED:', { isTyping, isConnected });
      return;
    }
    onSendMessage?.(text);
  };

  const handleAttachmentClick = () => {
    if (!isSessionReady || isTyping || isUploadingAttachment) return;
    attachmentInputRef.current?.click();
  };

  const handleAttachmentChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onUploadAttachment || !isSessionReady) return;

    try {
      await onUploadAttachment(file);
    } catch (error) {
      console.error('[ChatWindow] Failed to upload attachment:', error);
    }
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 32, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full h-full sm:w-[400px] sm:h-[680px] sm:max-h-[calc(100vh-4rem)] flex flex-col bg-white sm:rounded-[16px] shadow-[0_12px_48px_rgba(0,0,0,0.15)] overflow-hidden z-[1000] border border-slate-100"
        >
          {/* ─── Header ─── */}
          <div 
            className="flex-shrink-0 bg-white flex items-center gap-3 border-b border-slate-100 z-10 relative"
            style={{ padding: '14px 20px' }}
          >
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center overflow-hidden border border-emerald-100">
                <img src="/gemini-svg.svg" alt="AI Avatar" className="w-7 h-7 object-contain" />
              </div>
              <span className={`absolute bottom-[1px] right-[1px] w-[13px] h-[13px] rounded-full border-[2.5px] border-white ${isAiOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center gap-1.5">
                <p className="text-slate-900 font-bold text-[16px] leading-tight">Trợ lý CareTriage AI</p>
                {isAiOnline && <Sparkles size={14} className="text-emerald-500 fill-emerald-500" />}
              </div>
              <p className={`text-[12px] font-medium mt-[2px] ${isAiOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isAiOnline ? 'Đang hoạt động' : 'Đang ngoại tuyến'}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {onOpenHistory && (
                <button
                  onClick={onOpenHistory}
                  disabled={isTyping || isSessionLoading || isEmergency}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-50 text-slate-400 transition-colors disabled:opacity-40"
                  title="Lịch sử chat"
                >
                  <History size={18} />
                </button>
              )}
              {onNewChat && (
                <button
                  onClick={onNewChat}
                  disabled={isTyping || isSessionLoading || isEmergency}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-50 text-slate-400 transition-colors disabled:opacity-40"
                  title="Chat mới"
                >
                  <MessageSquarePlus size={18} />
                </button>
              )}
              <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-50 text-slate-400 transition-colors">
                <X size={22} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Connection Status Banner */}
          <AnimatePresence>
            {status !== 'CONNECTED' && status !== 'IDLE' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`flex-shrink-0 px-4 py-2 flex items-center justify-between gap-2 text-[12px] text-white border-b ${
                  status === 'CONNECTING' || status === 'RECONNECTING'
                    ? 'bg-amber-500 border-amber-600'
                    : 'bg-rose-500 border-rose-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  {(status === 'CONNECTING' || status === 'RECONNECTING') ? (
                    <Loader2 size={13} className="animate-spin text-white" />
                  ) : (
                    <WifiOff size={13} className="text-white" />
                  )}
                  <span>
                    {status === 'CONNECTING' && 'Đang kết nối với máy chủ...'}
                    {status === 'RECONNECTING' && 'Mất kết nối. Đang kết nối lại...'}
                    {status === 'DISCONNECTED' && 'Đã ngắt kết nối với máy chủ.'}
                    {status === 'ERROR' && 'Lỗi kết nối WebSocket.'}
                  </span>
                </div>
                {status === 'DISCONNECTED' && (
                  <button 
                    onClick={() => window.location.reload()} 
                    className="text-[10px] font-extrabold px-2.5 py-1 rounded bg-white text-rose-600 hover:bg-rose-50 active:scale-95 transition-all shadow-sm"
                  >
                    Thử lại
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {isEmergency && <EmergencyOverlay />}

          {/* ─── Messages Area ─── */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 bg-white"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#f1f5f9 transparent' }}
          >
            <div className="flex flex-col justify-end min-h-full py-4">
              {isLoadingHistory && (
                <div className="flex justify-center py-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <span>Đang tải lịch sử...</span>
                  </div>
                </div>
              )}

              {hasMore && !isLoadingHistory && messages.length > 0 && (
                <button
                  onClick={() => { prevScrollHeightRef.current = scrollRef.current?.scrollHeight || 0; loadMoreMessages?.(); }}
                  className="flex items-center justify-center gap-1.5 py-2 text-[11px] text-slate-400 hover:text-emerald-500 font-medium transition-colors mx-auto mb-4"
                >
                  <RotateCcw size={11} />
                  Tải thêm tin nhắn cũ
                </button>
              )}

              {/* Empty state */}
              {messages.length === 0 && !isLoadingHistory && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-6">
                  <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
                    <img src="/gemini-svg.svg" alt="AI Avatar" className="w-10 h-10" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg mb-2">Xin chào! Tôi là CareTriage AI</h4>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-[240px]">
                    Mô tả triệu chứng của bạn, tôi sẽ giúp đánh giá sức khỏe và điều hướng chuyên khoa phù hợp.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-8">
                    {QUICK_REPLIES.slice(0, 4).map((qr) => (
                      <button
                        key={qr}
                        onClick={() => handleQuickReply(qr)}
                        disabled={!isConnected || isTyping || !isSessionReady}
                        className="text-[12px] font-semibold px-4 py-2 rounded-xl border border-emerald-100 text-emerald-700 bg-emerald-50/30 hover:bg-emerald-50 active:scale-95 transition-all disabled:opacity-40"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <MessageBubble
                    key={msg.id ? `msg-${msg.id}` : `temp-${idx}-${msg.createdAt ?? idx}`}
                    message={msg}
                    prevMessage={messages[idx - 1]}
                    nextMessage={messages[idx + 1]}
                    onResend={onResendMessage}
                  />
                ))}
                
                {isComplete && !isEmergency && triageResult && (
                  <TriageConclusionCard result={triageResult} />
                )}
              </AnimatePresence>

              {/* Typing */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                  >
                    <TypingIndicator />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Scroll to bottom button */}
          <AnimatePresence>
            {showScrollBtn && (
              <motion.button
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                onClick={scrollToBottom}
                className="absolute bottom-[90px] right-6 w-9 h-9 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 shadow-lg hover:text-emerald-500 transition-colors z-10"
              >
                <ChevronDown size={18} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* ─── CTA & Missing Info Panels ─── */}
          {userMessageCount >= 2 && !isEmergency && !isCompletingTriage && !missingInfo && !showSuccessOverlay && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-shrink-0 px-4 py-2.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-t border-b border-emerald-100/50 flex items-center justify-between gap-3 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-emerald-600 animate-pulse" />
                <span className="text-[12px] font-bold text-emerald-800">
                  Đủ thông tin sơ chẩn
                </span>
              </div>
              <button
                onClick={() => handleCompleteTriage(false)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[11px] font-extrabold shadow-[0_4px_12px_color-mix(in srgb, var(--color-primary-500) 20%, transparent)] hover:scale-[1.03] active:scale-95 transition-all duration-200"
              >
                Nhận khuyến nghị & Gửi bác sĩ
              </button>
            </motion.div>
          )}

          {missingInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex-shrink-0 px-4 py-3 bg-amber-50/90 border-t border-b border-amber-100/80 flex flex-col gap-2.5"
            >
              <div className="flex gap-2 items-start">
                <span className="text-amber-500 text-[18px] leading-none">⚠️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-amber-900 leading-tight">
                    Cần bổ sung thông tin
                  </p>
                  <p className="text-[11px] text-amber-700/90 mt-1 leading-relaxed">
                    AI cần làm rõ một số chi tiết để phân tích chính xác nhất:
                  </p>
                  <ul className="list-disc pl-4 mt-1.5 text-[11px] text-amber-800 font-medium space-y-0.5">
                    {missingInfo.map((info, idx) => (
                      <li key={idx}>{info}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-1">
                <button
                  onClick={() => handleCompleteTriage(true)}
                  className="px-2.5 py-1.5 rounded-lg border border-amber-200 text-amber-800 hover:bg-amber-100/50 text-[10px] font-extrabold transition-all"
                >
                  Gửi bác sĩ ngay (Bỏ qua)
                </button>
                <button
                  onClick={() => setMissingInfo(null)}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-extrabold transition-all shadow-sm"
                >
                  Tiếp tục trò chuyện
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Quick Replies ─── */}
          {messages.length < 5 && messages.length > 0 && (
            <div className="flex-shrink-0 px-4 pt-3 pb-1 bg-white">
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                {QUICK_REPLIES.map((qr) => (
                  <button
                    key={qr}
                    onClick={() => handleQuickReply(qr)}
                    disabled={isTyping || !isConnected || !isSessionReady}
                    className="flex-shrink-0 text-[12px] font-semibold px-3.5 py-1.5 rounded-lg border border-emerald-100 text-emerald-700 bg-emerald-50/20 hover:bg-emerald-50 active:scale-95 transition-all disabled:opacity-40"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Input Area ─── */}
          <div className="flex-shrink-0 px-4 pb-5 pt-2 bg-white flex items-end gap-2 relative">
            {!isConnected && status !== 'CONNECTING' && status !== 'RECONNECTING' && (
              <div className="absolute -top-10 left-0 right-0 flex justify-center z-50">
                <div className="flex items-center gap-2 text-[12px] text-white bg-slate-800/90 rounded-full px-4 py-1.5 shadow-xl backdrop-blur-sm">
                  <WifiOff size={14} className="text-amber-400" />
                  <span>Mất kết nối. Đang thử lại...</span>
                </div>
              </div>
            )}

            {/* Upload Button */}
            {onUploadAttachment && (
              <div className="pb-[4px]">
                <button
                  onClick={handleAttachmentClick}
                  disabled={!isSessionReady || isTyping || isUploadingAttachment}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95 disabled:opacity-40"
                  title="Tải tài liệu lên"
                >
                  {isUploadingAttachment ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Paperclip size={18} />
                  )}
                </button>
                <input
                  ref={attachmentInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*,text/plain"
                  onChange={handleAttachmentChange}
                />
              </div>
            )}

            {/* Input Field */}
            <div className="flex-1 relative flex items-end bg-slate-50 border border-slate-100 focus-within:border-emerald-400 focus-within:bg-white transition-all duration-200" style={{ borderRadius: '24px', minHeight: '44px' }}>
              <textarea
                ref={inputRef}
                rows={1}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={handleKeyDown}
                disabled={isTyping || !isConnected || !isSessionReady || isEmergency}
                placeholder={isEmergency ? "Hệ thống đã khóa" : "Aa"}
                className="flex-1 w-full text-[15px] resize-none bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:outline-none disabled:opacity-50 m-0 !shadow-none"
                style={{ 
                  color: 'text.primary',
                  padding: '11px 16px', 
                  maxHeight: '120px', 
                  overflowY: 'auto',
                  lineHeight: '1.4',
                  outline: 'none',
                  boxShadow: 'none'
                }}
              />
            </div>


            {/* Send Button */}
            <div className="pb-[4px]">
              <button
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isTyping || !isConnected || !isSessionReady}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                  inputValue.trim() && !isTyping && isConnected && isSessionReady
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200 hover:scale-105 active:scale-95'
                    : 'bg-slate-100 text-slate-300'
                }`}
              >
                <Send size={20} fill="currentColor" className={inputValue.trim() && isSessionReady ? "translate-x-[1px]" : ""} />
              </button>
            </div>
          </div>

          {/* ─── Loading / Completing Overlay ─── */}
          <AnimatePresence>
            {isCompletingTriage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <Loader2 size={32} className="text-emerald-500 animate-spin" />
                  </div>
                </div>
                <h4 className="font-extrabold text-slate-800 text-base mb-2">CareTriage AI đang phân tích</h4>
                <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed">
                  Đang tổng hợp bệnh sử từ hội thoại và lập hồ sơ lâm sàng gửi đến các bác sĩ chuyên khoa...
                </p>
                <div className="w-48 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-6">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "95%" }}
                    transition={{ duration: 2.5, ease: "easeInOut" }}
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Success Creation / Update Overlay ─── */}
          <AnimatePresence>
            {showSuccessOverlay && createdTicket && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-b from-white via-white to-emerald-50/20 z-[60] flex flex-col items-center justify-center p-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="flex flex-col items-center w-full"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-100">
                    <Send size={28} className="translate-x-[2px]" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-lg mb-2">Gửi hồ sơ thành công!</h4>
                  <p className="text-[13px] text-slate-500 max-w-[280px] leading-relaxed mb-6">
                    Hồ sơ lâm sàng số <span className="font-bold text-slate-700">{createdTicket.ticketNumber}</span> đã được lưu vết và điều hướng đến bộ phận chuyên môn.
                  </p>

                  <div className="w-full max-w-[280px] bg-white rounded-xl border border-slate-100 p-4 shadow-sm mb-8 text-left space-y-2">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-slate-400">Trạng thái:</span>
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {createdTicket.status === 'NEW' ? 'Chờ tiếp nhận' : createdTicket.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-slate-400">Độ khẩn cấp:</span>
                      <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                        {createdTicket.priority}
                      </span>
                    </div>
                    <div className="text-[12px] border-t border-slate-50 pt-2">
                      <span className="text-slate-400 block mb-1">Mô tả:</span>
                      <span className="text-slate-600 font-medium line-clamp-2 leading-tight">
                        {createdTicket.description || createdTicket.title}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 w-full max-w-[240px]">
                    <button
                      onClick={() => {
                        setShowSuccessOverlay(false);
                        window.location.href = '/patient/triage-tickets';
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-[13px] shadow-[0_4px_16px_color-mix(in srgb, var(--color-primary-500) 25%, transparent)] transition-all duration-200"
                    >
                      Xem phiếu tư vấn
                    </button>
                    <button
                      onClick={() => setShowSuccessOverlay(false)}
                      className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-[13px] transition-all"
                    >
                      Đóng
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


export default ChatWindow;
