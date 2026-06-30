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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await addDoc(collection(db, 'contacts'), {
        name,
        email,
        message,
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
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <i className="bi bi-envelope-paper text-olive fs-1"></i>
                <h2 className="font-serif fw-bold text-olive mt-2">Fale Conosco</h2>
                <p className="text-muted">Tem alguma dúvida ou sugestão? Mande uma mensagem.</p>
              </div>

              {sent && <Alert variant="success" className="rounded-4">Mensagem enviada com sucesso! Responderemos em breve.</Alert>}
              {error && <Alert variant="danger" className="rounded-4">{error}</Alert>}

              {!sent ? (
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">Nome</Form.Label>
                    <Form.Control type="text" value={name} onChange={e => setName(e.target.value)} className="rounded-pill" required />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">E-mail</Form.Label>
                    <Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} className="rounded-pill" required />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium">Mensagem</Form.Label>
                    <Form.Control as="textarea" rows={5} value={message} onChange={e => setMessage(e.target.value)} className="rounded-4" required />
                  </Form.Group>
                  <Button variant="olive" type="submit" className="w-100 rounded-pill py-2" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar Mensagem'}
                  </Button>
                </Form>
              ) : (
                <div className="text-center">
                  <Button variant="outline-olive" className="rounded-pill" onClick={() => setSent(false)}>Enviar outra mensagem</Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
