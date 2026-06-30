import { Routes, Route } from 'react-router-dom';
import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { RegisterClinic } from '../pages/RegisterClinic';
import { ClinicsList } from '../pages/ClinicsList';
import { ClinicPage } from '../pages/ClinicPage';
import { DashboardClient } from '../pages/DashboardClient';
import { ClientProfile } from '../pages/ClientProfile';
import { DashboardClinic } from '../pages/DashboardClinic';
import { Chat } from '../pages/Chat';
import { Blog } from '../pages/Blog';
import { Ranking } from '../pages/Ranking';
import { QuestionarioClinica } from '../pages/QuestionarioClinica';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { ApprovalQueue } from '../pages/admin/ApprovalQueue';
import { AdminClinicsList } from '../pages/admin/ClinicsList';
import { AdminClientsList } from '../pages/admin/ClientsList';
import { AdminChat } from '../pages/admin/AdminChat';
import { AdminHistory } from '../pages/admin/History';
import { SupportChat } from '../pages/SupportChat';
import { DashboardProfessional } from '../pages/DashboardProfessional';
import { Checkout } from '../pages/Checkout';
import { PaymentSuccess } from '../pages/PaymentSuccess';
import { ClinicCRM } from '../pages/ClinicCRM';
import { ClinicReports } from '../pages/ClinicReports';
import { TermsOfUse } from '../pages/TermsOfUse';
import { Privacy } from '../pages/Privacy';
import { Contact } from '../pages/Contact';
import { VerifyEmail } from '../pages/VerifyEmail';
import { NotFound } from '../pages/NotFound';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register-clinic" element={<RegisterClinic />} />
      <Route path="/clinics" element={<ClinicsList />} />
      <Route path="/clinic/:id" element={<ClinicPage />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/ranking" element={<Ranking />} />
      
      {/* Páginas institucionais */}
      <Route path="/termos" element={<TermsOfUse />} />
      <Route path="/privacidade" element={<Privacy />} />
      <Route path="/contato" element={<Contact />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Rotas de Cliente */}
      <Route path="/dashboard/client" element={
        <ProtectedRoute allowedRoles={['client']}>
          <DashboardClient />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/client/profile" element={
        <ProtectedRoute allowedRoles={['client']}>
          <ClientProfile />
        </ProtectedRoute>
      } />
      
      {/* Rotas de Clínica */}
      <Route path="/dashboard/clinic" element={
        <ProtectedRoute allowedRoles={['clinic']}>
          <DashboardClinic />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/clinic/checkout" element={
        <ProtectedRoute allowedRoles={['clinic']}>
          <Checkout />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/clinic/checkout/sucesso" element={
        <ProtectedRoute allowedRoles={['clinic']}>
          <PaymentSuccess />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/clinic/clientes" element={
        <ProtectedRoute allowedRoles={['clinic']}>
          <ClinicCRM />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/clinic/relatorios" element={
        <ProtectedRoute allowedRoles={['clinic']}>
          <ClinicReports />
        </ProtectedRoute>
      } />
      <Route path="/questionario" element={
        <ProtectedRoute allowedRoles={['clinic']}>
          <QuestionarioClinica />
        </ProtectedRoute>
      } />
      
      {/* Rotas de Admin */}
      <Route path="/dashboard/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/admin/approval" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ApprovalQueue />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/admin/clinics" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminClinicsList />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/admin/clients" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminClientsList />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/admin/chat" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminChat />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/admin/historico" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminHistory />
        </ProtectedRoute>
      } />
      
      {/* Rotas de Profissional */}
      <Route path="/dashboard/professional" element={
        <ProtectedRoute allowedRoles={['professional']}>
          <DashboardProfessional />
        </ProtectedRoute>
      } />
      
      {/* Suporte (clínica/cliente) */}
      <Route path="/support-chat" element={
        <ProtectedRoute>
          <SupportChat />
        </ProtectedRoute>
      } />
      
      {/* Chat (todos usuários logados) */}
      <Route path="/chat" element={
        <ProtectedRoute allowedRoles={['client', 'clinic', 'admin', 'professional']}>
          <Chat />
        </ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};