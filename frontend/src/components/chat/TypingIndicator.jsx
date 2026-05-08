import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

const TypingIndicator = () => {
  return (
    <div className="flex items-end mt-[12px]">
      <div 
        className="flex-shrink-0 mr-2" 
        style={{ width: '28px' }}
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
          <Bot size={14} className="text-white" />
        </div>
      </div>
      <div 
        className="flex items-center gap-1.5 bg-[#E4E6EB]"
        style={{
          padding: '8px 16px',
          height: '36px',
          borderTopLeftRadius: '18px',
          borderTopRightRadius: '18px',
          borderBottomRightRadius: '18px',
          borderBottomLeftRadius: '4px',
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            className="w-2 h-2 rounded-full bg-slate-400"
          />
        ))}
      </div>
    </div>
  );
};

export default TypingIndicator;
