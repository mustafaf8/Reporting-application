import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        const res = await login(email, password);
        if (res.ok) {
          navigate('/');
        } else {
          setError(res.message || 'Giriş başarısız');
        }
      } else {
        const res = await register(name, email, password);
        if (res.ok) {
          navigate('/');
        } else {
          setError(res.message || 'Kayıt başarısız');
        }
      }
    } catch (error) {
      setError('İşlem sırasında bir hata oluştu');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Ad Soyad</label>
            <input 
              type="text" 
              className="mt-1 w-full border border-gray-300 rounded-md p-2" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700">E-posta</label>
          <input 
            type="email" 
            className="mt-1 w-full border border-gray-300 rounded-md p-2" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Parola</label>
          <input 
            type="password" 
            className="mt-1 w-full border border-gray-300 rounded-md p-2" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        
        {error && <p className="text-red-600 text-sm">{error}</p>}
        
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {loading ? (isLogin ? 'Giriş yapılıyor...' : 'Kayıt olunuyor...') : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <button 
          onClick={toggleMode}
          className="text-indigo-600 hover:underline text-sm"
        >
          {isLogin ? 'Hesabınız yok mu? Kayıt olun' : 'Zaten hesabınız var mı? Giriş yapın'}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;


