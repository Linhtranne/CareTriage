import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

const decodeHTML = (html) => {
  if (!html) return '';
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

const MessageBubble = ({ message, prevMessage, nextMessage }) => {
  const isAI = message.senderType === 'AI';
  const isSystem = message.senderType === 'SYSTEM';

  const isSameSenderAsPrev = prevMessage && prevMessage.senderType === message.senderType;
  const isSameSenderAsNext = nextMessage && nextMessage.senderType === message.senderType;

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="text-[11px] text-slate-500 font-medium">
          {decodeHTML(message.content)}
        </span>
      </div>
    );
  }

  // Messenger Grouping Logic
  const isStandalone = !isSameSenderAsPrev && !isSameSenderAsNext;
  const isFirstInGroup = !isSameSenderAsPrev && isSameSenderAsNext;
  const isMiddleInGroup = isSameSenderAsPrev && isSameSenderAsNext;
  const isLastInGroup = isSameSenderAsPrev && !isSameSenderAsNext;

  // Tính toán Radius cho từng góc (Inline style để bypass JIT bugs)
  const tl = isAI && (isMiddleInGroup || isLastInGroup) ? '4px' : '18px';
  const bl = isAI && (isFirstInGroup || isMiddleInGroup) ? '4px' : '18px';
  const tr = !isAI && (isMiddleInGroup || isLastInGroup) ? '4px' : '18px';
  const br = !isAI && (isFirstInGroup || isMiddleInGroup) ? '4px' : '18px';

  // Khoảng cách giữa các tin nhắn
  const marginTop = isSameSenderAsPrev ? '2px' : '12px';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`flex items-end ${isAI ? 'justify-start' : 'justify-end'}`}
      style={{ marginTop }}
    >
      {/* AI Avatar - Chỉ hiển thị ở tin cuối cùng của nhóm giống Messenger */}
      {isAI && (
        <div 
          className="flex-shrink-0 mr-2" 
          style={{ width: '28px', visibility: (isLastInGroup || isStandalone) ? 'visible' : 'hidden' }}
        >
          <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center overflow-hidden">
            <img src="/gemini-svg.svg" alt="AI" className="w-4 h-4 object-contain" />
          </div>
        </div>
      )}


      {/* Bubble Container */}
      <div className={`flex flex-col max-w-[70%]`}>
        <div
          className={`${isAI ? 'bg-[#E4E6EB] text-[#050505]' : 'bg-emerald-500 text-white'}`}
          style={{
            padding: '8px 12px',
            fontSize: '15px',
            lineHeight: '1.35',
            wordBreak: 'break-word',
            borderTopLeftRadius: tl,
            borderBottomLeftRadius: bl,
            borderTopRightRadius: tr,
            borderBottomRightRadius: br,
          }}
        >
          {decodeHTML(message.content)}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
