import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Aftersales from './pages/Aftersales';
import Customers from './pages/Customers';
import Inventory from './pages/Inventory';
import Campaigns from './pages/Campaigns';
import Videos from './pages/Videos';
import Chat from './pages/Chat';
import Finance from './pages/Finance';
import Team from './pages/Team';

export default function App() {
  const { user } = useAuth();
  if (!user) return <Routes><Route path="/login" element={<Login />} /><Route path="*" element={<Navigate to="/login" replace />} /></Routes>;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/aftersales" element={<Aftersales />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/team" element={<Team />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
