import React, { useEffect, useState } from 'react';
import supabase from '../../supabaseClient';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingBag, Clock, XCircle, TrendingUp, Sparkles, Beer, Ticket, Package, Calendar, Award } from 'lucide-react';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7'); // '7', '30', 'hoje'
  
  const [metrics, setMetrics] = useState({
    faturamento_total: 0,
    ticket_medio: 0,
    pedidos_validos: 0,
    cancelados_qtd: 0,
    agendados_qtd: 0,
    chartData: [],
    topProducts: []
  });

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      const startDate = new Date();
      if (period === 'hoje') {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === '7') {
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
      } else if (period === '30') {
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
      }

      let pedidos = [];
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          id, created_at, total, subtotal, taxa_entrega, status, is_agendado,
          itens_pedido (
            quantidade,
            produtos ( nome )
          )
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Erro na consulta completa, tentando busca simplificada:', error);
        const { data: fallbackData } = await supabase
          .from('pedidos')
          .select('id, created_at, total, subtotal, taxa_entrega, status, is_agendado')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false });
        pedidos = fallbackData || [];
      } else {
        pedidos = data || [];
      }

      let fatTotal = 0;
      let pedValidos = 0;
      let cancQtd = 0;
      let agendQtd = 0;
      let subtotalTotal = 0;
      let freteTotal = 0;
      const chartMap = {};
      const productMap = {};

      // Inicializa dias no mapa
      if (period === 'hoje') {
        const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        chartMap[todayStr] = { name: todayStr, faturamento: 0 };
      } else {
        const days = parseInt(period) || 7;
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          chartMap[dateStr] = { name: dateStr, faturamento: 0 };
        }
      }

      (pedidos || []).forEach((p) => {
        const valor = parseFloat(p.total || 0);
        const sub = parseFloat(p.subtotal || 0);
        const frete = parseFloat(p.taxa_entrega || 0);
        const isCancelled = p.status === 'CANCELADO';

        if (isCancelled) {
          cancQtd++;
          return;
        }

        fatTotal += valor;
        subtotalTotal += sub;
        freteTotal += frete;
        pedValidos++;

        if (p.is_agendado || p.status === 'AGENDADO') {
          agendQtd++;
        }

        const dateObj = new Date(p.created_at);
        const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

        if (!chartMap[dateStr]) {
          chartMap[dateStr] = { name: dateStr, faturamento: 0 };
        }
        chartMap[dateStr].faturamento += valor;

        // Agrupa produtos mais vendidos
        if (p.itens_pedido) {
          p.itens_pedido.forEach((item) => {
            const prodName = item.produtos?.nome || 'Bebida';
            productMap[prodName] = (productMap[prodName] || 0) + item.quantidade;
          });
        }
      });

      const chartData = Object.values(chartMap);
      const topProducts = Object.entries(productMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setMetrics({
        faturamento_total: fatTotal,
        ticket_medio: pedValidos > 0 ? fatTotal / pedValidos : 0,
        pedidos_validos: pedValidos,
        cancelados_qtd: cancQtd,
        agendados_qtd: agendQtd,
        subtotal_total: subtotalTotal,
        frete_total: freteTotal,
        chartData,
        topProducts
      });

    } catch (err) {
      console.error('Erro ao buscar métricas:', err);
    } finally {
      setLoading(false);
    }
  };

  const raioXData = [
    { name: 'Produtos', value: metrics.subtotal_total || 0, color: '#A855F7' },
    { name: 'Frete', value: metrics.frete_total || 0, color: '#374151' }
  ];
  const totalRaioX = (metrics.subtotal_total || 0) + (metrics.frete_total || 0);
  const prodPerc = totalRaioX > 0 ? Math.round(((metrics.subtotal_total || 0) / totalRaioX) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Header: VISÃO GERAL e Filtros (Layout Vaiper) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black uppercase text-white tracking-widest flex items-center gap-3">
            <TrendingUp size={24} className="text-[#00E5FF]" /> VISÃO GERAL
          </h1>
          <p className="text-xs text-gray-400 mt-1">Acompanhe seus indicadores chave (KPIs) em tempo real.</p>
        </div>

        {/* Filtros em Pílula Escura */}
        <div className="flex bg-[#0A0F1D] border border-white/5 rounded-full p-1 text-[10px] md:text-xs font-bold uppercase tracking-widest">
          {['hoje', '7', '30'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-full transition-colors ${
                period === p ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {p === '7' ? '7 DIAS' : p === '30' ? '30 DIAS' : 'HOJE'}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento */}
        <div className="bg-[#101935]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 space-y-1">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
            <DollarSign size={14} className="text-[#00E5FF]" />
            <span>Faturamento</span>
          </div>
          <span className="text-3xl font-display font-black text-[#00E5FF] block tracking-tight">
            R$ {metrics.faturamento_total.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">
            Em {metrics.pedidos_validos} pedidos válidos
          </span>
        </div>

        {/* Ticket Médio */}
        <div className="bg-[#101935]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 space-y-1">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Ticket size={14} className="text-purple-400" />
            <span>Ticket Médio</span>
          </div>
          <span className="text-3xl font-display font-black text-white block tracking-tight">
            R$ {metrics.ticket_medio.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">
            Gasto por cliente
          </span>
        </div>

        {/* Agendamentos */}
        <div className="bg-[#101935]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 space-y-1">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Clock size={14} className="text-[#00E5FF]" />
            <span>Agendamentos</span>
          </div>
          <span className="text-3xl font-display font-black text-white block tracking-tight">
            R$ {(metrics.agendados_qtd * metrics.ticket_medio).toFixed(2).replace('.', ',')}
          </span>
          <span className="text-[10px] text-[#00E5FF] uppercase tracking-widest">
            {metrics.agendados_qtd} pedidos noturnos
          </span>
        </div>

        {/* Cancelamentos */}
        <div className="bg-[#101935]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 space-y-1">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
            <XCircle size={14} className="text-red-500" />
            <span>Cancelamentos</span>
          </div>
          <span className="text-3xl font-display font-black text-red-500 block tracking-tight">
            R$ {(metrics.cancelados_qtd * metrics.ticket_medio).toFixed(2).replace('.', ',')}
          </span>
          <span className="text-[10px] text-red-500/70 uppercase tracking-widest">
            {metrics.cancelados_qtd} perdas de venda
          </span>
        </div>
      </div>

      {/* Row 2: Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Evolução de Vendas (Área) */}
        <div className="lg:col-span-8 bg-[#101935]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider mb-6">
            <Calendar size={14} className="text-gray-400" />
            <span>Evolução de Vendas</span>
          </div>
          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-xs uppercase tracking-widest">
                Carregando...
              </div>
            ) : metrics.chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-xs uppercase tracking-widest">
                Sem dados no período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.chartData}>
                  <defs>
                    <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.5}/>
                      <stop offset="100%" stopColor="#00E5FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#333" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#333" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip 
                    cursor={{ stroke: '#ffffff20', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{ backgroundColor: '#0A0F1D', borderColor: '#00E5FF', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#00E5FF', fontWeight: 'bold' }}
                    formatter={(value) => [`R$ ${Number(value).toFixed(2).replace('.', ',')}`, 'Vendas']}
                  />
                  <Area type="monotone" dataKey="faturamento" stroke="#00E5FF" strokeWidth={3} fillOpacity={1} fill="url(#colorFat)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Raio-X (Doughnut) */}
        <div className="lg:col-span-4 bg-[#101935]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider mb-4">
            <Package size={14} className="text-gray-400" />
            <span>Raio-X (Produto x Frete)</span>
          </div>

          <div className="relative flex-1 min-h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={raioXData}
                  innerRadius="70%"
                  outerRadius="90%"
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {raioXData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Texto central do Doughnut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Produtos</span>
              <span className="text-3xl font-display font-black text-white">{prodPerc}%</span>
            </div>
          </div>

          {/* Legendas Embaixo (Estoque/Lucro vs Custo Logístico) */}
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Estoque / Lucro</span>
              <span className="text-xs font-bold text-white">R$ {Number(metrics.subtotal_total || 0).toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Custo Logístico</span>
              <span className="text-xs font-bold text-white">R$ {Number(metrics.frete_total || 0).toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Top 5 Produtos (Layout Vaiper Cards) */}
      <div className="bg-[#101935]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
          <Award size={16} className="text-[#FFDE59]" />
          <span>Top 5 Produtos Mais Vendidos</span>
        </div>

        {metrics.topProducts.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-8 uppercase tracking-widest">Sem vendas no período</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {metrics.topProducts.map((prod, idx) => (
              <div key={idx} className="bg-[#0A0F1D] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-between text-center relative group hover:border-[#00E5FF]/30 transition-colors h-40">
                {/* Badge Rank */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#00E5FF] text-[#0A0F1D] flex items-center justify-center font-black text-xs shadow-[0_0_15px_rgba(0,229,255,0.4)]">
                  {idx + 1}º
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center w-full mt-2">
                  <Package size={24} className="text-gray-600 mb-3 group-hover:text-gray-400 transition-colors" />
                  <span className="text-[10px] md:text-xs font-bold text-gray-300 uppercase leading-snug line-clamp-2 px-2">
                    {prod.name}
                  </span>
                </div>

                <div className="bg-white/5 rounded-md px-4 py-1.5 mt-3">
                  <span className="text-[10px] font-bold text-white tracking-widest">{prod.count} unid.</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
