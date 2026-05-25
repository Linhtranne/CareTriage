import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const decodeHTML = (html) => {
  if (!html) return '';
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

const MessageBubble = ({ message, prevMessage, nextMessage, onResend }) => {
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

  const isSending = message.status === 'SENDING';
  const isFailed = message.status === 'FAILED';

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

      {/* For USER messages, render sending state or failed state with a retry option */}
      {!isAI && !isSystem && (
        <div className="mr-2 flex flex-col items-end justify-center self-center max-w-[200px]">
          {isSending && (
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-ping" />
              Đang gửi...
            </span>
          )}
          {isFailed && (
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[10px] text-red-500 font-bold text-right leading-tight">
                {message.error || 'Lỗi gửi tin'}
              </span>
              <button
                onClick={() => onResend?.(message.id)}
                className="text-[10px] text-emerald-600 hover:text-emerald-700 font-extrabold hover:underline"
              >
                Gửi lại
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bubble Container */}
      <div className={`flex flex-col max-w-[70%]`}>
        <div
          className={`${
            isAI 
              ? 'bg-[#E4E6EB] text-[#050505]' 
              : isFailed 
                ? 'bg-red-50 text-red-900 border border-red-100' 
                : 'bg-emerald-500 text-white'
          }`}
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
          <div className="markdown-content" style={{ whiteSpace: 'pre-wrap' }}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ ...props }) => <p style={{ margin: '0 0 8px 0', lastChild: { margin: 0 } }} {...props} />,
                ul: ({ ...props }) => <ul style={{ paddingLeft: '20px', marginBottom: '8px', listStyleType: 'disc' }} {...props} />,
                ol: ({ ...props }) => <ol style={{ paddingLeft: '20px', marginBottom: '8px', listStyleType: 'decimal' }} {...props} />,
                li: ({ ...props }) => <li style={{ marginBottom: '4px' }} {...props} />,
                strong: ({ ...props }) => <strong style={{ fontWeight: 800 }} {...props} />,
                h3: ({ ...props }) => <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '12px 0 8px 0', color: isAI ? '#064e3b' : '#fff' }} {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
