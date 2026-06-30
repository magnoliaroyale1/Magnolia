import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/SEO';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const firebaseUser = await login(email, password);
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (userDoc.exists()) {
        const role = userDoc.data().role;
        if (role === 'clinic') navigate('/dashboard/clinic');
        else if (role === 'admin') navigate('/dashboard/admin');
        else if (role === 'professional') navigate('/dashboard/professional');
        else navigate('/dashboard/client');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const messages: Record<string, string> = {
        'auth/invalid-credential': 'E-mail ou senha inválidos.',
        'auth/invalid-email': 'E-mail inválido.',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.'
      };
      setError(messages[err.code] || 'E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
      setError('');
    } catch (err: any) {
      setError('Erro ao enviar e-mail de redefinição. Verifique o e-mail informado.');
    }
  };

  return (
    <Container className="py-5 mt-5">
      <SEO title="Entrar" description="Entre na sua conta Magnolia Royale." url="https://magnoliaroyale.com.br/login" />
      <Row className="justify-content-center">
        <Col md={5}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <i className="bi bi-flower2 text-olive fs-1"></i>
                <h3 className="font-serif fw-bold text-olive mt-2">Bem-vindo de volta</h3>
                <p className="text-muted">Entre na sua conta Magnolia Royale</p>
              </div>

              {error && <Alert variant="danger" className="rounded-4">{error}</Alert>}
              {resetSent && <Alert variant="success" className="rounded-4">E-mail de redefinição enviado! Verifique sua caixa de entrada.</Alert>}

              {showReset ? (
                <Form onSubmit={handleResetPassword}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">E-mail</Form.Label>
                    <Form.Control
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="rounded-pill"
                      placeholder="seu@email.com"
                      required
                    />
                  </Form.Group>
                  <Button variant="olive" type="submit" className="w-100 rounded-pill py-2">
                    Enviar Redefinição
                  </Button>
                  <div className="text-center mt-3">
                    <Button variant="link" className="text-decoration-none" onClick={() => { setShowReset(false); setResetSent(false); }}>
                      Voltar ao login
                    </Button>
                  </div>
                </Form>
              ) : (
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">E-mail</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-pill"
                      placeholder="seu@email.com"
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <div className="d-flex justify-content-between">
                      <Form.Label className="fw-medium">Senha</Form.Label>
                      <Button variant="link" className="p-0 text-decoration-none small" onClick={() => setShowReset(true)}>
                        Esqueceu a senha?
                      </Button>
                    </div>
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-pill"
                      placeholder="••••••••"
                      required
                    />
                  </Form.Group>
                  <Button variant="gold" type="submit" className="w-100 rounded-pill py-2" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </Form>
              )}

              <div className="text-center mt-4">
                <p className="text-muted mb-2">
                  <Link to="/register" className="text-gold text-decoration-none">Criar conta de cliente</Link>
                </p>
                <p className="text-muted mb-0">
                  <Link to="/register-clinic" className="text-olive text-decoration-none">Cadastrar minha clínica</Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
