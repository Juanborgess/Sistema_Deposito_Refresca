import React, { useState, useEffect } from 'react';
import supabase from '../../supabaseClient';
import { Users, Plus, Edit2, Trash2, CheckCircle, XCircle, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

const Motoboys = () => {
  const [motoboys, setMotoboys] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMotoboys();
  }, []);

  const fetchMotoboys = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('motoboys')
        .select('*')
        .order('nome', { ascending: true });

      if (data) setMotoboys(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null) => {
    setEditItem(item);
    setNome(item ? item.nome : '');
    setTelefone(item ? item.telefone : '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditItem(null);
    setNome('');
    setTelefone('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        nome: nome.trim(),
        telefone: telefone.trim()
      };

      if (editItem) {
        const { error } = await supabase.from('motoboys').update(payload).eq('id', editItem.id);
        if (error) throw error;
        toast.success('Entregador atualizado!');
      } else {
        const { error } = await supabase.from('motoboys').insert([{ ...payload, ativo: true }]);
        if (error) throw error;
        toast.success('Entregador cadastrado com sucesso!');
      }

      closeModal();
      fetchMotoboys();
    } catch (err) {
      toast.error('Erro ao salvar: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAtivo = async (id, currentStatus) => {
    try {
      await supabase.from('motoboys').update({ ativo: !currentStatus }).eq('id', id);
      toast.success(currentStatus ? 'Motoboy desativado' : 'Motoboy ativado');
      fetchMotoboys();
    } catch (err) {
      toast.error('Erro ao atualizar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este entregador?')) return;

    try {
      const { error } = await supabase.from('motoboys').delete().eq('id', id);
      if (error) {
        // Se houver pedido vinculado
        await supabase.from('motoboys').update({ ativo: false }).eq('id', id);
        toast('Entregador desativado (já possui entregas no histórico).', { icon: '⚠️' });
      } else {
        toast.success('Entregador excluído!');
      }
      fetchMotoboys();
    } catch (err) {
      toast.error('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black uppercase text-white tracking-wider flex items-center gap-3">
            <Users className="text-[#00E5FF]" /> Equipe de Motoboys
          </h1>
          <p className="text-xs text-gray-400">Cadastre os entregadores para vincular aos pedidos despachados.</p>
        </div>

        <button
          onClick={() => openModal()}
          className="bg-[#00E5FF] text-[#0A0F1D] px-5 py-3 rounded-xl font-bold uppercase text-xs tracking-wider flex items-center gap-2 hover:bg-cyan-400 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={18} /> Novo Motoboy
        </button>
      </div>

      <div className="bg-[#101935] border border-white/5 rounded-3xl overflow-hidden shadow-xl max-w-2xl">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[#00E5FF]/20 border-t-[#00E5FF] rounded-full animate-spin" />
          </div>
        ) : motoboys.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-xs">
            Nenhum entregador cadastrado.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {motoboys.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[#070B16]/50 transition-colors">
                <div>
                  <h4 className="font-bold text-white text-sm">{m.nome}</h4>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                    <Phone size={12} className="text-[#00E5FF]" /> {m.telefone}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAtivo(m.id, m.ativo)}
                    className={`p-2 rounded-xl border text-xs font-bold ${
                      m.ativo 
                        ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' 
                        : 'border-gray-700 text-gray-500 bg-gray-800'
                    }`}
                    title={m.ativo ? 'Disponível para entregas' : 'Indisponível'}
                  >
                    {m.ativo ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  </button>

                  <button
                    onClick={() => openModal(m)}
                    className="bg-[#0A0F1D] hover:bg-white/5 border border-white/10 text-gray-300 p-2 rounded-xl"
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(m.id)}
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
              {editItem ? 'Editar Motoboy' : 'Novo Motoboy'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Nome Completo *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">WhatsApp / Telefone *</label>
                <input 
                  type="tel"
                  required
                  placeholder="Ex: 21999998888"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
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

export default Motoboys;
