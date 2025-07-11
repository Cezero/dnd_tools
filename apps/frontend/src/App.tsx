import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from '@/components/auth/AuthProvider';
import { LoginPage } from '@/components/auth/LoginPage';
import { ProtectedRoute, AdminRoute } from '@/components/auth/ProtectedRoute';
import { RegisterPage } from '@/components/auth/RegisterPage';
import { Layout } from '@/components/Layout';
import { FeatureRoutes } from '@/features/FeatureRoutes';
import { RouteConfig } from '@/types';

export function App(): React.JSX.Element {
  return (
    <div className="isolate">
      <AuthProvider>
        <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              {FeatureRoutes.map((route: RouteConfig, index: number) => (
                <Route
                  key={index}
                  path={route.path}
                  element={
                    route.requireAdmin ? (
                      <AdminRoute>{route.component ? <route.component /> : null}</AdminRoute>
                    ) : (
                      route.component ? <route.component /> : null
                    )
                  }
                >
                  {route.children && route.children.map((childRoute: RouteConfig, childIndex: number) => (
                    <Route
                      key={`${index}-${childIndex}`}
                      path={childRoute.path}
                      element={
                        childRoute.requireAdmin ? (
                          <AdminRoute>{<childRoute.component />}</AdminRoute>
                        ) : (
                          <childRoute.component />
                        )
                      }
                    />
                  ))}
                </Route>
              ))}
              {/* Add more protected routes here as needed */}
              <Route path="/" element={<Navigate to="/spells" replace />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}
