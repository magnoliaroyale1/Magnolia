import { Modal, Card, Row, Col, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { PLANS } from '../utils/constants';

interface UpgradeModalProps {
  show: boolean;
  onHide: () => void;
  currentPlan: string;
}

export const UpgradeModal = ({ show, onHide, currentPlan }: UpgradeModalProps) => {
  const navigate = useNavigate();

  const planOrder = ['basic', 'professional', 'premium'];
  const currentIdx = planOrder.indexOf(currentPlan);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="font-serif text-olive">Fazer Upgrade</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <p className="text-muted mb-4">Escolha o plano ideal para sua clínica</p>
        <Row className="g-3">
          {PLANS.map((plan) => {
            const planIdx = planOrder.indexOf(plan.id);
            const isCurrent = plan.id === currentPlan;
            const isDowngrade = planIdx < currentIdx;

            return (
              <Col md={4} key={plan.id}>
                <Card
                  className={`h-100 text-center ${isCurrent ? 'border-gold border-2' : 'border-0 shadow-sm'}`}
                  style={{ opacity: isDowngrade ? 0.5 : 1 }}
                >
                  {plan.popular && (
                    <div className="position-absolute top-0 start-50 translate-middle">
                      <Badge bg="gold" className="rounded-pill px-3 py-2">Mais Popular</Badge>
                    </div>
                  )}
                  <Card.Body className="p-4 d-flex flex-column">
                    <h5 className="font-serif fw-bold mb-1" style={{ color: isCurrent ? 'var(--gold)' : 'var(--olive)' }}>
                      {plan.name}
                    </h5>
                    {isCurrent && <Badge bg="gold" className="rounded-pill mb-2" style={{ fontSize: '10px' }}>Plano Atual</Badge>}
                    <h3 className="fw-bold mb-3">R$ {plan.price}<small className="fs-6 text-muted">/mês</small></h3>
                    <ul className="list-unstyled mb-4 flex-grow-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="mb-2 small"><i className="bi bi-check2 text-olive me-2"></i>{f}</li>
                      ))}
                    </ul>
                    <Button
                      variant={isCurrent ? 'outline-secondary' : 'gold'}
                      className="rounded-pill w-100"
                      disabled={isCurrent || isDowngrade}
                      onClick={() => {
                        onHide();
                        navigate(`/dashboard/clinic/checkout?plan=${plan.id}`);
                      }}
                    >
                      {isCurrent ? 'Plano Atual' : isDowngrade ? 'Indisponível' : 'Escolher Plano'}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Modal.Body>
    </Modal>
  );
};
