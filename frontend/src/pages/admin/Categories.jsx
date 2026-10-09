import React, { useState, useEffect } from 'react';
import supabase from '../../supabaseClient';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Edit2, Trash2, Plus, Tags } from 'lucide-react';
import toast from 'react-hot-toast';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [nome, setNome] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('ordem', { ascending: true });
        
      if (data) setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setCategories(items);
    
    const updates = items.map((item, index) => ({
      id: item.id,
      nome: item.nome,
      ordem: index
    }));
    
    try {
      await supabase.from('categorias').upsert(updates);
      toast.success('Ordem das categorias atualizada!');
    } catch (err) {
      toast.error('Erro ao salvar ordem.');
      fetchCategories();
    }
  };

  const openModal = (item = null) => {
    setEditItem(item);
    setNome(item ? item.nome : '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditItem(null);
    setNome('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const nomeFormatado = nome.trim();
      
      if (editItem) {
        const { error } = await supabase.from('categorias').update({ nome: nomeFormatado }).eq('id', editItem.id);
        if (error) throw error;
        toast.success('Categoria atualizada!');
      } else {
        const { error } = await supabase.from('categorias').insert([{ 
          nome: nomeFormatado, 
          ordem: categories.length 
        }]);
        if (error) throw error;
        toast.success('Categoria criada com sucesso!');
      }
      
      closeModal();
      fetchCategories();
    } catch (err) {
      toast.error('Erro ao salvar categoria: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [conflictingProducts, setConflictingProducts] = useState(null);

  const handleDelete = async (id) => {
    try {
      const catToDelete = categories.find(c => c.id === id);
      if (!catToDelete) return;

      // O DB usa categoria_id na foreign key, então checamos os dois para garantir.
      const { data: produtosVinculados, error: checkError } = await supabase
        .from('produtos')
        .select('nome, categoria, categoria_id');

      if (checkError) throw checkError;

      const produtosDestaCategoria = produtosVinculados.filter(p => p.categoria_id === id || p.categoria === catToDelete.nome);

      if (produtosDestaCategoria && produtosDestaCategoria.length > 0) {
        setConflictingProducts({ categoryName: catToDelete.nome, products: produtosDestaCategoria });
        return;
      }

      if (!window.confirm('Nenhum produto encontrado. Tem certeza que deseja excluir esta categoria permanentemente?')) return;

      const { error } = await supabase.from('categorias').delete().eq('id', id);
      if (error) throw error;
      toast.success('Categoria excluída!');
      fetchCategories();
    } catch (err) {
      toast.error('Não foi possível excluir a categoria: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black uppercase text-white tracking-wider flex items-center gap-3">
            <Tags className="text-[#00E5FF]" /> Categorias de Bebidas
          </h1>
          <p className="text-xs text-gray-400">Arraste para reordenar a vitrine pública.</p>
        </div>

        <button
          onClick={() => openModal()}
          className="bg-[#00E5FF] text-[#0A0F1D] px-5 py-3 rounded-xl font-bold uppercase text-xs tracking-wider flex items-center gap-2 hover:bg-cyan-400 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={18} /> Nova Categoria
        </button>
      </div>

      <div className="bg-[#101935] border border-white/5 rounded-3xl overflow-hidden shadow-xl max-w-2xl">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[#00E5FF]/20 border-t-[#00E5FF] rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-xs">
            Nenhuma categoria encontrada.
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categorias-droppable">
              {(provided) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className="divide-y divide-white/5"
                >
                  {categories.map((cat, index) => (
                    <Draggable key={cat.id} draggableId={cat.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                            snapshot.isDragging ? 'bg-[#152244]' : 'hover:bg-[#070B16]/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div {...provided.dragHandleProps} className="text-gray-600 hover:text-white cursor-grab">
                              <GripVertical size={18} />
                            </div>
                            <span className="font-bold text-white text-sm">{cat.nome}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openModal(cat)}
                              className="bg-[#0A0F1D] hover:bg-white/5 border border-white/10 text-gray-300 p-2 rounded-xl"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(cat.id)}
                              className="bg-[#0A0F1D] hover:bg-red-500/10 border border-white/10 text-red-400 p-2 rounded-xl"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101935] border border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-display font-black text-lg text-white">
              {editItem ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Nome *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Cervejas Long Neck"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
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

      {/* MODAL DE PRODUTOS VINCULADOS */}
      {conflictingProducts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101935] border border-red-500/30 rounded-3xl p-6 md:p-8 max-w-lg w-full max-h-[85vh] flex flex-col shadow-[0_10px_40px_rgba(239,68,68,0.2)]">
            <h3 className="font-display font-black text-xl text-red-500 flex items-center gap-2">
              <Trash2 size={24} /> Bloqueio de Segurança
            </h3>
            
            <p className="text-gray-300 text-sm mt-3">
              A categoria <strong>{conflictingProducts.categoryName}</strong> não pode ser excluída porque possui <strong className="text-white">{conflictingProducts.products.length}</strong> produto(s) no sistema:
            </p>

            <div className="mt-4 flex-1 overflow-y-auto custom-scrollbar border border-white/5 rounded-xl bg-[#0A0F1D] p-3">
              <ul className="space-y-2">
                {conflictingProducts.products.map((p, i) => (
                  <li key={i} className="text-xs text-gray-400 flex items-center gap-2 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <span className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full shrink-0"></span>
                    {p.nome}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-[11px] text-gray-400 mb-4 text-center">
                Vá até o <strong>Catálogo</strong> e altere a categoria desses produtos (ou apague eles) antes de excluir.
              </p>
              <button
                onClick={() => setConflictingProducts(null)}
                className="w-full bg-[#0A0F1D] border border-white/20 hover:bg-white/5 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Entendi, Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Categories;
