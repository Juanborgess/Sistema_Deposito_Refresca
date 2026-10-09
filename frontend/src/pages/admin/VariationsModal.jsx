import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import supabase from '../../supabaseClient';
import toast from 'react-hot-toast';

const VariationsModal = ({ product, onClose, onRefresh }) => {
  const [variacoes, setVariacoes] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setVariacoes(product.variacoes ? JSON.parse(JSON.stringify(product.variacoes)) : []);
  }, [product]);

  const handleAddGroup = () => {
    const newGroup = {
      id: 'grupo_' + Date.now(),
      titulo: 'Novo Grupo (ex: Sabores, Gelo, Acompanhamento)',
      obrigatorio: false,
      min: 0,
      max: 1,
      opcoes: []
    };
    setVariacoes([...variacoes, newGroup]);
  };

  const handleRemoveGroup = (groupId) => {
    if (window.confirm('Excluir este grupo inteiro de opções?')) {
      setVariacoes(variacoes.filter(g => g.id !== groupId));
    }
  };

  const handleGroupChange = (groupId, field, value) => {
    setVariacoes(variacoes.map(g => {
      if (g.id === groupId) {
        const updated = { ...g, [field]: value };
        if (field === 'obrigatorio' && !value) updated.min = 0;
        if (field === 'obrigatorio' && value && updated.min === 0) updated.min = 1;
        return updated;
      }
      return g;
    }));
  };

  const handleAddOption = (groupId) => {
    setVariacoes(variacoes.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          opcoes: [...g.opcoes, {
            id: 'op_' + Date.now(),
            nome: 'Nova Opção',
            adicional: 0,
            ativo: true
          }]
        };
      }
      return g;
    }));
  };

  const handleRemoveOption = (groupId, optionId) => {
    setVariacoes(variacoes.map(g => {
      if (g.id === groupId) {
        return { ...g, opcoes: g.opcoes.filter(o => o.id !== optionId) };
      }
      return g;
    }));
  };

  const handleOptionChange = (groupId, optionId, field, value) => {
    setVariacoes(variacoes.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          opcoes: g.opcoes.map(o => {
            if (o.id === optionId) {
              return { ...o, [field]: value };
            }
            return o;
          })
        };
      }
      return g;
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('produtos')
        .update({ variacoes })
        .eq('id', product.id);

      if (error) throw error;
      
      toast.success('Variações salvas com sucesso!');
      onRefresh();
      onClose();
    } catch (err) {
      toast.error('Erro ao salvar variações: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#101935] border border-white/10 rounded-2xl p-6 md:p-8 max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl relative">
        
        {/* Cabeçalho Premium */}
        <div className="pb-5 border-b border-white/5 shrink-0 pr-10">
          <h3 className="font-display font-black text-lg md:text-xl text-white uppercase tracking-wider mb-1">Variações e Opções</h3>
          <p className="text-[11px] text-gray-400">
            Configurando opções para: <span className="text-[#00E5FF] uppercase font-bold">{product.nome}</span>
          </p>
        </div>
        
        {/* Close Button Superior Direito */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        {/* Lista de Grupos */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 custom-scrollbar -mx-2 px-2">
          {variacoes.length === 0 ? (
            <div className="text-center py-10 bg-[#0A0F1D] rounded-2xl border border-white/5">
              <p className="text-xs text-gray-400 mb-3">Este produto não possui grupos de adicionais ou variações.</p>
              <button
                type="button"
                onClick={handleAddGroup}
                className="bg-[#00E5FF]/10 text-[#00E5FF] px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-[#00E5FF]/20 transition-colors"
              >
                + Adicionar Novo Grupo
              </button>
            </div>
          ) : (
            variacoes.map((group) => (
              <div key={group.id} className="bg-[#0A0F1D] border border-white/5 rounded-2xl overflow-hidden">
                
                {/* Header do Grupo */}
                <div className="p-5 space-y-4">
                  <input
                    type="text"
                    value={group.titulo}
                    onChange={(e) => handleGroupChange(group.id, 'titulo', e.target.value)}
                    className="w-full bg-transparent border-0 px-0 py-1 text-sm font-black text-white uppercase tracking-wider focus:outline-none focus:ring-0 placeholder-gray-600"
                    placeholder="TÍTULO DO GRUPO (EX: SABORES)"
                  />
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                      <input
                        type="checkbox"
                        checked={group.obrigatorio}
                        onChange={(e) => handleGroupChange(group.id, 'obrigatorio', e.target.checked)}
                        className="rounded bg-black border-white/20 accent-white w-4 h-4 cursor-pointer"
                      />
                      <span>Obrigatório</span>
                    </label>

                    <div className="flex items-center gap-2 text-gray-400">
                      <span>Mínimo:</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={group.min}
                        onChange={(e) => handleGroupChange(group.id, 'min', parseInt(e.target.value) || 0)}
                        className="w-12 bg-[#101935] border border-white/5 rounded-md p-1.5 text-center text-white focus:outline-none focus:border-[#00E5FF]"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-gray-400">
                      <span>Máximo:</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={group.max}
                        onChange={(e) => handleGroupChange(group.id, 'max', parseInt(e.target.value) || 1)}
                        className="w-12 bg-[#101935] border border-white/5 rounded-md p-1.5 text-center text-white focus:outline-none focus:border-[#00E5FF]"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(group.id)}
                      className="text-red-500 hover:text-red-400 p-1 bg-red-500/10 rounded-lg transition-colors"
                      title="Excluir Grupo Inteiro"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Tabela de Opções */}
                <div className="bg-[#101935]/50 p-5 border-t border-white/5">
                  <div className="flex items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3 px-2">
                    <div className="w-6"></div> {/* Espaço do Handle */}
                    <div className="flex-1 min-w-0">Nome da Opção</div>
                    <div className="w-24 text-center">+ Valor (R$)</div>
                    <div className="w-20 text-center">Status</div>
                    <div className="w-8"></div>
                  </div>

                  <div className="space-y-2">
                    {group.opcoes.map((opt) => (
                      <div 
                        key={opt.id} 
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                          opt.ativo ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'
                        }`}
                      >
                        {/* Grip */}
                        <div className="w-6 flex justify-center text-gray-600">
                          <span className="cursor-grab select-none">⋮⋮</span>
                        </div>

                        {/* Nome */}
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={opt.nome}
                            onChange={(e) => handleOptionChange(group.id, opt.id, 'nome', e.target.value)}
                            className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-xs text-[#00E5FF] font-bold focus:outline-none focus:border-[#00E5FF] placeholder-gray-600"
                            placeholder="Nome (ex: Limão)"
                          />
                        </div>

                        {/* Valor Adicional */}
                        <div className="w-24 flex justify-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={opt.adicional}
                            onChange={(e) => handleOptionChange(group.id, opt.id, 'adicional', parseFloat(e.target.value) || 0)}
                            className="w-16 bg-transparent border-b border-white/10 px-1 py-1 text-xs text-white text-center focus:outline-none focus:border-[#00E5FF]"
                            placeholder="0,00"
                          />
                        </div>

                        {/* Toggle Status */}
                        <div className="w-20 flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleOptionChange(group.id, opt.id, 'ativo', !opt.ativo)}
                            className={`px-3 py-1 rounded text-[9px] font-black tracking-wider transition-colors ${
                              opt.ativo 
                                ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' 
                                : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                            }`}
                          >
                            {opt.ativo ? 'ON' : 'OFF'}
                          </button>
                        </div>

                        {/* Excluir */}
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(group.id, opt.id)}
                          className="w-8 flex justify-center text-gray-500 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleAddOption(group.id)}
                      className="text-[10px] text-gray-400 hover:text-white font-bold flex items-center gap-1 pt-2 ml-8 uppercase tracking-widest transition-colors"
                    >
                      <Plus size={12} /> Adicionar Opção
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-5 mt-auto border-t border-white/5 shrink-0">
          
          <div className="flex gap-4 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleAddGroup}
              className="text-[10px] text-gray-400 hover:text-white font-bold flex items-center gap-1 uppercase tracking-widest transition-colors"
            >
              <Plus size={12} /> Adicionar Grupo
            </button>
          </div>

          <div className="flex gap-4 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider transition-colors px-2"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="bg-[#00E5FF] text-[#0A0F1D] px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(0,229,255,0.2)] disabled:opacity-50 flex items-center gap-2 hover:bg-cyan-400 transition-colors"
            >
              <Save size={16} /> {isSaving ? 'Salvando...' : 'Salvar Opções'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VariationsModal;
