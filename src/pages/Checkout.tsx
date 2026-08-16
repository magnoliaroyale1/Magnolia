import { useState } from 'react';
import { Container, Card, Row, Col, Button, Nav, Alert, Spinner, Badge } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClinicProfile } from '../hooks/useClinicProfile';
import { useCheckout } from '../hooks/useCheckout';
import { PLANS } from '../utils/constants';

export const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const clinicId = user?.clinicId || user?.uid || '';
  const { clinic } = useClinicProfile(clinicId);
  const { createCheckoutSession, processing } = useCheckout();

  const planId = searchParams.get('plan') || 'basic';
  const plan = PLANS.find(p => p.id === planId) || PLANS[0];

  const [tab, setTab] = useState<'mercadopago' | 'boleto' | 'pix'>('mercadopago');
  const [paymentError, setPaymentError] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Simulated payment flow - in production this would call a Cloud Function
  // to create a Mercado Pago preference and redirect
  const handlePay = async () => {
    setPaymentError('');
    if (!clinicId || !clinic) return;

    if (tab === 'mercadopago') {
      // For Mercado Pago: create preference via Cloud Function and redirect
      // This is a placeholder - the actual implementation would:
      // 1. Call a Cloud Function (createMercadoPagoPreference)
      // 2. Redirect to the init_point URL
      // 3. User pays on Mercado Pago's secure page
      // 4. Webhook confirms payment and updates Firestore
      
      setPaymentProcessing(true);
      try {
        // Simulate creating preference
        // In production: const { data } = await httpsCallable(functions, 'createMercadoPagoPreference')({ clinicId, planId, plan: plan.id, amount: plan.price });
        // window.location.href = data.init_point;
        
        // For now, simulate success with a mock flow
        const sessionId = await createCheckoutSession(clinicId, plan.id as any, plan.price);
        if (!sessionId) { setPaymentError('Erro ao criar sessão. Tente novamente.'); return; }

        // Mock redirect - in production this would be: window.location.href = preference.init_point
        // For demo: show success and allow manual navigation to success page
        navigate(`/dashboard/clinic/checkout/sucesso?plan=${plan.id}&method=mercadopago&session=${sessionId}`);
      } catch {
        setPaymentError('Erro ao processar pagamento. Tente novamente.');
      } finally {
        setPaymentProcessing(false);
      }
    } else if (tab === 'boleto' || tab === 'pix') {
      // For Boleto/Pix via Mercado Pago - same flow, different payment_method_id
      setPaymentProcessing(true);
      try {
        const sessionId = await createCheckoutSession(clinicId, plan.id as any, plan.price);
        if (!sessionId) { setPaymentError('Erro ao criar sessão. Tente novamente.'); return; }

        // In production: redirect to Mercado Pago with payment_method_id = 'bolbradesco' or 'pix'
        navigate(`/dashboard/clinic/checkout/sucesso?plan=${plan.id}&method=${tab}&session=${sessionId}`);
      } catch {
        setPaymentError('Erro ao processar pagamento. Tente novamente.');
      } finally {
        setPaymentProcessing(false);
      }
    }
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

              <Alert variant="info" className="rounded-4 py-3 mb-4">
                <div className="d-flex align-items-start">
                  <i className="bi bi-info-circle-fill fs-5 text-olive me-3 mt-1"></i>
                  <div>
                    <strong>Pagamento Seguro via Mercado Pago</strong>
                    <p className="mb-0 small text-muted mt-1">
                      Você será redirecionado para a página segura do Mercado Pago para concluir o pagamento.
                      Não coletamos nem armazenamos dados de cartão de crédito em nossa plataforma (conformidade PCI-DSS).
                    </p>
                  </div>
                </div>
              </Alert>

              <Nav variant="pills" className="mb-4 justify-content-center gap-2">
                <Nav.Item>
                  <Nav.Link active={tab === 'mercadopago'} onClick={() => setTab('mercadopago')} className="rounded-pill">
                    <i className="bi bi-credit-card me-1"></i>Cartão / Mercado Pago
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

              {tab === 'mercadopago' && (
                <div className="text-center py-4">
                  <i className="bi bi-credit-card-2-front text-olive" style={{ fontSize: '4rem' }}></i>
                  <h6 className="fw-bold text-olive mt-3 mb-2">Pagamento com Cartão ou Saldo Mercado Pago</h6>
                  <p className="text-muted mb-4">
                    Aceitamos Visa, Mastercard, Elo, Amex, Hipercard e saldo da conta Mercado Pago.
                    Parcelamento em até 12x (com juros da operadora).
                  </p>
                  <div className="d-flex justify-content-center gap-3 mb-4">
                    <i className="bi bi-credit-card-2-front text-muted" style={{ fontSize: '2rem' }}></i>
                    <i className="bi bi-credit-card-2-back text-muted" style={{ fontSize: '2rem' }}></i>
                    <i className="bi bi-wallet text-muted" style={{ fontSize: '2rem' }}></i>
                  </div>
                </div>
              )}

              {tab === 'boleto' && (
                <div className="text-center py-3">
                  <i className="bi bi-barcode text-olive" style={{ fontSize: '4rem' }}></i>
                  <p className="text-muted mt-2 mb-3">Pague o boleto em qualquer banco, lotérica ou app do banco</p>
                  <Alert variant="warning" className="rounded-4 py-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>Gerado via Mercado Pago</strong>
                    <p className="mb-0 small mt-2">O boleto será gerado na página segura do Mercado Pago após clicar em "Confirmar".</p>
                  </Alert>
                  <p className="text-muted small mt-3 mb-0">Vencimento: 3 dias úteis após emissão</p>
                </div>
              )}

              {tab === 'pix' && (
                <div className="text-center py-3">
                  <div className="mb-3 d-inline-block p-3 bg-light rounded-4">
                    <i className="bi bi-qr-code text-olive" style={{ fontSize: '8rem' }}></i>
                  </div>
                  <p className="text-muted mb-2">Pague com Pix pelo app do seu banco</p>
                  <Alert variant="warning" className="rounded-4 py-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>QR Code gerado via Mercado Pago</strong>
                    <p className="mb-0 small mt-2">O QR Code e a chave Pix serão exibidos na página segura do Mercado Pago.</p>
                  </Alert>
                  <p className="text-muted small">Expiração: 30 minutos após geração</p>
                </div>
              )}

              {paymentError && <Alert variant="danger" className="rounded-4 py-2 mt-3">{paymentError}</Alert>}

              <Button
                variant="gold"
                className="w-100 rounded-pill mt-3"
                disabled={paymentProcessing || processing}
                onClick={handlePay}
              >
                {paymentProcessing || processing ? (
                  <><Spinner animation="border" size="sm" className="me-2" />Processando...</>
                ) : (
                  `Confirmar e Pagar - R$ ${plan.price}`
                )}
              </Button>

              <p className="text-center text-muted small mt-3">
                Ao confirmar, você será redirecionado para o <strong>Mercado Pago</strong> (ambiente seguro, certificado PCI-DSS).
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};