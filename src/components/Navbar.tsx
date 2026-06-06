import { useEffect, useState, useRef } from 'react';
import { Navbar, Nav, Container, Button, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

export const NavigationBar = () => {
  const { user, isAdmin, isClinic, isClient, isProfessional, logout } = useAuth();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, requestBrowserPermission } = useNotifications(user?.uid || '');
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      requestBrowserPermission();
    }
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <Navbar expand="lg" fixed="top" className="py-3">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
          <i className="bi bi-flower1 text-olive fs-3"></i>
          <span className="font-serif fw-bold text-olive fs-4">Magnolia Royale</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav" role="navigation">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" className="text-olive fw-medium">Início</Nav.Link>
            <Nav.Link as={Link} to="/clinics" className="text-olive fw-medium">Clínicas</Nav.Link>
            <Nav.Link as={Link} to="/ranking" className="text-olive fw-medium">Ranking</Nav.Link>
            <Nav.Link as={Link} to="/blog" className="text-olive fw-medium">Blog</Nav.Link>
          </Nav>

          <Nav className="gap-2 align-items-center">
            {user ? (
              <>
                <div className="position-relative" ref={notifRef}>
                  <Button
                    variant="link"
                    className="text-olive p-1 position-relative"
                    onClick={() => setShowNotif(!showNotif)}
                  >
                    <i className="bi bi-bell fs-5"></i>
                    {unreadCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                  {showNotif && (
                    <div className="position-absolute end-0 mt-2 bg-white shadow-lg rounded-4" style={{ width: '350px', zIndex: 1050, maxHeight: '400px', overflowY: 'auto' }}>
                      <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                        <strong className="text-olive">Notificações</strong>
                        {unreadCount > 0 && (
                          <Button variant="link" size="sm" className="text-decoration-none p-0" onClick={markAllAsRead}>
                            Marcar todas lidas
                          </Button>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <p className="text-muted text-center py-4 mb-0">Nenhuma notificação</p>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className={`p-3 border-bottom ${!n.read ? 'bg-light' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              if (!n.read) markAsRead(n.id!);
                              if (n.link) navigate(n.link);
                              setShowNotif(false);
                            }}
                          >
                            <div className="d-flex justify-content-between">
                              <strong className="small">{n.title}</strong>
                              <small className="text-muted">{n.createdAt?.toDate?.().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || ''}</small>
                            </div>
                            <p className="mb-0 small text-muted">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <Nav.Link as={Link} to="/dashboard/admin">
                    <Button variant="outline-danger" className="rounded-pill px-3">
                      <i className="bi bi-shield-lock me-2"></i>
                      Admin
                    </Button>
                  </Nav.Link>
                )}
                <Nav.Link as={Link} to={isAdmin ? '/dashboard/admin' : isClinic ? '/dashboard/clinic' : isProfessional ? '/dashboard/professional' : '/dashboard/client'}>
                  <Button variant="outline-olive" className="rounded-pill px-4">
                    <i className="bi bi-person-circle me-2"></i>
                    {isAdmin ? 'Painel Admin' : isClinic ? 'Painel Clínica' : isProfessional ? 'Meu Painel' : 'Meu Painel'}
                  </Button>
                </Nav.Link>
                <Button variant="olive" className="rounded-pill px-4" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  <Button variant="outline-olive" className="rounded-pill px-4">
                    Entrar
                  </Button>
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
                  <Button variant="olive" className="rounded-pill px-4">
                    Cadastrar
                  </Button>
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
