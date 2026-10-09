import React, { useState, useEffect } from 'react';
import supabase from '../../supabaseClient';
import VariationsModal from './VariationsModal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Plus, Edit2, Trash2, Sliders, Upload, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Catalog = () => {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal de Produto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  // Modal de Variações
  const [isVariationsModalOpen, setIsVariationsModalOpen] = useState(false);
  const [variationsItem, setVariationsItem] = useState(null);
  
  // Campos do formulário
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [valorPromocional, setValorPromocional] = useState('');
  const [badge, setBadge] = useState('');
  const [imagemFile, setImagemFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        supabase.from('categorias').select('*').order('ordem', { ascending: true }),
        supabase.from('produtos').select('*').order('ordem', { ascending: true }).order('created_at', { ascending: false })
      ]);

      if (catRes.data) setCategorias(catRes.data);
      if (prodRes.data) setProdutos(prodRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAtivo = async (id, currentStatus) => {
    try {
      await supabase.from('produtos').update({ ativo: !currentStatus }).eq('id', id);
      toast.success(currentStatus ? 'Produto desativado' : 'Produto ativado');
      fetchData();
    } catch (err) {
      toast.error('Erro ao alternar status: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) {
        // Se já tiver pedido vinculado, faz soft delete
        await supabase.from('produtos').update({ ativo: false }).eq('id', id);
        toast('Produto desativado (possui histórico de pedidos).', { icon: '⚠️' });
      } else {
        toast.success('Produto excluído com sucesso.');
      }
      fetchData();
    } catch (err) {
      toast.error('Erro ao excluir: ' + err.message);
    }
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_produto.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('produtos')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('produtos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoria) {
      toast.error('Selecione uma categoria.');
      return;
    }

    setIsSubmitting(true);

    try {
      let imagem_url = editItem ? editItem.imagem_url : '';

      if (imagemFile) {
        imagem_url = await uploadImage(imagemFile);
      }

      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        valor: parseFloat(String(valor).replace(',', '.')),
        valor_promocional: valorPromocional ? parseFloat(String(valorPromocional).replace(',', '.')) : null,
        categoria,
        badge: badge.trim() || null,
        imagem_url: imagem_url || '/logo_refresca.png'
      };

      if (editItem) {
        const { error } = await supabase.from('produtos').update(payload).eq('id', editItem.id);
        if (error) throw error;
        toast.success('Produto atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('produtos').insert([{ ...payload, ordem: produtos.length }]);
        if (error) throw error;
        toast.success('Produto cadastrado com sucesso!');
      }

      closeModal();
      fetchData();
    } catch (err) {
      toast.error('Erro ao salvar produto: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            setImagemFile(file);
            toast.success('Imagem colada da área de transferência!', { icon: '📸' });
          }
          break;
        }
      }
    }
  };

  const openModal = (item = null) => {
    setEditItem(item);
    setNome(item ? item.nome : '');
    setCategoria(item ? item.categoria : (categorias[0]?.nome || ''));
    setDescricao(item ? item.descricao || '' : '');
    setValor(item ? String(item.valor) : '');
    setValorPromocional(item && item.valor_promocional ? String(item.valor_promocional) : '');
    setBadge(item ? item.badge || '' : '');
    setImagemFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditItem(null);
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    
    const sourceCategory = source.droppableId;
    const destCategory = destination.droppableId;

    if (sourceCategory === destCategory && source.index === destination.index) return;

    // Find the item
    const itemToMove = produtos.find(p => String(p.id) === draggableId);
    if (!itemToMove) return;

    let newProdutos = [...produtos];
    
    // Items in destination category (unfiltered)
    const destItems = newProdutos.filter(p => p.categoria === destCategory).sort((a,b) => a.ordem - b.ordem);
    
    // Remove item from global list
    newProdutos = newProdutos.filter(p => String(p.id) !== draggableId);
    
    // Update category if changed
    const updatedItem = { ...itemToMove, categoria: destCategory };
    
    // Insert into destination at correct index
    destItems.splice(destination.index, 0, updatedItem);
    
    // Remove all items of destCategory from newProdutos, and concat the new ordered destItems
    newProdutos = newProdutos.filter(p => p.categoria !== destCategory);
    newProdutos = [...newProdutos, ...destItems];
    
    // Re-assign 'ordem' globally
    newProdutos = newProdutos.map((p, i) => ({ ...p, ordem: i }));
    
    setProdutos(newProdutos);

    const updates = newProdutos.map((item) => ({
      id: item.id,
      nome: item.nome,
      categoria: item.categoria,
      valor: item.valor,
      imagem_url: item.imagem_url,
      ordem: item.ordem
    }));

    try {
      await supabase.from('produtos').upsert(updates);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProdutos = produtos.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const isSearchActive = search.trim().length > 0;

  // Group by category (only showing categories that have items in filteredProdutos)
  const groupedProdutos = categorias.map(cat => ({
    categoria: cat.nome,
    produtos: filteredProdutos.filter(p => p.categoria === cat.nome).sort((a,b) => a.ordem - b.ordem)
  })).filter(g => g.produtos.length > 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black uppercase text-white tracking-wider flex items-center gap-3">
            Catálogo
          </h1>
          <p className="text-xs text-gray-400">Adicione, edite e organize a vitrine do depósito.</p>
        </div>

        <button
          onClick={() => openModal()}
          className="bg-[#00E5FF] text-[#0A0F1D] px-5 py-3 rounded-xl font-bold uppercase text-xs tracking-wider flex items-center gap-2 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={18} /> Novo Produto
        </button>
      </div>

      {/* Tabela de Produtos (Vaiper Layout) */}
      <div className="bg-[#101935] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        {/* Input de Busca */}
        <div className="p-4 md:p-5 border-b border-white/5 bg-[#101935]">
          <input 
            type="text"
            placeholder="Buscar por nome ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0A0F1D] border border-white/5 hover:border-white/10 rounded-xl px-5 py-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] transition-colors"
          />
        </div>

        {/* Cabeçalho da Tabela */}
        <div className="hidden md:flex items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest px-6 py-4 border-b border-white/5 bg-[#101935]">
          <div className="w-8 shrink-0"></div> {/* Grip */}
          <div className="w-16 shrink-0">Foto</div>
          <div className="flex-1 min-w-0 pr-4">Nome</div>
          <div className="w-48 shrink-0">Categoria</div>
          <div className="w-32 shrink-0">Preço (R$)</div>
          <div className="w-32 shrink-0 text-center">Estoque</div>
          <div className="w-48 shrink-0 text-right">Ações</div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[#00E5FF]/20 border-t-[#00E5FF] rounded-full animate-spin" />
          </div>
        ) : groupedProdutos.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-xs">
            Nenhum produto encontrado no catálogo.
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="divide-y divide-white/5">
              {groupedProdutos.map((group) => (
                <div key={group.categoria} className="group-category">
                  {/* Category Header Row */}
                  <div className="px-6 py-3 bg-[#101935] border-b border-white/5">
                    <h3 className="text-[#00E5FF] font-black text-[11px] uppercase tracking-widest">
                      {group.categoria}
                    </h3>
                  </div>

                  <Droppable droppableId={group.categoria} isDropDisabled={isSearchActive}>
                    {(provided) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className="divide-y divide-white/5"
                      >
                        {group.produtos.map((produto, index) => (
                          <Draggable 
                            key={produto.id} 
                            draggableId={String(produto.id)} 
                            index={index}
                            isDragDisabled={isSearchActive}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`px-4 md:px-6 py-4 flex flex-col md:flex-row items-stretch md:items-center gap-3 transition-colors ${
                                  snapshot.isDragging ? 'bg-[#152244] shadow-2xl z-50 ring-1 ring-[#00E5FF]/50' : 'hover:bg-white/5'
                                }`}
                              >
                                {/* Bloco Superior (Mobile) / Esquerda (Desktop) */}
                                <div className="flex items-center gap-3 w-full md:w-auto md:flex-1">
                                  {/* Handle (Grip) */}
                                  <div 
                                    {...provided.dragHandleProps} 
                                    className={`p-2 -ml-2 text-gray-500 hover:text-white cursor-grab touch-none ${isSearchActive ? 'opacity-20 cursor-not-allowed' : ''}`}
                                  >
                                    <GripVertical size={22} />
                                  </div>

                                  {/* Foto */}
                                  <div className="w-12 h-12 rounded-xl bg-[#070B16] flex items-center justify-center p-1 shrink-0 border border-white/5">
                                    <img src={produto.imagem_url || '/logo_refresca.png'} alt={produto.nome} className="w-full h-full object-contain" />
                                  </div>

                                  {/* Nome & Preço Mobile */}
                                  <div className="flex-1 min-w-0 pr-2">
                                    <h4 className="text-sm font-bold text-white uppercase truncate">{produto.nome}</h4>
                                    
                                    {/* Preço visível só no Mobile */}
                                    <div className="flex items-center gap-2 mt-1 md:hidden">
                                      {produto.valor_promocional ? (
                                        <>
                                          <span className="text-sm font-black text-[#00E5FF]">
                                            R$ {Number(produto.valor_promocional).toFixed(2).replace('.', ',')}
                                          </span>
                                          <span className="text-[10px] text-green-500/80 font-bold line-through">
                                            R$ {Number(produto.valor).toFixed(2).replace('.', ',')}
                                          </span>
                                        </>
                                      ) : (
                                        <span className="text-sm font-black text-[#00E5FF]">
                                          R$ {Number(produto.valor).toFixed(2).replace('.', ',')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Bloco Inferior (Mobile) / Direita (Desktop) */}
                                <div className="flex flex-wrap md:flex-nowrap items-center justify-between md:justify-end w-full md:w-auto gap-4 pl-[3.25rem] md:pl-0 mt-2 md:mt-0">
                                  
                                  {/* Categoria Repetida */}
                                  <div className="hidden md:block w-40 shrink-0">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{produto.categoria}</span>
                                  </div>

                                  {/* Preço (Desktop Only) */}
                                  <div className="hidden md:flex w-32 shrink-0 flex-col justify-center">
                                    {produto.valor_promocional ? (
                                      <>
                                        <span className="text-sm font-black text-[#00E5FF]">
                                          R$ {Number(produto.valor_promocional).toFixed(2).replace('.', ',')}
                                        </span>
                                        <span className="text-[10px] text-green-500/80 font-bold">
                                          Promo: R$ {Number(produto.valor).toFixed(2).replace('.', ',')}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-sm font-black text-[#00E5FF]">
                                        R$ {Number(produto.valor).toFixed(2).replace('.', ',')}
                                      </span>
                                    )}
                                  </div>

                                  {/* Estoque Badge */}
                                  <div className="w-auto md:w-32 shrink-0">
                                    <button
                                      onClick={() => handleToggleAtivo(produto.id, produto.ativo)}
                                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors ${
                                        produto.ativo 
                                          ? 'bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20' 
                                          : 'bg-gray-500/10 text-gray-500 border border-gray-500/20 hover:bg-gray-500/20'
                                      }`}
                                    >
                                      {produto.ativo ? 'Em Estoque' : 'Esgotado'}
                                    </button>
                                  </div>

                                  {/* Ações Textuais */}
                                  <div className="flex items-center justify-end gap-4 md:w-48 shrink-0 flex-1 md:flex-none">
                                    <button
                                      onClick={() => {
                                        setVariationsItem(produto);
                                        setIsVariationsModalOpen(true);
                                      }}
                                      className="text-[10px] font-black uppercase tracking-widest text-[#B388FF] hover:text-purple-400 transition-colors"
                                    >
                                      Opções
                                    </button>
                                    <button
                                      onClick={() => openModal(produto)}
                                      className="text-[10px] font-black uppercase tracking-widest text-[#00E5FF] hover:text-cyan-400 transition-colors"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => handleDelete(produto.id)}
                                      className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors"
                                    >
                                      Excluir
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        )}
      </div>

      {/* MODAL CRIAR/EDITAR PRODUTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onPaste={handlePaste}>
          <div className="bg-[#101935] border border-white/10 rounded-3xl p-6 md:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar space-y-5">
            <h3 className="font-display font-black text-xl text-white flex items-center justify-between">
              <span>{editItem ? 'Editar Produto' : 'Novo Produto'}</span>
              <span className="text-[10px] font-normal text-gray-400 bg-white/5 px-3 py-1 rounded-full flex items-center gap-2">
                <ImageIcon size={12} className="text-[#00E5FF]"/> Dica: Cole a imagem com CTRL+V
              </span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Nome do Produto *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Cerveja Heineken 350ml Lata"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Categoria *</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                  >
                    {categorias.map((c) => (
                      <option key={c.id || c.nome} value={c.nome}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Badge (opcional)</label>
                  <input 
                    type="text"
                    placeholder="Ex: Trincando, Mais Vendido"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Preço Normal (R$) *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: 6.50"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Preço Promo (R$)</label>
                  <input 
                    type="text"
                    placeholder="Ex: 5.99 (deixe vazio se não tiver)"
                    value={valorPromocional}
                    onChange={(e) => setValorPromocional(e.target.value)}
                    className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Descrição</label>
                <textarea 
                  rows={3}
                  placeholder="Informações adicionais, detalhes do produto..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Foto do Produto</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImagemFile(e.target.files[0])}
                  className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-2.5 text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#00E5FF] file:text-[#0A0F1D]"
                />
                {imagemFile && (
                  <p className="text-[#00E5FF] text-[10px] mt-2 font-bold flex items-center gap-1">
                    <CheckCircle size={12} /> Imagem carregada e pronta para envio!
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-transparent border border-white/10 text-gray-400 py-3 rounded-xl text-xs font-bold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#00E5FF] text-[#0A0F1D] py-3 rounded-xl text-xs font-bold uppercase shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VARIAÇÕES */}
      {isVariationsModalOpen && variationsItem && (
        <VariationsModal 
          product={variationsItem} 
          onClose={() => {
            setIsVariationsModalOpen(false);
            setVariationsItem(null);
          }}
          onRefresh={fetchData}
        />
      )}

    </div>
  );
};

export default Catalog;
