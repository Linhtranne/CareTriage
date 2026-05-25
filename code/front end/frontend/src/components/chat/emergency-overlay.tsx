import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, PhoneCall, ShieldAlert } from 'lucide-react';

const EmergencyOverlay = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[1100] bg-red-600/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center text-white"
    >
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, -5, 5, 0]
        }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-8"
      >
        <ShieldAlert size={48} className="text-white" />
      </motion.div>

      <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">
        Cảnh báo khẩn cấp
      </h2>
      
      <p className="text-lg font-medium mb-8 leading-relaxed opacity-90">
        Các dấu hiệu bạn mô tả cho thấy đây là một tình trạng y tế nghiêm trọng. Đừng mất thời gian chat nữa.
      </p>

      <div className="w-full max-w-xs space-y-4">
        <a 
          href="tel:115"
          className="flex items-center justify-center gap-3 w-full py-5 bg-white text-red-600 rounded-2xl font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
        >
          <PhoneCall size={24} fill="currentColor" />
          GỌI 115 NGAY
        </a>

        <div className="p-5 bg-black/20 rounded-2xl border border-white/10 text-left">
          <p className="text-sm font-bold mb-2 flex items-center gap-2">
            <AlertTriangle size={16} /> Lời khuyên nhanh:
          </p>
          <ul className="text-xs space-y-2 opacity-80 list-disc pl-4 font-semibold">
            <li>Nằm nghỉ ở tư thế thoải mái nhất.</li>
            <li>Nới lỏng quần áo, cà vạt, thắt lưng.</li>
            <li>Tuyệt đối không tự lái xe đến bệnh viện.</li>
            <li>Giữ bình tĩnh và chờ đội ngũ y tế.</li>
          </ul>
        </div>
      </div>

      <p className="mt-8 text-[10px] font-bold opacity-50 uppercase tracking-widest">
        Hệ thống chat đã bị khóa để đảm bảo an toàn
      </p>
    </motion.div>
  );
};

export default EmergencyOverlay;
