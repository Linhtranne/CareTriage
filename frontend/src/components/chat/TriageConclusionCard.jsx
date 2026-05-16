import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, ChevronRight, Stethoscope, ClipboardList } from 'lucide-react';

const TriageConclusionCard = ({ result }) => {
  const navigate = useNavigate();
  const { suggested_department, summary } = result;

  const handleBook = () => {
    navigate('/patient/appointments/book-appointment', { 
      state: { 
        departmentName: suggested_department,
        reason: summary,
        fromTriage: true
      } 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-4"
    >
      <button
        onClick={handleBook}
        className="group w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
      >
        <CalendarCheck size={20} />
        ĐẶT LỊCH KHÁM: {suggested_department?.split(',')[0]}
        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
      </button>
      <p className="text-[10px] text-center mt-2 text-slate-400 font-bold uppercase tracking-tight">
        Bấm để tự động điền thông tin và chọn bác sĩ
      </p>
    </motion.div>
  );
};

export default TriageConclusionCard;
