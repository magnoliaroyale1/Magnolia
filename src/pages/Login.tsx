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

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('E-mail é obrigatório.'); return; }
    if (!validateEmail(email)) { setError('E-mail inválido.'); return; }
    if (!password) { setError('Senha é obrigatória.'); return; }
    if (password.length > 128) { setError('Senha muito longa.'); return; }

    try {
      setLoading(true);
      const firebaseUser = await login(email.trim().toLowerCase(), password);
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
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
      };
      setError(messages[err.code] || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !validateEmail(resetEmail)) {
      setError('E-mail válido é obrigatório.');
      return;
    }
    try {
      setError('');
      await sendPasswordResetEmail(auth, resetEmail.trim().toLowerCase());
      setResetSent(true);
      setResetEmail('');
    } catch {
      setError('Erro ao enviar e-mail de recuperação. Tente novamente.');
    }
  };

  return (
    <Container className="py-5 mt-5">
      <SEO title="Entrar" description="Acesse sua conta na Magnolia Royale" url="https://magnoliaroyale.com.br/login" />
      <Row className="justify-content-center">
        <Col md={5} lg={4}>
          <Card className="border-0 shadow-sm card-premium">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <i className="bi bi-box-arrow-in-right text-olive" style={{ fontSize: '3rem' }}></i>
                <h2 className="font-serif fw-bold text-olive mt-3">Entrar</h2>
                <p className="text-muted mt-2">Acesse sua conta para continuar</p>
              </div>

              {!showReset ? (
                <>
                  {error && <Alert variant="danger" className="rounded-4 mb-4">{error}</Alert>}

                  <Form onSubmit={handleSubmit} noValidate>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">E-mail</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.toLowerCase())}
                        maxLength={254}
                        className="rounded-pill form-control-premium"
                        required
                        autoComplete="email"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3 d-flex justify-content-between align-items-center">
                      <Form.Label className="fw-medium mb-0">Senha</Form.Label>
                      <Link to="#" className="text-olive small text-decoration-none" onClick={(e) => { e.preventDefault(); setShowReset(true); }}>
                        Esqueci a senha
                      </Link>
                    </Form.Group>
                    <Form.Control
                      type="password"
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      maxLength={128}
                      className="rounded-pill form-control-premium mb-3"
                      required
                      autoComplete="current-password"
                    />

                    <Button
                      variant="gold"
                      type="submit"
                      className="w-100 rounded-pill btn-lg mb-3"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Entrando...
                        </>
                      ) : (
                        'Entrar'
                      )}
                    </Button>

                    <p className="text-center text-muted small mb-0">
                      Não tem conta? <Link to="/register" className="text-olive text-decoration-none fw-medium">Criar conta</Link>
                    </p>
                  </Form>
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <i className="bi bi-envelope-arrow-up text-olive" style={{ fontSize: '3rem' }}></i>
                    <h5 className="font-serif fw-bold text-olive mt-3">Recuperar Senha</h5>
                    <p className="text-muted mt-2">Digite seu e-mail para receber o link de recuperação</p>
                  </div>

                  {error && <Alert variant="danger" className="rounded-4 mb-4">{error}</Alert>}
                  {resetSent && <Alert variant="success" className="rounded-4 mb-4">E-mail de recuperação enviado! Verifique sua caixa de entrada.</Alert>}

                  <Form onSubmit={handleResetRequest} noValidate>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-medium">E-mail</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="seu@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value.toLowerCase())}
                        maxLength={254}
                        className="rounded-pill form-control-premium"
                        required
                        autoComplete="email"
                      />
                    </Form.Group>

                    <Button
                      variant="gold"
                      type="submit"
                      className="w-100 rounded-pill btn-lg mb-3"
                    >
                      Enviar Link de Recuperação
                    </Button>

                    <Button
                      variant="link"
                      className="w-100 text-olive fw-medium"
                      onClick={() => { setShowReset(false); setError(''); }}
                    >
                      <i className="bi bi-arrow-left me-1"></i>Voltar ao Login
                    </Button>
                  </Form>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};