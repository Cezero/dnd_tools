import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './authProvider';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await auth.login(username, password);
    if (success) navigate('/');
    else setError('Invalid credentials');
  };

  return (
    <div className="p-4 bg-white text-black dark:bg-gray-900 dark:text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="p-2 border rounded w-full dark:bg-gray-800" />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="p-2 border rounded w-full dark:bg-gray-800" />
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Login</button>
      </form>
      <p className="text-sm mt-4">Don't have an account? <Link to="/register" className="text-blue-500 hover:underline">Register</Link></p>
    </div>
  );
}
