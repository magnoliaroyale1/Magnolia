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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('As senhas não coincidem');
    }
    if (!agreeTerms) {
      return setError('Você precisa aceitar os Termos de Uso e a Política de Privacidade.');
    }
    try {
      setError('');
      setLoading(true);
      await register(email, password, name, 'client');
      navigate('/verify-email');
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5 mt-5">
      <SEO title="Criar Conta" description="Crie sua conta na Magnolia Royale e encontre as melhores clínicas de estética." url="https://magnoliaroyale.com.br/register" />
      <Row className="justify-content-center">
        <Col md={5}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <i className="bi bi-person-heart text-olive fs-1"></i>
                <h2 className="font-serif fw-bold text-olive mt-2">Criar Conta</h2>
                <p className="text-muted">Junte-se à Magnolia Royale</p>
              </div>

              {error && <Alert variant="danger" className="rounded-4">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Nome Completo</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-pill"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">E-mail</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-pill"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Senha</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-pill"
                    required
                    minLength={6}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-medium">Confirmar Senha</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-pill"
                    required
                  />
                </Form.Group>

                <Form.Check
                  type="checkbox"
                  id="agreeTerms"
                  className="mb-3"
                  label={
                    <span className="small">
                      Aceito os <Link to="/termos" target="_blank" className="text-gold">Termos de Uso</Link> e a{' '}
                      <Link to="/privacidade" target="_blank" className="text-gold">Política de Privacidade</Link>
                    </span>
                  }
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  required
                />

                <Button
                  type="submit"
                  variant="olive"
                  className="w-100 rounded-pill py-2"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  ) : (
                    <i className="bi bi-person-plus me-2"></i>
                  )}
                  Criar Conta
                </Button>
              </Form>

              <div className="text-center mt-3">
                <Link to="/login" className="text-decoration-none text-muted small">
                  Já tem uma conta? Entre aqui
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};