import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!name.trim()) { setError('Nome é obrigatório.'); return; }
    if (name.trim().length > 100) { setError('Nome muito longo (máx. 100 caracteres).'); return; }
    if (!email.trim()) { setError('E-mail é obrigatório.'); return; }
    if (!validateEmail(email)) { setError('E-mail inválido.'); return; }
    if (!message.trim()) { setError('Mensagem é obrigatória.'); return; }
    if (message.trim().length > 5000) { setError('Mensagem muito longa (máx. 5000 caracteres).'); return; }

    try {
      setLoading(true);
      setError('');
      await addDoc(collection(db, 'contacts'), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim(),
        createdAt: Timestamp.now(),
        replied: false
      });
      setSent(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setError('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5 mt-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="border-0 shadow-sm card-premium">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <i className="bi bi-envelope-paper text-olive" style={{ fontSize: '3rem' }}></i>
                <h2 className="font-serif fw-bold text-olive mt-3">Fale Conosco</h2>
                <p className="text-muted mt-2">Tem alguma dúvida ou sugestão? Mande uma mensagem.</p>
              </div>

              {sent && (
                <Alert variant="success" className="rounded-4 mb-4">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Mensagem enviada com sucesso! Responderemos em breve.
                </Alert>
              )}

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
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-pill form-control-premium"
                    required
                    autoComplete="email"
                    maxLength={254}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-medium">Mensagem</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    placeholder="Como podemos ajudar?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 5000))}
                    maxLength={5000}
                    className="rounded-4 form-control-premium"
                    required
                  />
                  <Form.Text className="text-end">0 / 5000</Form.Text>
                </Form.Group>

                <Button
                  variant="gold"
                  type="submit"
                  className="w-100 rounded-pill btn-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Enviando...
                    </>
                  ) : (
                    'Enviar Mensagem'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};