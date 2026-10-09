import React, { useState, useEffect } from 'react';
import supabase from '../../supabaseClient';
import { Ticket, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [porcentagem, setPorcentagem] = useState('');
  const [validade, setValidade] = useState('');
  const [limiteUso, setLimiteUso] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cupons')
        .select('*')
        .order('codigo', { ascending: true });

      if (data) setCoupons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null) => {
    setEditItem(item);
    setCodigo(item ? item.codigo : '');
    setPorcentagem(item ? String(item.porcentagem_desconto) : '');
    setValidade(item && item.validade ? item.validade.split('T')[0] : '');
    setLimiteUso(item && item.limite_uso ? String(item.limite_uso) : '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditItem(null);
    setCodigo('');
    setPorcentagem('');
    setValidade('');
    setLimiteUso('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        codigo: codigo.trim().toUpperCase(),
        porcentagem_desconto: parseInt(porcentagem, 10),
        validade: validade ? new Date(validade).toISOString() : null,
        limite_uso: limiteUso ? parseInt(limiteUso, 10) : null
      };

      if (editItem) {
        const { error } = await supabase.from('cupons').update(payload).eq('id', editItem.id);
        if (error) throw error;
        toast.success('Cupom atualizado!');
      } else {
        const { error } = await supabase.from('cupons').insert([{ ...payload, ativo: true }]);
        if (error) throw error;
        toast.success('Cupom criado com sucesso!');
      }

      closeModal();
      fetchCoupons();
    } catch (err) {
      // Se der erro de coluna não encontrada, avisamos ao usuário
      if (err.message.includes('limite_uso')) {
        toast.error('Você precisa adicionar a coluna "limite_uso" (tipo int4) na tabela cupons no Supabase!');
      } else {
        toast.error('Erro ao salvar cupom: ' + err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAtivo = async (id, currentStatus) => {
    try {
      await supabase.from('cupons').update({ ativo: !currentStatus }).eq('id', id);
      toast.success(currentStatus ? 'Cupom pausado' : 'Cupom reativado');
      fetchCoupons();
    } catch (err) {
      toast.error('Erro ao alterar status: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este cupom permanentemente?')) return;

    try {
      const { error } = await supabase.from('cupons').delete().eq('id', id);
      if (error) throw error;
      toast.success('Cupom excluído!');
      fetchCoupons();
    } catch (err) {
      toast.error('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black uppercase text-white tracking-wider flex items-center gap-3">
            <Ticket className="text-[#00E5FF]" /> Cupons de Desconto
          </h1>
          <p className="text-xs text-gray-400">Crie códigos promocionais para aplicar descontos percentuais no checkout.</p>
        </div>

        <button
          onClick={() => openModal()}
          className="bg-[#00E5FF] text-[#0A0F1D] px-5 py-3 rounded-xl font-bold uppercase text-xs tracking-wider flex items-center gap-2 hover:bg-cyan-400 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={18} /> Novo Cupom
        </button>
      </div>

      <div className="bg-[#101935] border border-white/5 rounded-3xl overflow-hidden shadow-xl max-w-2xl">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[#00E5FF]/20 border-t-[#00E5FF] rounded-full animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-xs">
            Nenhum cupom cadastrado.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {coupons.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[#070B16]/50 transition-colors">
                <div>
                  <span className="font-display font-black text-white text-base tracking-wider block">
                    {c.codigo}
                  </span>
                  <p className="text-xs text-[#00E5FF] font-semibold">
                    {c.porcentagem_desconto}% de desconto
                    {c.validade && ` • Válido até ${new Date(c.validade).toLocaleDateString('pt-BR')}`}
                    {c.limite_uso ? ` • Limite: ${c.limite_uso} usos` : ' • Uso Ilimitado'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAtivo(c.id, c.ativo)}
                    className={`p-2 rounded-xl border text-xs font-bold ${
                      c.ativo 
                        ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' 
                        : 'border-gray-700 text-gray-500 bg-gray-800'
                    }`}
                    title={c.ativo ? 'Cupom Ativo' : 'Cupom Pausado'}
                  >
                    {c.ativo ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  </button>

                  <button
                    onClick={() => openModal(c)}
                    className="bg-[#0A0F1D] hover:bg-white/5 border border-white/10 text-gray-300 p-2 rounded-xl"
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(c.id)}
                    className="bg-[#0A0F1D] hover:bg-red-500/10 border border-white/10 text-red-400 p-2 rounded-xl"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101935] border border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-display font-black text-lg text-white">
              {editItem ? 'Editar Cupom' : 'Novo Cupom'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Código do Cupom *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: REFRESCA10"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00E5FF] uppercase font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Desconto (%) *</label>
                  <input 
                    type="number"
                    min="1"
                    max="100"
                    required
                    placeholder="Ex: 10"
                    value={porcentagem}
                    onChange={(e) => setPorcentagem(e.target.value)}
                    className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Limite Usos</label>
                  <input 
                    type="number"
                    min="1"
                    placeholder="Ilimitado"
                    value={limiteUso}
                    onChange={(e) => setLimiteUso(e.target.value)}
                    className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Validade (opcional)</label>
                <input 
                  type="date"
                  value={validade}
                  onChange={(e) => setValidade(e.target.value)}
                  className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-transparent border border-white/10 text-gray-400 py-2.5 rounded-xl text-xs font-bold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#00E5FF] text-[#0A0F1D] py-2.5 rounded-xl text-xs font-bold uppercase"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Coupons;
