import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, X, ImagePlus, ChevronDown, WifiOff,
  Bot, Sparkles, RotateCcw,
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
  status = 'IDLE'
}) => {
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const [inputValue, setInputValue] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Auto scroll
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
    if (isTyping || !isConnected) return;
    onSendMessage?.(text);
  };

  const handleImageClick = () => {
    alert('Tính năng gửi ảnh sẽ sớm được cập nhật!');
  };

  const isStatusConnected = status === 'CONNECTED';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 32, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full h-full sm:w-[380px] sm:h-[640px] sm:max-h-[calc(100vh-4rem)] flex flex-col bg-white sm:rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.15)] overflow-hidden z-[1000] border border-slate-200"
        >
          {/* ─── Header ─── */}
          <div 
            className="flex-shrink-0 bg-white flex items-center gap-2 border-b border-slate-200 shadow-sm z-10 relative"
            style={{ padding: '12px 16px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
          >
            <div className="relative flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-[#E4E6EB] overflow-hidden flex flex-col justify-end items-center">
                <User size={30} className="text-[#65676B] mb-[-4px]" strokeWidth={2.5} />
              </div>
              <span className={`absolute bottom-[0px] right-[0px] w-[14px] h-[14px] rounded-full border-[2px] border-white ${isStatusConnected ? 'bg-[#31A24C]' : 'bg-slate-300'}`} />
            </div>

            <div className="flex-1 min-w-0 flex flex-col cursor-pointer">
              <div className="flex items-center gap-1">
                <p className="text-[#050505] font-bold text-[16px] leading-tight hover:underline">Trợ lý CareTriage AI</p>
                <ChevronDown size={14} className="text-[#A855F7]" strokeWidth={3} />
              </div>
              <p className={`text-[12px] font-normal text-slate-500 mt-[2px]`}>
                {isStatusConnected ? 'Đang hoạt động' : 'Ngoại tuyến'}
              </p>
            </div>

            <div className="flex items-center gap-1 text-[#A855F7]">
              <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
                <Phone fill="currentColor" size={20} className="text-[#A855F7]" />
              </button>
              <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
                <Video fill="currentColor" size={24} className="text-[#A855F7]" />
              </button>
              <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
                <Minus size={28} className="text-[#A855F7]" strokeWidth={2.5} />
              </button>
              <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
                <X size={26} className="text-[#A855F7]" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* ─── Messages Area ─── */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-3 bg-white"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}
          >
            <div className="flex flex-col justify-end min-h-full py-3">
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
                  className="flex items-center justify-center gap-1.5 py-2 text-[11px] text-slate-400 hover:text-emerald-500 font-medium transition-colors mx-auto"
                >
                  <RotateCcw size={11} />
                  Tải thêm tin nhắn cũ
                </button>
              )}

              {/* Empty state */}
              {messages.length === 0 && !isLoadingHistory && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-5">
                    <Sparkles size={34} className="text-emerald-500" />
                  </div>
                  <h4 className="font-bold text-slate-700 text-base mb-2">Xin chào! Tôi là CareTriage AI</h4>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-[200px]">
                    Mô tả triệu chứng và tôi sẽ giúp bạn đánh giá sức khỏe ban đầu.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-6">
                    {QUICK_REPLIES.slice(0, 4).map((qr) => (
                      <button
                        key={qr}
                        onClick={() => handleQuickReply(qr)}
                        disabled={!isConnected}
                        className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-600 bg-transparent hover:bg-emerald-50 active:scale-95 transition-all disabled:opacity-40"
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
                className="absolute bottom-[110px] right-4 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-md hover:bg-slate-50 transition-colors z-10"
              >
                <ChevronDown size={16} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* ─── Quick Replies ─── */}
          {messages.length < 3 && messages.length > 0 && (
            <div className="flex-shrink-0 px-3 pt-2 pb-1 bg-white border-t border-slate-100">
              <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {QUICK_REPLIES.map((qr) => (
                  <button
                    key={qr}
                    onClick={() => handleQuickReply(qr)}
                    disabled={isTyping || !isConnected}
                    className="flex-shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-md border border-emerald-200 text-emerald-600 bg-transparent hover:bg-emerald-50 active:scale-95 transition-all disabled:opacity-40"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Input Area ─── */}
          <div className="flex-shrink-0 px-2 pb-3 pt-2 bg-white flex items-end gap-1 relative">
            {!isConnected && status !== 'CONNECTING' && status !== 'RECONNECTING' && (
              <div className="absolute bottom-16 left-0 right-0 flex justify-center z-50">
                <div className="flex items-center gap-2 text-[12px] text-white bg-black/70 rounded-full px-4 py-1.5 shadow-lg">
                  <WifiOff size={14} />
                  <span>Đang kết nối lại...</span>
                </div>
              </div>
            )}

            {/* Left Icons */}
            <div className="flex items-center text-[#0084FF] pb-[2px] pr-[4px]">
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
                 <Mic size={22} strokeWidth={2.5} />
              </button>
              <button onClick={handleImageClick} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors mx-[2px]">
                 <ImageIcon size={22} fill="currentColor" />
              </button>
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors mr-[2px]">
                 <Sticker size={24} fill="currentColor" />
              </button>
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
                 <div className="bg-[#0084FF] text-white text-[9px] font-black rounded-[4px] px-[3px] py-[2px] leading-none tracking-tighter">GIF</div>
              </button>
            </div>

            {/* Input Field */}
            <div className="flex-1 relative flex items-end bg-[#F0F2F5]" style={{ borderRadius: '20px', minHeight: '38px' }}>
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
                disabled={isTyping}
                placeholder="Aa"
                className="flex-1 w-full text-[15px] resize-none bg-transparent border-transparent focus:border-transparent focus:ring-0 focus:outline-none disabled:opacity-50 m-0 !shadow-none"
                style={{ 
                  color: '#050505',
                  padding: '9px 38px 9px 14px', 
                  maxHeight: '120px', 
                  overflowY: 'auto',
                  lineHeight: '1.3'
                }}
              />
              <button className="absolute right-[6px] bottom-[5px] w-7 h-7 flex items-center justify-center text-[#0084FF] rounded-full hover:bg-slate-200/50">
                <Smile size={22} strokeWidth={2.5} />
              </button>
            </div>

            {/* Right Icon: Like or Send */}
            <div className="pb-[2px] pl-[6px]">
              {inputValue.trim() ? (
                <button
                  onClick={handleSubmit}
                  disabled={isTyping || !isConnected}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#0084FF] hover:bg-slate-100 transition-colors"
                >
                  <Send size={22} fill="currentColor" className="translate-x-[2px]" />
                </button>
              ) : (
                <button
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#0084FF] hover:bg-slate-100 transition-colors"
                >
                  <ThumbsUp size={24} fill="currentColor" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatWindow;
