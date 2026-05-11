import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, X, ChevronDown, WifiOff,
  Sparkles, RotateCcw,
  Phone, Video, Minus, Mic, Image as ImageIcon, Sticker, Smile, ThumbsUp, User
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const QUICK_REPLIES = ['Đau đầu', 'Sốt cao', 'Ho có đờm', 'Khó thở', 'Đau ngực', 'Mất ngủ'];

const ChatWindow = ({
  messages = [],
  onSendMessage,
  loadMoreMessages,
  isTyping = false,
  isLoadingHistory = false,
  hasMore = true,
  onClose,
  isOpen = false,
  isConnected = false,
  isAiOnline = false,
  status = 'IDLE'
}) => {
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const [inputValue, setInputValue] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);

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
      loadMoreMessages?.();
    }
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const content = inputValue.trim();
    if (!content || isTyping || !isConnected) return;
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
    if (isTyping || !isConnected) {
      console.warn('[ChatWindow] Quick reply BLOCKED:', { isTyping, isConnected });
      return;
    }
    onSendMessage?.(text);
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

            <div className="flex items-center">
              <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-50 text-slate-400 transition-colors">
                <X size={22} strokeWidth={2.5} />
              </button>
            </div>
          </div>

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
                        disabled={!isConnected}
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
                  />
                ))}
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

          {/* ─── Quick Replies ─── */}
          {messages.length < 5 && messages.length > 0 && (
            <div className="flex-shrink-0 px-4 pt-3 pb-1 bg-white">
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                {QUICK_REPLIES.map((qr) => (
                  <button
                    key={qr}
                    onClick={() => handleQuickReply(qr)}
                    disabled={isTyping || !isConnected}
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
                disabled={isTyping || !isConnected}
                placeholder="Aa"
                className="flex-1 w-full text-[15px] resize-none bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:outline-none disabled:opacity-50 m-0 !shadow-none"
                style={{ 
                  color: '#1e293b',
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
                disabled={!inputValue.trim() || isTyping || !isConnected}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                  inputValue.trim() && !isTyping && isConnected 
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200 hover:scale-105 active:scale-95' 
                    : 'bg-slate-100 text-slate-300'
                }`}
              >
                <Send size={20} fill="currentColor" className={inputValue.trim() ? "translate-x-[1px]" : ""} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


export default ChatWindow;
