import React, { useState, useEffect } from 'react';
import supabase from '../../supabaseClient';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Plus, Edit2, Trash2, Sliders, Upload, Image as ImageIcon, CheckCircle, XCircle, X, Tags, PackagePlus, FolderPlus, Search, ChevronDown, ChevronRight, FolderOutput } from 'lucide-react';
import toast from 'react-hot-toast';

const Catalog = () => {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal de Produto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  // Modal de Categoria
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editCategoryItem, setEditCategoryItem] = useState(null);
  const [categoryNome, setCategoryNome] = useState('');
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  
  // UX Improvements
  const [collapsedCats, setCollapsedCats] = useState({});
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveProduct, setMoveProduct] = useState(null);
  const [moveTargetCategory, setMoveTargetCategory] = useState('');

  const toggleCategory = (catName) => {
    setCollapsedCats(prev => ({...prev, [catName]: !prev[catName]}));
  };

  const handleMoveSubmit = async (e) => {
    e.preventDefault();
    if (!moveProduct || !moveTargetCategory) return;
    try {
      const destCatObj = categorias.find(c => c.nome === moveTargetCategory);
      if (!destCatObj) return;

      const { error } = await supabase.from('produtos').update({
        categoria: moveTargetCategory,
        categoria_id: destCatObj.id
      }).eq('id', moveProduct.id);
      
      if (error) throw error;
      
      setProdutos(produtos.map(p => 
        p.id === moveProduct.id ? { ...p, categoria: moveTargetCategory, categoria_id: destCatObj.id } : p
      ));
      
      toast.success('Produto movido com sucesso!');
      setIsMoveModalOpen(false);
    } catch (err) {
      toast.error('Erro ao mover: ' + err.message);
    }
  };
  // Campos do formulário de Produto
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [valorPromocional, setValorPromocional] = useState('');
  const [badge, setBadge] = useState('');
  const [imagemFile, setImagemFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [variacoes, setVariacoes] = useState([]);
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
      const { error } = await supabase.from('produtos').update({ ativo: !currentStatus }).eq('id', id);
      if (error) throw error;
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

  const compressImage = async (file) => {
    if (file.type === 'image/svg+xml' || file.size < 60 * 1024) return file;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                const compressedFile = new File([blob], `${Date.now()}_produto.webp`, {
                  type: 'image/webp',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/webp',
            0.85
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const uploadImage = async (file) => {
    // Comprime e converte para WebP leve antes de subir para o Supabase
    const optimizedFile = await compressImage(file);
    const fileExt = optimizedFile.name.split('.').pop();
    const fileName = `${Date.now()}_produto.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('produtos')
      .upload(fileName, optimizedFile, {
        contentType: optimizedFile.type || 'image/webp',
        cacheControl: '31536000',
        upsert: false
      });

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
      } else if (!previewUrl) {
        imagem_url = '/logo_refresca.png';
      }

      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        valor: parseFloat(String(valor).replace(',', '.')),
        valor_promocional: valorPromocional ? parseFloat(String(valorPromocional).replace(',', '.')) : null,
        categoria,
        categoria_id: categorias.find(c => c.nome === categoria)?.id,
        badge: badge.trim() || null,
        imagem_url: imagem_url || '/logo_refresca.png',
        variacoes: variacoes
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

  // Funções de Variações
  const handleAddGroup = () => {
    const newGroup = {
      id: 'grupo_' + Date.now(),
      titulo: 'Novo Grupo (ex: Sabores)',
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
          opcoes: [...g.opcoes, { id: 'op_' + Date.now(), nome: 'Nova Opção', adicional: 0, ativo: true }]
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

  const handleImageSelect = (file) => {
    if (!file) return;
    setImagemFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveImage = () => {
    setImagemFile(null);
    setPreviewUrl('');
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageSelect(file);
            toast.success('Imagem colada da área de transferência!', { icon: '📸' });
          }
          break;
        }
      }
    }
  };

  const openModal = (item = null, forceCategoria = null) => {
    setEditItem(item);
    setNome(item ? item.nome : '');
    setCategoria(item ? item.categoria : (forceCategoria || categorias[0]?.nome || ''));
    setDescricao(item ? item.descricao || '' : '');
    setValor(item ? String(item.valor) : '');
    setValorPromocional(item && item.valor_promocional ? String(item.valor_promocional) : '');
    setBadge(item ? item.badge || '' : '');
    setImagemFile(null);
    setPreviewUrl(item && item.imagem_url ? item.imagem_url : '');
    setVariacoes(item && item.variacoes ? JSON.parse(JSON.stringify(item.variacoes)) : []);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditItem(null);
    setPreviewUrl('');
    setImagemFile(null);
  };

  // Funções de Categoria
  const openCategoryModal = (item = null) => {
    setEditCategoryItem(item);
    setCategoryNome(item ? item.nome : '');
    setIsCategoryModalOpen(true);
  };
  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditCategoryItem(null);
    setCategoryNome('');
  };
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setIsCategorySubmitting(true);
    try {
      const nomeFormatado = categoryNome.trim();
      if (editCategoryItem) {
        const { error } = await supabase.from('categorias').update({ nome: nomeFormatado }).eq('id', editCategoryItem.id);
        if (error) throw error;
        await supabase.from('produtos').update({ categoria: nomeFormatado }).eq('categoria', editCategoryItem.nome);
        toast.success('Categoria atualizada!');
      } else {
        const { error } = await supabase.from('categorias').insert([{ nome: nomeFormatado, ordem: categorias.length }]);
        if (error) throw error;
        toast.success('Categoria criada!');
      }
      closeCategoryModal();
      fetchData();
    } catch (err) {
      toast.error('Erro ao salvar categoria: ' + err.message);
    } finally {
      setIsCategorySubmitting(false);
    }
  };
  const handleCategoryDelete = async (id, nome) => {
    const produtosDestaCategoria = produtos.filter(p => p.categoria === nome);
    if (produtosDestaCategoria.length > 0) {
      toast.error('Existem produtos nesta categoria! Mova-os primeiro.');
      return;
    }
    if (!window.confirm('Tem certeza que deseja excluir esta categoria permanentemente?')) return;
    try {
      const { data, error } = await supabase.from('categorias').delete().eq('id', id).select();
      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.error('O Banco de Dados bloqueou a ação (Verifique o RLS). Nenhuma linha foi deletada.', { duration: 6000 });
        return;
      }

      toast.success('Categoria excluída!');
      fetchData();
    } catch (err) {
      toast.error('Erro: ' + err.message);
    }
  };

  // Drag and Drop (Nested)
  const handleDragEnd = async (result) => {
    const { source, destination, type, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'categoria') {
      const items = Array.from(categorias);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      
      setCategorias(items);
      const updates = items.map((item, index) => ({
        id: item.id,
        nome: item.nome,
        ordem: index
      }));
      
      try {
        const { error } = await supabase.from('categorias').upsert(updates);
        if (error) throw error;
      } catch (err) {
        console.error('Erro no drag de categorias:', err);
        toast.error('Erro ao reordenar: ' + err.message);
      }
      return;
    }

    if (type === 'produto') {
      const sourceCategory = source.droppableId;
      const destCategory = destination.droppableId;
      const itemToMove = produtos.find(p => String(p.id) === draggableId);
      if (!itemToMove) return;

      let newProdutos = [...produtos];
      newProdutos = newProdutos.filter(p => String(p.id) !== draggableId);
      
      const destItems = newProdutos.filter(p => p.categoria === destCategory).sort((a,b) => a.ordem - b.ordem);
      const updatedItem = { ...itemToMove, categoria: destCategory };
      destItems.splice(destination.index, 0, updatedItem);
      
      newProdutos = newProdutos.filter(p => p.categoria !== destCategory);
      newProdutos = [...newProdutos, ...destItems];
      newProdutos = newProdutos.map((p, i) => ({ ...p, ordem: i }));
      
      setProdutos(newProdutos);
      const updates = newProdutos.map((item) => ({
        id: item.id,
        nome: item.nome,
        categoria: item.categoria,
        categoria_id: categorias.find(c => c.nome === item.categoria)?.id || item.categoria_id,
        valor: item.valor,
        imagem_url: item.imagem_url,
        ordem: item.ordem
      }));
      try {
        const { error } = await supabase.from('produtos').upsert(updates);
        if (error) throw error;
      } catch (err) {
        console.error('Erro no drag de produtos:', err);
        toast.error('Erro ao mover/reordenar: ' + err.message);
      }
    }
  };

  const normalizeString = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

  const filteredProdutos = produtos.filter((p) => {
    const term = normalizeString(search);
    return normalizeString(p.nome).includes(term) || normalizeString(p.categoria).includes(term);
  });
  const isSearchActive = search.trim().length > 0;

  // Group by category (showing ALL categories if not searching)
  const groupedProdutos = categorias.map(cat => ({
    id: cat.id,
    categoria: cat.nome,
    rawCategory: cat,
    produtos: (isSearchActive ? filteredProdutos : produtos)
      .filter(p => p.categoria === cat.nome)
      .sort((a,b) => a.ordem - b.ordem)
  })).filter(g => !isSearchActive || g.produtos.length > 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black uppercase text-white tracking-wider flex items-center gap-3">
            Cardápio
          </h1>
          <p className="text-xs text-gray-400">Gerencie suas categorias e produtos na vitrine.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openCategoryModal()}
            className="bg-transparent border border-[#00E5FF] text-[#00E5FF] px-4 py-3 rounded-xl font-bold uppercase text-[10px] sm:text-xs tracking-wider flex items-center gap-2 hover:bg-[#00E5FF]/10 transition-colors"
          >
            <FolderPlus size={16} /> Nova Categoria
          </button>
          <button
            onClick={() => openModal()}
            className="bg-[#00E5FF] text-[#0A0F1D] px-4 py-3 rounded-xl font-bold uppercase text-[10px] sm:text-xs tracking-wider flex items-center gap-2 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
          >
            <PackagePlus size={16} /> Novo Produto
          </button>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-[#101935] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 md:p-5 border-b border-white/5 bg-[#101935] relative">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text"
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0A0F1D] border border-white/5 hover:border-white/10 rounded-xl pl-12 pr-5 py-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] transition-colors"
          />
        </div>

        {/* Cabeçalho da Tabela */}
        <div className="hidden md:flex items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest px-6 py-4 border-b border-white/5 bg-[#101935]">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 shrink-0"></div>
            <div className="w-12 shrink-0">Foto</div>
            <div className="flex-1 min-w-0 pr-2">Nome</div>
          </div>
          <div className="flex items-center justify-end gap-4">
            <div className="w-32 shrink-0 text-center">Preço (R$)</div>
            <div className="w-32 shrink-0 text-center">Estoque</div>
            <div className="w-32 shrink-0 text-right">Ações</div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[#00E5FF]/20 border-t-[#00E5FF] rounded-full animate-spin" />
          </div>
        ) : groupedProdutos.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-xs">
            {isSearchActive ? 'Nenhum produto encontrado na busca.' : 'Seu cardápio está vazio.'}
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="board-categorias" type="categoria" direction="vertical" isDropDisabled={isSearchActive}>
              {(providedBoard) => (
                <div 
                  {...providedBoard.droppableProps} 
                  ref={providedBoard.innerRef}
                  className="divide-y divide-white/5"
                >
                  {groupedProdutos.map((group, index) => (
                    <Draggable 
                      key={'cat-'+group.id} 
                      draggableId={'cat-'+String(group.id)} 
                      index={index}
                      isDragDisabled={isSearchActive}
                    >
                      {(providedCat, snapshotCat) => (
                        <div
                          ref={providedCat.innerRef}
                          {...providedCat.draggableProps}
                          className={`group-category ${snapshotCat.isDragging ? 'bg-[#152244] shadow-2xl z-50 ring-1 ring-[#00E5FF]/50' : ''}`}
                        >
                          {/* Category Header Row */}
                          <div 
                            className="px-4 py-3 bg-[#101935] border-b border-white/5 flex flex-wrap sm:flex-nowrap items-center justify-between group/header hover:bg-white/5 transition-colors cursor-pointer select-none"
                            onClick={() => toggleCategory(group.categoria)}
                          >
                            <div className="flex items-center gap-2">
                              <div {...providedCat.dragHandleProps} onClick={(e) => e.stopPropagation()} className={`p-1 text-gray-500 hover:text-[#00E5FF] cursor-grab touch-none ${isSearchActive ? 'opacity-20 cursor-not-allowed' : ''}`}>
                                <GripVertical size={18} />
                              </div>
                              <h3 className="text-[#00E5FF] font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                {collapsedCats[group.categoria] && !isSearchActive ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                {group.categoria}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); openCategoryModal(group.rawCategory); }} 
                                  className="sm:opacity-0 sm:group-hover/header:opacity-100 text-gray-400 hover:text-white transition-opacity p-1 ml-2"
                                  title="Editar Categoria"
                                >
                                  <Edit2 size={12} />
                                </button>
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:opacity-0 sm:group-hover/header:opacity-100 transition-opacity ml-8 sm:ml-0">
                              <button 
                                onClick={(e) => { e.stopPropagation(); openModal(null, group.categoria); }} 
                                className="text-[9px] text-[#0A0F1D] bg-[#00E5FF] px-2 py-1 rounded font-bold uppercase tracking-widest flex items-center gap-1 hover:bg-cyan-400 shadow-md"
                              >
                                <Plus size={10} /> Add Produto Aqui
                              </button>
                              {group.produtos.length === 0 && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleCategoryDelete(group.id, group.categoria); }} 
                                  className="text-gray-500 hover:text-red-500 p-1.5 bg-white/5 rounded hover:bg-red-500/10 transition-colors ml-2"
                                  title="Excluir Categoria"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>

                          <Droppable droppableId={group.categoria} type="produto" isDropDisabled={isSearchActive}>
                            {(providedProd) => (
                              <div 
                                {...providedProd.droppableProps} 
                                ref={providedProd.innerRef}
                                className={`divide-y divide-white/5 ${collapsedCats[group.categoria] && !isSearchActive ? 'hidden' : 'min-h-[10px]'}`}
                              >
                                {group.produtos.length === 0 && !isSearchActive && (
                                  <div className="py-8 text-center text-gray-500 text-[10px] uppercase font-bold tracking-widest border border-dashed border-white/10 m-4 rounded-xl flex flex-col items-center justify-center gap-2 bg-[#0A0F1D]/50">
                                    <p>Nenhum produto em {group.categoria}</p>
                                  </div>
                                )}
                                {group.produtos.map((produto, prodIndex) => (
                                  <Draggable 
                                    key={produto.id} 
                                    draggableId={String(produto.id)} 
                                    index={prodIndex}
                                    isDragDisabled={isSearchActive}
                                  >
                                    {(providedItem, snapshotItem) => (
                                      <div
                                        ref={providedItem.innerRef}
                                        {...providedItem.draggableProps}
                                        className={`px-4 md:px-6 py-4 flex flex-col md:flex-row items-stretch md:items-center gap-3 transition-colors ${
                                          snapshotItem.isDragging ? 'bg-[#152244] shadow-2xl z-50 ring-1 ring-[#00E5FF]/50' : 'hover:bg-white/5'
                                        }`}
                                      >
                                        <div className="flex items-center gap-3 w-full md:w-auto md:flex-1 min-w-0">
                                          <div 
                                            {...providedItem.dragHandleProps} 
                                            className={`p-2 -ml-2 text-gray-500 hover:text-white cursor-grab touch-none ${isSearchActive ? 'opacity-20 cursor-not-allowed' : ''}`}
                                          >
                                            <GripVertical size={20} />
                                          </div>

                                          <div className="w-12 h-12 rounded-xl bg-[#070B16] flex items-center justify-center p-1 shrink-0 border border-white/5">
                                            <img src={produto.imagem_url || '/logo_refresca.png'} alt={produto.nome} className="w-full h-full object-contain" />
                                          </div>

                                          <div className="flex-1 min-w-0 pr-2">
                                            <h4 className="text-sm font-bold text-white uppercase truncate">{produto.nome}</h4>
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

                                        <div className="flex flex-wrap md:flex-nowrap items-center justify-between md:justify-end w-full md:w-auto gap-4 pl-[3.25rem] md:pl-0 mt-2 md:mt-0">
                                          
                                          <div className="hidden md:flex w-32 shrink-0 flex-col justify-center items-center">
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

                                          <div className="w-auto md:w-32 shrink-0 flex justify-center">
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

                                          <div className="flex items-center justify-end gap-3 w-32 shrink-0">
                                            <button
                                              onClick={() => {
                                                setMoveProduct(produto);
                                                setMoveTargetCategory(produto.categoria);
                                                setIsMoveModalOpen(true);
                                              }}
                                              className="bg-white/5 hover:bg-white/10 p-2 rounded-lg text-yellow-500 transition-colors"
                                              title="Mover de Categoria"
                                            >
                                              <FolderOutput size={16} />
                                            </button>
                                            <button
                                              onClick={() => openModal(produto)}
                                              className="bg-white/5 hover:bg-white/10 p-2 rounded-lg text-[#00E5FF] transition-colors"
                                              title="Editar Produto"
                                            >
                                              <Edit2 size={16} />
                                            </button>
                                            <button
                                              onClick={() => handleDelete(produto.id)}
                                              className="bg-red-500/5 hover:bg-red-500/10 p-2 rounded-lg text-red-500 transition-colors"
                                              title="Excluir Produto"
                                            >
                                              <Trash2 size={16} />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {providedProd.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {providedBoard.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* MODAL DE CATEGORIA */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101935] border border-white/10 rounded-3xl p-6 md:p-8 max-w-sm w-full space-y-5 shadow-2xl">
            <h3 className="font-display font-black text-xl text-white flex items-center gap-2">
              <Tags className="text-[#00E5FF]" /> {editCategoryItem ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Nome da Categoria *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Cervejas Long Neck"
                  value={categoryNome}
                  onChange={(e) => setCategoryNome(e.target.value)}
                  className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  className="flex-1 bg-transparent border border-white/10 text-gray-400 py-3 rounded-xl text-xs font-bold uppercase hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCategorySubmitting}
                  className="flex-1 bg-[#00E5FF] text-[#0A0F1D] py-3 rounded-xl text-xs font-bold uppercase shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {isCategorySubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRIAR/EDITAR PRODUTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onPaste={handlePaste}>
          <div className="bg-[#101935] border border-white/10 rounded-3xl p-6 md:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar space-y-5 shadow-2xl">
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
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Foto do Produto</label>
                
                {previewUrl ? (
                  <div className="flex items-center gap-4 bg-[#0A0F1D] border border-white/10 rounded-2xl p-3">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group">
                      <img 
                        src={previewUrl} 
                        alt="Pré-visualização do produto" 
                        className="w-full h-full object-contain p-1"
                        onError={(e) => { e.target.src = '/logo_refresca.png'; }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        title="Remover imagem"
                        className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors shadow-md"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {imagemFile ? (
                          <span className="text-[11px] font-bold text-[#00E5FF] bg-[#00E5FF]/10 px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#00E5FF]/20">
                            <CheckCircle size={12} /> Nova foto selecionada
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-gray-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                            Foto cadastrada
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-400 leading-tight">
                        Para trocar, escolha outro arquivo ou pressione <strong>CTRL+V</strong>.
                      </p>

                      <input 
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageSelect(e.target.files[0]);
                          }
                        }}
                        className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-[#00E5FF]/15 file:text-[#00E5FF] hover:file:bg-[#00E5FF]/25 file:transition-colors file:cursor-pointer"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageSelect(e.target.files[0]);
                        }
                      }}
                      className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-2.5 text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#00E5FF] file:text-[#0A0F1D] file:cursor-pointer"
                    />
                    <div className="bg-[#0A0F1D]/60 border border-dashed border-white/10 rounded-xl p-3 text-center">
                      <p className="text-[11px] text-gray-500">
                        Nenhuma foto adicionada. Escolha um arquivo acima ou simplesmente <strong>cole com CTRL+V</strong> aqui na janela.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-black text-[#00E5FF] uppercase tracking-wider block">Opções / Variações</label>
                  <button
                    type="button"
                    onClick={handleAddGroup}
                    className="text-[10px] text-gray-400 hover:text-white font-bold flex items-center gap-1 uppercase tracking-widest transition-colors bg-white/5 px-3 py-1.5 rounded-lg"
                  >
                    <Plus size={12} /> Adicionar Grupo
                  </button>
                </div>
                
                <div className="space-y-4">
                  {variacoes.length === 0 ? (
                    <p className="text-xs text-gray-500 bg-white/5 p-4 rounded-xl text-center border border-dashed border-white/10">Nenhuma variação adicionada. Ex: Temperatura, Sabores, Tamanhos...</p>
                  ) : (
                    variacoes.map((group) => (
                      <div key={group.id} className="bg-[#1a2342] border border-white/10 rounded-xl overflow-hidden">
                        
                        <div className="p-4 space-y-3">
                          <input
                            type="text"
                            value={group.titulo}
                            onChange={(e) => handleGroupChange(group.id, 'titulo', e.target.value)}
                            className="w-full bg-transparent border-b border-white/10 pb-1 text-sm font-black text-white uppercase tracking-wider focus:outline-none focus:border-[#00E5FF] placeholder-gray-600"
                            placeholder="TÍTULO DO GRUPO (EX: SABORES)"
                          />
                          
                          <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase font-bold text-gray-400">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={group.obrigatorio}
                                onChange={(e) => handleGroupChange(group.id, 'obrigatorio', e.target.checked)}
                                className="rounded bg-black border-white/20 accent-[#00E5FF] w-3 h-3 cursor-pointer"
                              />
                              <span>Obrigatório</span>
                            </label>

                            <div className="flex items-center gap-2">
                              <span>Min:</span>
                              <input
                                type="number"
                                min="0"
                                max="20"
                                value={group.min}
                                onChange={(e) => handleGroupChange(group.id, 'min', parseInt(e.target.value) || 0)}
                                className="w-10 bg-[#0A0F1D] border border-white/10 rounded p-1 text-center text-white focus:outline-none focus:border-[#00E5FF]"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <span>Max:</span>
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={group.max}
                                onChange={(e) => handleGroupChange(group.id, 'max', parseInt(e.target.value) || 1)}
                                className="w-10 bg-[#0A0F1D] border border-white/10 rounded p-1 text-center text-white focus:outline-none focus:border-[#00E5FF]"
                              />
                            </div>
                            
                            <div className="ml-auto">
                              <button
                                type="button"
                                onClick={() => handleRemoveGroup(group.id)}
                                className="text-red-500 hover:text-red-400 p-1.5 bg-red-500/10 rounded-lg transition-colors"
                                title="Remover Grupo"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#0A0F1D]/50 p-4 border-t border-white/10">
                          <div className="space-y-2">
                            {group.opcoes.map((opt) => (
                              <div 
                                key={opt.id} 
                                className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                                  opt.ativo ? 'border-[#00E5FF]/20 bg-[#00E5FF]/5' : 'border-gray-500/20 bg-gray-500/5'
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <input
                                    type="text"
                                    value={opt.nome}
                                    onChange={(e) => handleOptionChange(group.id, opt.id, 'nome', e.target.value)}
                                    className="w-full bg-transparent border-0 px-1 py-0.5 text-xs text-white focus:outline-none placeholder-gray-600"
                                    placeholder="Opção (ex: Limão)"
                                  />
                                </div>
                                <div className="w-24">
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={opt.adicional}
                                    onChange={(e) => handleOptionChange(group.id, opt.id, 'adicional', parseFloat(e.target.value) || 0)}
                                    className="w-full bg-[#0A0F1D] border border-white/10 rounded px-1 py-1.5 text-xs text-white text-center focus:outline-none focus:border-[#00E5FF]"
                                    placeholder="+ R$ 0,00"
                                  />
                                </div>
                                <div className="w-10 flex justify-center">
                                  <input 
                                    type="checkbox"
                                    checked={opt.ativo}
                                    onChange={(e) => handleOptionChange(group.id, opt.id, 'ativo', e.target.checked)}
                                    title="Ativo/Inativo"
                                    className="rounded bg-black border-white/20 accent-[#00E5FF] w-4 h-4 cursor-pointer"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(group.id, opt.id)}
                                  className="w-8 flex justify-center text-gray-500 hover:text-red-500 p-1"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleAddOption(group.id)}
                              className="text-[10px] text-[#00E5FF] hover:text-white font-bold flex items-center gap-1 pt-2 ml-1 uppercase tracking-widest transition-colors"
                            >
                              <Plus size={12} /> Add Linha
                            </button>
                          </div>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-6 mt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-transparent border border-white/10 text-gray-400 py-3 rounded-xl text-xs font-bold uppercase hover:bg-white/5"
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

      {/* MODAL MOVER PRODUTO */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101935] border border-white/10 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl">
            <h3 className="font-display font-black text-lg text-white flex items-center gap-2">
              <FolderOutput className="text-[#00E5FF]" /> Mover Produto
            </h3>
            
            <p className="text-sm text-gray-400">
              Para onde deseja mover <span className="font-bold text-white uppercase">{moveProduct?.nome}</span>?
            </p>

            <form onSubmit={handleMoveSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Categoria de Destino</label>
                <select
                  value={moveTargetCategory}
                  onChange={(e) => setMoveTargetCategory(e.target.value)}
                  className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#00E5FF]"
                >
                  {categorias.map((c) => (
                    <option key={c.id || c.nome} value={c.nome}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsMoveModalOpen(false)}
                  className="flex-1 bg-transparent border border-white/10 text-gray-400 py-3 rounded-xl text-xs font-bold uppercase hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#00E5FF] text-[#0A0F1D] py-3 rounded-xl text-xs font-bold uppercase shadow-lg shadow-cyan-500/20"
                >
                  Mover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Catalog;
