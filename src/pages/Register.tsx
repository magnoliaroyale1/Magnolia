import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/SEO';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) { setError('Nome é obrigatório.'); return; }
    if (name.trim().length > 100) { setError('Nome muito longo (máx. 100 caracteres).'); return; }
    if (!email.trim()) { setError('E-mail é obrigatório.'); return; }
    if (!validateEmail(email)) { setError('E-mail inválido.'); return; }
    if (password.length < 6) { setError('A senha deve ter no mínimo 6 caracteres.'); return; }
    if (password.length > 128) { setError('A senha é muito longa (máx. 128 caracteres).'); return; }
    if (password !== confirmPassword) { setError('As senhas não coincidem'); return; }
    if (!agreeTerms) { setError('Você precisa aceitar os Termos de Uso e a Política de Privacidade.'); return; }

    try {
      setLoading(true);
      await register(email.trim().toLowerCase(), password, name.trim(), 'client');
      navigate('/verify-email');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado. Tente fazer login.');
      } else if (err.code === 'auth/invalid-email') {
        setError('E-mail inválido.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha é muito fraca. Use pelo menos 6 caracteres.');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5 mt-5">
      <SEO title="Criar Conta" description="Crie sua conta na Magnolia Royale e encontre as melhores clínicas de estética." url="https://magnoliaroyale.com.br/register" />
      <Row className="justify-content-center">
        <Col md={5} lg={4}>
          <Card className="border-0 shadow-sm card-premium">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <i className="bi bi-person-heart text-olive" style={{ fontSize: '3rem' }}></i>
                <h2 className="font-serif fw-bold text-olive mt-3">Criar Conta</h2>
                <p className="text-muted mt-2">Junte-se à Magnolia Royale e descubra clínicas premium</p>
              </div>

              {error && <Alert variant="danger" className="rounded-4 mb-4">{error}</Alert>}

              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Nome completo</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 100))}
                    maxLength={100}
                    className="rounded-pill form-control-premium"
                    required
                    autoComplete="name"
                  />
                  <Form.Text className="text-end">0 / 100</Form.Text>
                </Form.Group>

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

                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Senha</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    maxLength={128}
                    className="rounded-pill form-control-premium"
                    required
                    autoComplete="new-password"
                  />
                  <Form.Text>Mínimo 6 caracteres</Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Confirmar senha</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Confirme sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    maxLength={128}
                    className="rounded-pill form-control-premium"
                    required
                    autoComplete="new-password"
                  />
                </Form.Group>

                <Form.Check className="mb-4">
                  <Form.Check.Input
                    type="checkbox"
                    id="agreeTerms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="form-check-input rounded"
                  />
                  <Form.Check.Label className="text-muted small" htmlFor="agreeTerms">
                    Concordo com os <Link to="/termos-de-uso" className="text-olive text-decoration-none">Termos de Uso</Link> e a <Link to="/politica-de-privacidade" className="text-olive text-decoration-none">Política de Privacidade</Link>
                  </Form.Check.Label>
                </Form.Check>

                <Button
                  variant="gold"
                  type="submit"
                  className="w-100 rounded-pill btn-lg mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Criando conta...
                    </>
                  ) : (
                    'Criar Conta'
                  )}
                </Button>

                <p className="text-center text-muted small mb-0">
                  Já tem conta? <Link to="/login" className="text-olive text-decoration-none fw-medium">Entrar</Link>
                </p>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};