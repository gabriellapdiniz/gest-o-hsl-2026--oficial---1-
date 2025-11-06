import React, { useState } from 'react';
import { seedDatabase } from '../seed-data';
import { db } from '../firebaseConfig';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  error?: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, password);
    }
  };

  const handleSeed = async () => {
    if(window.confirm('Tem certeza que deseja popular o banco de dados? Esta ação só deve ser executada uma vez para evitar dados duplicados.')) {
      setIsSeeding(true);
      setSeedMessage('');
      try {
        await seedDatabase(db);
        setSeedMessage('Banco de dados populado com sucesso!');
      } catch (e: any) {
        console.error("Erro ao popular o banco de dados:", e);
        setSeedMessage(`Erro: ${e.message}`);
      } finally {
        setIsSeeding(false);
      }
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#005f69]">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-cyan-800">HSL - INTRANET</h1>
          <p className="mt-2 text-sm text-slate-600">SOLUÇÕES EM APRENDIZAGEM</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password"className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              Entrar
            </button>
          </div>
        </form>

        {error && <p className="mt-4 text-sm text-red-600 text-center">{error}</p>}
        
        <div className="mt-6 border-t pt-4">
          <p className="text-xs text-center text-slate-500 mb-2">
            Primeira vez configurando? Popule o banco de dados com dados de exemplo.
          </p>
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="w-full text-xs py-2 px-4 border rounded-md bg-slate-100 hover:bg-slate-200 disabled:bg-slate-300"
          >
            {isSeeding ? 'Populando...' : 'Popular Banco de Dados'}
          </button>
           {seedMessage && <p className="mt-2 text-xs text-center text-green-600">{seedMessage}</p>}
        </div>
      </div>
    </div>
  );
};

export default Login;
