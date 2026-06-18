import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, ChevronRight, UserCircle2, Star, Loader2, Hospital } from 'lucide-react';
import publicApi from '../../services/public-service';

const TriageConclusionCard = ({ result, messages = [] }) => {
  const navigate = useNavigate();
  const { suggested_department, summary, urgency_level } = result;
  
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiRationale, setAiRationale] = useState('');

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!suggested_department) return;
      
      setLoading(true);
      try {
        const patientSymptoms = messages
          .filter(m => m.senderType === 'USER')
          .map(m => m.content)
          .join('. ');

        const criteria = {
          symptoms: patientSymptoms,
          aiSummarySnapshot: summary,
          department: suggested_department,
          severity: urgency_level || 'NORMAL',
          triageTicketId: null
        };

        const res = await publicApi.getRecommendedDoctors(criteria);
        if (res?.data) {
          setRecommendations(res.data.recommendations || []);
          setAiRationale(res.data.rationale || '');
        }
      } catch (err) {
        console.error('Failed to fetch doctor recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [suggested_department, summary, urgency_level, messages]);

  const handleBook = (doctor = null) => {
    const stateParams: any = { 
      departmentName: suggested_department,
      reason: summary,
      fromTriage: true
    };
    
    if (doctor) {
      stateParams.prefillDoctorId = doctor.internalId;
      stateParams.prefillExternalDoctorId = doctor.externalId;
      stateParams.isExternal = doctor.external;
      stateParams.doctorName = doctor.doctorName;
    }

    navigate('/patient/appointments/book-appointment', { state: stateParams });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-4 space-y-4"
    >
      <button
        onClick={() => handleBook()}
        className="group w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
      >
        <CalendarCheck size={20} />
        ĐẶT LỊCH KHÁM: {suggested_department?.split(',')[0]}
        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
      </button>
      <p className="text-[10px] text-center mt-2 text-slate-400 font-bold uppercase tracking-tight">
        Bấm để tự chọn bác sĩ hoặc xem các đề xuất bên dưới
      </p>

      {/* Recommended Doctors Section */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex flex-col items-center justify-center py-6 space-y-3 bg-white/50 rounded-2xl border border-slate-100"
          >
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            <p className="text-xs text-slate-500 font-medium animate-pulse">
              AI đang tìm kiếm bác sĩ phù hợp nhất cho bạn...
            </p>
          </motion.div>
        )}

        {!loading && recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Star size={16} className="fill-emerald-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Bác sĩ đề xuất bởi AI</h4>
                <p className="text-[10px] text-slate-500">{aiRationale}</p>
              </div>
            </div>

            <div className="space-y-3">
              {recommendations.map((doc, idx) => (
                <div 
                  key={doc.doctorId || idx}
                  className="p-3 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all bg-slate-50/50 group"
                >
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm overflow-hidden flex-shrink-0">
                      {doc.avatarUrl ? (
                        <img src={doc.avatarUrl} alt={doc.doctorName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-500">
                          <UserCircle2 size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="font-bold text-slate-800 text-sm truncate">{doc.doctorName}</h5>
                          <p className="text-xs text-emerald-600 font-medium truncate">{doc.specialization}</p>
                        </div>
                        <div className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                          {Math.round(doc.matchScore * 100)}% Phù hợp
                        </div>
                      </div>
                      
                      {doc.hospitalName && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                          <Hospital size={10} />
                          <span className="truncate">{doc.hospitalName}</span>
                        </div>
                      )}
                      
                      <p className="text-[11px] text-slate-600 mt-2 italic line-clamp-2">
                        "{doc.matchReason}"
                      </p>

                      <button
                        onClick={() => handleBook(doc)}
                        className="mt-3 w-full py-2 bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-bold rounded-xl text-xs transition-colors"
                      >
                        Đặt lịch bác sĩ này
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TriageConclusionCard;
