import { useState } from 'react';
import { Container, Card, Row, Col, Button, Form, Nav, Alert, Spinner, Badge } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClinicProfile } from '../hooks/useClinicProfile';
import { useCheckout } from '../hooks/useCheckout';
import { PLANS } from '../utils/constants';

const BOLETO_FAKE = '34191.79900 12345.67890 12345.678901 1 12345678901234';
const PIX_FAKE = '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426614174000';

export const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const clinicId = user?.clinicId || user?.uid || '';
  const { clinic } = useClinicProfile(clinicId);
  const { createCheckoutSession, completeCheckout, processing } = useCheckout();

  const planId = searchParams.get('plan') || 'basic';
  const plan = PLANS.find(p => p.id === planId) || PLANS[0];

  const [tab, setTab] = useState<'credit_card' | 'boleto' | 'pix'>('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [copied, setCopied] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const detectBrand = (num: string) => {
    const d = num.replace(/\s/g, '');
    if (d.startsWith('4')) return { name: 'Visa', icon: 'bi-credit-card-2-front' };
    if (d.startsWith('5')) return { name: 'Mastercard', icon: 'bi-credit-card-2-front' };
    if (d.startsWith('3')) return { name: 'Amex', icon: 'bi-credit-card-2-front' };
    if (d.startsWith('6')) return { name: 'Discover', icon: 'bi-credit-card-2-front' };
    return null;
  };

  const handlePay = async () => {
    setPaymentError('');
    if (!clinicId || !clinic) return;

    if (tab === 'credit_card') {
      const clean = cardNumber.replace(/\s/g, '');
      if (clean.length < 13) { setPaymentError('Número do cartão inválido'); return; }
      if (cardExpiry.length < 5) { setPaymentError('Data de validade inválida'); return; }
      if (cardCvv.length < 3) { setPaymentError('CVV inválido'); return; }
      if (!cardName.trim()) { setPaymentError('Nome do titular obrigatório'); return; }
    }

    const sessionId = await createCheckoutSession(clinicId, plan.id as any, plan.price);
    if (!sessionId) { setPaymentError('Erro ao criar sessão. Tente novamente.'); return; }

    const ok = await completeCheckout(clinicId, sessionId, tab);
    if (!ok) { setPaymentError('Erro ao processar pagamento. Tente novamente.'); return; }

    navigate(`/dashboard/clinic/checkout/sucesso?plan=${plan.id}&method=${tab}`);
  };

  if (!clinic) {
    return <Container className="py-5 mt-5 text-center"><Spinner animation="border" className="text-olive" /></Container>;
  }

  return (
    <Container className="py-5 mt-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center mb-4">
                <Button variant="link" className="p-0 me-3 text-decoration-none" onClick={() => navigate('/dashboard/clinic')}>
                  <i className="bi bi-arrow-left fs-5"></i>
                </Button>
                <h4 className="font-serif fw-bold text-olive mb-0">Finalizar Upgrade</h4>
              </div>

              <Card className="border-gold border-2 bg-light mb-4">
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="fw-bold mb-1">{plan.name}</h5>
                      <small className="text-muted">
                        {plan.features.map((f, i) => (
                          <span key={i}><i className="bi bi-check2 text-olive me-1"></i>{f}{i < plan.features.length - 1 ? ' · ' : ''}</span>
                        ))}
                      </small>
                    </div>
                    <h3 className="fw-bold text-olive mb-0">R$ {plan.price}<small className="fs-6 text-muted">/mês</small></h3>
                  </div>
                </Card.Body>
              </Card>

              <Nav variant="pills" className="mb-4 justify-content-center gap-2">
                <Nav.Item>
                  <Nav.Link active={tab === 'credit_card'} onClick={() => setTab('credit_card')} className="rounded-pill">
                    <i className="bi bi-credit-card me-1"></i>Cartão
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link active={tab === 'boleto'} onClick={() => setTab('boleto')} className="rounded-pill">
                    <i className="bi bi-barcode me-1"></i>Boleto
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link active={tab === 'pix'} onClick={() => setTab('pix')} className="rounded-pill">
                    <i className="bi bi-qr-code me-1"></i>Pix
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              {tab === 'credit_card' && (
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">Número do Cartão</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                        className="rounded-pill ps-5"
                      />
                      <i className={`bi ${detectBrand(cardNumber)?.icon || 'bi-credit-card'} position-absolute top-50 start-0 translate-middle-y ms-3 text-muted`}></i>
                      {detectBrand(cardNumber) && (
                        <small className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted">{detectBrand(cardNumber)?.name}</small>
                      )}
                    </div>
                  </Form.Group>
                  <Row className="g-3 mb-3">
                    <Col>
                      <Form.Label className="fw-medium">Validade</Form.Label>
                      <Form.Control type="text" placeholder="MM/AA" value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} className="rounded-pill" />
                    </Col>
                    <Col>
                      <Form.Label className="fw-medium">CVV</Form.Label>
                      <Form.Control type="text" placeholder="123" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} className="rounded-pill" />
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">Nome do Titular</Form.Label>
                    <Form.Control type="text" placeholder="Como está no cartão" value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())} className="rounded-pill" />
                  </Form.Group>
                </Form>
              )}

              {tab === 'boleto' && (
                <div className="text-center py-3">
                  <i className="bi bi-barcode text-olive" style={{ fontSize: '4rem' }}></i>
                  <p className="text-muted mt-2 mb-3">Pague o boleto em qualquer banco ou lotérica</p>
                  <div className="bg-light rounded-4 p-3 mb-3">
                    <code className="text-olive" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{BOLETO_FAKE}</code>
                  </div>
                  <Button
                    variant="outline-olive"
                    className="rounded-pill"
                    onClick={() => { navigator.clipboard.writeText(BOLETO_FAKE); setCopied(true); }}
                  >
                    {copied ? <><i className="bi bi-check me-1"></i>Copiado!</> : <><i className="bi bi-clipboard me-1"></i>Copiar Código</>}
                  </Button>
                  <p className="text-muted small mt-3 mb-0">Vencimento: 3 dias úteis</p>
                </div>
              )}

              {tab === 'pix' && (
                <div className="text-center py-3">
                  <div className="mb-3 d-inline-block p-3 bg-light rounded-4">
                    <i className="bi bi-qr-code text-olive" style={{ fontSize: '8rem' }}></i>
                  </div>
                  <p className="text-muted mb-2">Escaneie o QR Code ou copie a chave Pix</p>
                  <div className="bg-light rounded-4 p-3 mb-3">
                    <code className="text-olive small" style={{ wordBreak: 'break-all' }}>{PIX_FAKE}</code>
                  </div>
                  <Button
                    variant="outline-olive"
                    className="rounded-pill"
                    onClick={() => { navigator.clipboard.writeText(PIX_FAKE); setCopied(true); }}
                  >
                    {copied ? <><i className="bi bi-check me-1"></i>Copiado!</> : <><i className="bi bi-clipboard me-1"></i>Copiar Chave Pix</>}
                  </Button>
                </div>
              )}

              {paymentError && <Alert variant="danger" className="rounded-4 py-2 mt-3">{paymentError}</Alert>}

              <Button
                variant="gold"
                className="w-100 rounded-pill mt-3"
                disabled={processing}
                onClick={handlePay}
              >
                {processing ? <><Spinner animation="border" size="sm" className="me-2" />Processando...</> : `Confirmar Pagamento - R$ ${plan.price}`}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
