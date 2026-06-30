import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';

export const VerifyEmail = () => {
  const { user, sendVerificationEmail, logout } = useAuth();
  const navigate = useNavigate();
  const [resent, setResent] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser?.emailVerified) {
        fbUser.getIdToken(true);
        navigate(user?.role === 'clinic'
          ? '/dashboard/clinic'
          : user?.role === 'professional'
          ? '/dashboard/professional'
          : '/dashboard/client', { replace: true });
      }
    });
    return () => unsub();
  }, [navigate, user?.role]);

  const handleResend = async () => {
    await sendVerificationEmail();
    setResent(true);
    setTimeout(() => setResent(false), 5000);
  };

  const handleCheck = async () => {
    setChecking(true);
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
    }
    setChecking(false);
  };

  return (
    <Container className="py-5 mt-5">
      <Row className="justify-content-center">
        <Col md={5}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-5 text-center">
              <i className="bi bi-envelope-check text-olive" style={{ fontSize: '4rem' }}></i>
              <h3 className="font-serif fw-bold text-olive mt-3">Confirme seu e-mail</h3>
              <p className="text-muted mb-4">
                Enviamos um link de confirmação para <strong>{user?.email}</strong>.
                Clique no link para ativar sua conta.
              </p>

              {resent && (
                <Alert variant="success" className="rounded-4 py-2 small" dismissible onClose={() => setResent(false)}>
                  E-mail reenviado! Verifique sua caixa de entrada.
                </Alert>
              )}

              <div className="d-flex flex-column gap-2">
                <Button variant="olive" className="rounded-pill py-2" onClick={handleCheck} disabled={checking}>
                  {checking ? <Spinner animation="border" size="sm" /> : 'Já confirmei, verificar'}
                </Button>
                <Button variant="outline-olive" className="rounded-pill py-2" onClick={handleResend}>
                  Reenviar e-mail
                </Button>
                <Button variant="link" className="text-decoration-none text-muted small mt-2" onClick={logout}>
                  Sair e usar outra conta
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
