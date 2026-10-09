import React, { useState, useEffect } from 'react';
import supabase from '../../supabaseClient';
import { Clock, CalendarDays, Save, Sparkles, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Schedule = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState({
    horario_abertura: '08:00:00',
    horario_fechamento: '23:00:00',
    dias_funcionamento: [0, 1, 2, 3, 4, 5, 6],
    chave_pix: '21992962260',
    texto_banner: 'Peça sua bebida trincando de gelada com entrega rápida!'
  });

  const diasSemana = [
    { id: 0, nome: 'Dom' },
    { id: 1, nome: 'Seg' },
    { id: 2, nome: 'Ter' },
    { id: 3, nome: 'Qua' },
    { id: 4, nome: 'Qui' },
    { id: 5, nome: 'Sex' },
    { id: 6, nome: 'Sáb' }
  ];

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('configuracoes_loja')
        .select('*')
        .limit(1)
        .single();
        
      if (data) {
        setConfig({
          horario_abertura: data.horario_abertura || '08:00:00',
          horario_fechamento: data.horario_fechamento || '23:00:00',
          dias_funcionamento: data.dias_funcionamento || [0, 1, 2, 3, 4, 5, 6],
          chave_pix: data.chave_pix || '21992962260',
          texto_banner: data.texto_banner || ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (diaId) => {
    setConfig((prev) => {
      const isSelected = prev.dias_funcionamento.includes(diaId);
      let newDias = [];
      if (isSelected) {
        newDias = prev.dias_funcionamento.filter(d => d !== diaId);
      } else {
        newDias = [...prev.dias_funcionamento, diaId].sort();
      }
      return { ...prev, dias_funcionamento: newDias };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: current } = await supabase.from('configuracoes_loja').select('id').limit(1).single();

      let error;
      if (current) {
        const res = await supabase.from('configuracoes_loja').update(config).eq('id', current.id);
        error = res.error;
      } else {
        const res = await supabase.from('configuracoes_loja').insert([config]);
        error = res.error;
      }

      if (error) throw error;
      toast.success('Configurações do depósito salvas com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-black uppercase text-white tracking-wider flex items-center gap-3">
          <Clock className="text-[#00E5FF]" /> Horários & Expediente
        </h1>
        <p className="text-xs text-gray-400">
          Configure a jornada diária do depósito. Fora deste horário, os pedidos são recebidos como <strong>Agendados</strong>.
        </p>
      </div>

      <div className="bg-[#101935] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[#00E5FF]/20 border-t-[#00E5FF] rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Dias de Funcionamento */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Dias de Funcionamento
              </label>
              <div className="grid grid-cols-7 gap-2">
                {diasSemana.map((d) => {
                  const isChecked = config.dias_funcionamento.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleDayToggle(d.id)}
                      className={`py-3 rounded-xl text-xs font-black uppercase transition-all ${
                        isChecked 
                          ? 'bg-[#00E5FF] text-[#0A0F1D] shadow-lg shadow-cyan-500/20' 
                          : 'bg-[#0A0F1D] text-gray-500 border border-white/5 hover:border-white/20'
                      }`}
                    >
                      {d.nome}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Horários */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Horário de Abertura
                </label>
                <input 
                  type="time"
                  value={config.horario_abertura ? config.horario_abertura.substring(0, 5) : '08:00'}
                  onChange={(e) => setConfig(prev => ({ ...prev, horario_abertura: e.target.value + ':00' }))}
                  className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Horário de Fechamento
                </label>
                <input 
                  type="time"
                  value={config.horario_fechamento ? config.horario_fechamento.substring(0, 5) : '23:00'}
                  onChange={(e) => setConfig(prev => ({ ...prev, horario_fechamento: e.target.value + ':00' }))}
                  className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                />
              </div>
            </div>

            {/* Chave Pix */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Chave Pix da Loja (para a mensagem do WhatsApp)
              </label>
              <input 
                type="text"
                value={config.chave_pix}
                onChange={(e) => setConfig(prev => ({ ...prev, chave_pix: e.target.value }))}
                className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
              />
            </div>

            {/* Texto do Banner Superior */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Aviso Promocional
              </label>
              <input 
                type="text"
                value={config.texto_banner}
                onChange={(e) => setConfig(prev => ({ ...prev, texto_banner: e.target.value }))}
                className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#FFDE59] text-[#0A0F1D] font-display font-black text-xs uppercase tracking-wider py-4 rounded-xl shadow-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>

          </form>
        )}
      </div>
    </div>
  );
};

export default Schedule;
