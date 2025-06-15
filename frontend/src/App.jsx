import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/authProvider';
import RequireAuth from './auth/requireAuth';

import Layout from './components/layout';
import LoginPage from './auth/loginPage';
import SpellList from './features/spells/spellList';
import SpellDetail from './features/spells/spellDetail';
import SpellEdit from './features/spells/spellEdit';
import RegisterPage from './auth/registerPage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/" element={<SpellList />} />
            <Route path="/spells" element={<SpellList />} />
            <Route path="/spells/:id" element={<SpellDetail />} />
            <Route path="/spells/:id/edit" element={<SpellEdit />} />
            {/* Add more protected routes here as needed */}
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
