import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../supabaseClient';
import { Lock, Mail, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Erro no login Supabase:", error);
      setError(`Erro: ${error.message}`);
    } else if (data.session) {
      navigate('/admin/dashboard');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1D] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00E5FF]/10 rounded-full blur-[140px] pointer-events-none" />
      
      <div className="z-10 w-full max-w-md bg-[#101935] p-8 md:p-10 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-8">
          <img src="/logo_refresca.png" alt="Refresca Bebidas" className="h-20 w-auto mx-auto mb-4 object-contain drop-shadow-[0_0_15px_rgba(0,229,255,0.4)]" />
          <h1 className="font-display font-black text-2xl text-white uppercase tracking-wider">
            Painel <span className="text-[#00E5FF]">Admin</span>
          </h1>
          <p className="text-gray-400 text-xs mt-1">Acesso exclusivo do Depósito Refresca</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Mail size={14} className="text-[#00E5FF]" /> E-mail
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#0A0F1D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E5FF] transition-colors"
              placeholder="admin@refresca.com"
              required
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lock size={14} className="text-[#00E5FF]" /> Senha
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#0A0F1D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E5FF] transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-2 py-4 px-4 rounded-xl text-sm font-display font-black uppercase tracking-wider text-[#0A0F1D] bg-[#FFDE59] hover:bg-yellow-400 focus:outline-none transition-colors shadow-lg shadow-yellow-500/10 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            {loading ? 'Autenticando...' : (
              <>
                Entrar no Sistema <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
