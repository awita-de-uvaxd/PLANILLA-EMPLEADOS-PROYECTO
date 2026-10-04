import { useState } from 'react';
import { Lock, User } from 'lucide-react';
import api from '../services/api';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [credenciales, setCredenciales] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', credenciales);
      // Guardar sesión en el almacenamiento local del navegador
      localStorage.setItem('user', JSON.stringify(response.data));
      onLoginSuccess(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error de conexión');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-900 p-8 text-center">
          <h1 className="text-3xl font-bold text-white flex justify-center items-center gap-2">
            <span className="text-blue-500">Nómina</span>Hub
          </h1>
          <p className="text-slate-400 mt-2">Acceso al Sistema Corporativo</p>
        </div>
        
        <div className="p-8">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 border border-red-200 text-center">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input required type="text" className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={credenciales.username} onChange={(e) => setCredenciales({...credenciales, username: e.target.value})} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input required type="password" className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={credenciales.password} onChange={(e) => setCredenciales({...credenciales, password: e.target.value})} />
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors">
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}