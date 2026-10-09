import React, { useState, useEffect } from 'react';
import supabase from '../../supabaseClient';
import { Truck, Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const Shipping = () => {
  const [fretes, setFretes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [bairro, setBairro] = useState('');
  const [valor, setValor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFretes();
  }, []);

  const fetchFretes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('taxas_frete')
        .select('*')
        .order('bairro', { ascending: true });

      if (data) setFretes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null) => {
    setEditItem(item);
    setBairro(item ? item.bairro : '');
    setValor(item ? String(item.valor) : '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditItem(null);
    setBairro('');
    setValor('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        bairro: bairro.trim(),
        valor: parseFloat(valor.replace(',', '.'))
      };

      if (editItem) {
        const { error } = await supabase.from('taxas_frete').update(payload).eq('id', editItem.id);
        if (error) throw error;
        toast.success('Taxa atualizada com sucesso!');
      } else {
        const { error } = await supabase.from('taxas_frete').insert([payload]);
        if (error) throw error;
        toast.success('Bairro e taxa adicionados!');
      }

      closeModal();
      fetchFretes();
    } catch (err) {
      toast.error('Erro ao salvar taxa: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover este bairro?')) return;

    try {
      const { error } = await supabase.from('taxas_frete').delete().eq('id', id);
      if (error) throw error;
      toast.success('Bairro removido com sucesso!');
      fetchFretes();
    } catch (err) {
      toast.error('Erro ao remover: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black uppercase text-white tracking-wider flex items-center gap-3">
            <Truck className="text-[#00E5FF]" /> Taxas de Frete por Bairro
          </h1>
          <p className="text-xs text-gray-400">Gerencie as áreas de entrega e valores calculados automaticamente no checkout.</p>
        </div>

        <button
          onClick={() => openModal()}
          className="bg-[#00E5FF] text-[#0A0F1D] px-5 py-3 rounded-xl font-bold uppercase text-xs tracking-wider flex items-center gap-2 hover:bg-cyan-400 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={18} /> Novo Bairro
        </button>
      </div>

      <div className="bg-[#101935] border border-white/5 rounded-3xl overflow-hidden shadow-xl max-w-2xl">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[#00E5FF]/20 border-t-[#00E5FF] rounded-full animate-spin" />
          </div>
        ) : fretes.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-xs">
            Nenhuma taxa de frete cadastrada.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {fretes.map((f) => (
              <div key={f.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[#070B16]/50 transition-colors">
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-[#00E5FF]" />
                  <span className="font-bold text-white text-sm">{f.bairro}</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-display font-black text-sm text-[#FFDE59]">
                    R$ {Number(f.valor).toFixed(2).replace('.', ',')}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openModal(f)}
                      className="bg-[#0A0F1D] hover:bg-white/5 border border-white/10 text-gray-300 p-2 rounded-xl"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="bg-[#0A0F1D] hover:bg-red-500/10 border border-white/10 text-red-400 p-2 rounded-xl"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101935] border border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-display font-black text-lg text-white">
              {editItem ? 'Editar Taxa' : 'Novo Bairro'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Nome do Bairro *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: São Conrado"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Valor da Entrega (R$) *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: 10.00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
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

export default Shipping;
