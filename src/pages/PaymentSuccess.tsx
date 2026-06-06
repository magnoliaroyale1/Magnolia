import { Container, Card, Button } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PLANS } from '../utils/constants';

const METHOD_LABELS: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  boleto: 'Boleto Bancário',
  pix: 'Pix'
};

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get('plan') || 'basic';
  const method = searchParams.get('method') || '';
  const plan = PLANS.find(p => p.id === planId) || PLANS[0];

  return (
    <Container className="py-5 mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <Card className="border-0 shadow-sm text-center">
            <Card.Body className="p-5">
              <div className="mb-4">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10"
                  style={{ width: '80px', height: '80px' }}
                >
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
                </div>
              </div>
              <h3 className="font-serif fw-bold text-olive mb-2">Pagamento Confirmado!</h3>
              <p className="text-muted mb-4">Seu plano já está ativo. Aproveite todos os recursos.</p>

              <div className="bg-light rounded-4 p-4 mb-4 text-start">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Plano</span>
                  <span className="fw-bold">{plan.name}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Valor</span>
                  <span className="fw-bold">R$ {plan.price}/mês</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Forma de Pagamento</span>
                  <span className="fw-bold">{METHOD_LABELS[method] || method}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Status</span>
                  <span className="fw-bold text-success">Ativo</span>
                </div>
              </div>

              <Button variant="olive" className="rounded-pill px-5" onClick={() => navigate('/dashboard/clinic')}>
                <i className="bi bi-arrow-left me-2"></i>Voltar ao Painel
              </Button>
            </Card.Body>
          </Card>
        </div>
      </div>
    </Container>
  );
};
