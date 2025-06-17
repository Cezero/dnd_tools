import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/auth/authProvider';
import RequireAuth from '@/auth/requireAuth';

import Layout from '@/components/layout';
import LoginPage from '@/auth/loginPage';
import RegisterPage from '@/auth/registerPage';
import { featureRoutes } from '@/features/featureRoutes';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            {featureRoutes.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={route.component ? <route.component /> : null}
              >
                {route.children && route.children.map((childRoute, childIndex) => (
                  <Route
                    key={`${index}-${childIndex}`}
                    path={childRoute.path}
                    element={<childRoute.component />}
                    exact={childRoute.exact}
                  />
                ))}
              </Route>
            ))}
            {/* Add more protected routes here as needed */}
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
