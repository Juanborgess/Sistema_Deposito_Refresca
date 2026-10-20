import React, { useState, useEffect } from 'react';
import supabase from '../../supabaseClient';
import { Users, Phone, MessageCircle, DollarSign, Calendar } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes_view')
        .select('*')
        .order('ultimo_pedido', { ascending: false });

      if (data) {
        const mapped = data.map(c => ({
          ...c,
          nome: c.cliente_nome || c.nome || 'Cliente Anônimo',
          telefone: c.cliente_telefone || c.telefone || ''
        }));
        setCustomers(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const normalizeString = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

  const filteredCustomers = customers.filter(c => {
    const term = normalizeString(search);
    const nome = normalizeString(c.nome || c.cliente_nome || '');
    const telefone = (c.telefone || c.cliente_telefone || '').replace(/\D/g, '');
    const cleanSearch = search.replace(/\D/g, '');
    
    return nome.includes(term) || (cleanSearch && telefone.includes(cleanSearch)) || (c.telefone && c.telefone.includes(search));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black uppercase text-white tracking-wider flex items-center gap-3">
            <Users className="text-[#00E5FF]" /> Base de Clientes (CRM)
          </h1>
          <p className="text-xs text-gray-400">Histórico de compradores, gastos acumulados e contato direto pelo WhatsApp.</p>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Buscar por nome ou WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#101935] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF]"
          />
        </div>
      </div>

      <div className="bg-[#101935] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[#00E5FF]/20 border-t-[#00E5FF] rounded-full animate-spin" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-xs">
            Nenhum cliente registrado ainda. Os clientes aparecem aqui automaticamente após fazerem pedidos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070B16] text-gray-400 uppercase tracking-wider border-b border-white/5">
                <tr>
                  <th className="p-4 pl-6">Cliente</th>
                  <th className="p-4">WhatsApp</th>
                  <th className="p-4 text-center">Pedidos</th>
                  <th className="p-4 text-right">Total Gasto</th>
                  <th className="p-4">Último Pedido</th>
                  <th className="p-4 text-right pr-6">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCustomers.map((c, idx) => (
                  <tr key={idx} className="hover:bg-[#070B16]/50 transition-colors">
                    <td className="p-4 pl-6 font-bold text-white">
                      {c.nome || 'Cliente Anônimo'}
                    </td>
                    <td className="p-4 text-gray-300">
                      {c.telefone}
                    </td>
                    <td className="p-4 text-center font-bold text-[#FFDE59]">
                      {c.total_pedidos}
                    </td>
                    <td className="p-4 text-right font-display font-black text-[#00E5FF]">
                      R$ {Number(c.total_gasto || 0).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="p-4 text-gray-400">
                      {c.ultimo_pedido ? new Date(c.ultimo_pedido).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-4 text-right pr-6">
                      {c.telefone && (
                        <a
                          href={`https://wa.me/55${c.telefone.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(c.nome || '')}!%20Temos%20promo%C3%A7%C3%B5es%20de%20cerveja%20gelada%20hoje%20no%20Refresca.`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 bg-[#25D366] text-black px-3 py-1.5 rounded-xl font-bold text-xs"
                        >
                          <MessageCircle size={14} /> Chamar no WhatsApp
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;
