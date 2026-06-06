import { Nav, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

export const AdminSidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard/admin', icon: 'bi-speedometer2', label: 'Dashboard' },
    { path: '/dashboard/admin/approval', icon: 'bi-clock-history', label: 'Fila de Aprovação' },
    { path: '/dashboard/admin/clinics', icon: 'bi-building', label: 'Clínicas' },
    { path: '/dashboard/admin/clients', icon: 'bi-people', label: 'Clientes' },
    { path: '/dashboard/admin/chat', icon: 'bi-chat-dots', label: 'Mensagens' },
    { path: '/dashboard/admin/historico', icon: 'bi-clock-history', label: 'Histórico' },
  ];

  return (
    <div className="bg-olive text-white p-4 rounded-4 h-100" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <h5 className="font-serif fw-bold mb-4">
        <i className="bi bi-shield-lock me-2"></i>
        Painel Admin
      </h5>
      <Nav className="flex-column gap-2">
        {navItems.map((item) => (
          <Nav.Link
            key={item.path}
            as={Link}
            to={item.path}
            className={`text-white rounded-pill px-3 py-2 ${location.pathname === item.path ? 'bg-white bg-opacity-25' : ''}`}
          >
            <i className={`bi ${item.icon} me-2`}></i>
            {item.label}
          </Nav.Link>
        ))}
      </Nav>
    </div>
  );
};