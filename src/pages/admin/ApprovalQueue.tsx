import { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Modal, Form } from 'react-bootstrap';
import { AdminSidebar } from '../../components/AdminSidebar';
import { usePendingClinics } from '../../hooks/useAdmin';

type ActionType = 'approve' | 'reject' | 'requestInfo' | null;

export const ApprovalQueue = () => {
  const { clinics, loading, approveClinic, rejectClinic, requestInfo } = usePendingClinics();
  const [showModal, setShowModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<{ id: string; name: string } | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [feedback, setFeedback] = useState('');
  const [processing, setProcessing] = useState(false);

  const openModal = (clinicId: string, clinicName: string, action: ActionType) => {
    setSelectedClinic({ id: clinicId, name: clinicName });
    setActionType(action);
    setFeedback('');
    setShowModal(true);
  };

  const handleConfirm = async () => {
    if (!selectedClinic) return;
    setProcessing(true);
    try {
      if (actionType === 'approve') {
        await approveClinic(selectedClinic.id, feedback);
      } else if (actionType === 'reject') {
        await rejectClinic(selectedClinic.id, feedback || 'Agradecemos o interesse, porém a empresa não foi aprovada em nosso processo de validação.');
      } else if (actionType === 'requestInfo') {
        await requestInfo(selectedClinic.id, feedback);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error processing:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Container className="py-5">
      <Row>
        <Col md={3}>
          <AdminSidebar />
        </Col>
        <Col md={9}>
          <h2 className="font-serif fw-bold text-olive mb-4">Fila de Aprovação</h2>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-olive" role="status"></div>
            </div>
          ) : clinics.length === 0 ? (
            <Alert variant="info" className="rounded-4">
              <i className="bi bi-check-circle me-2"></i>
              Nenhuma clínica pendente de aprovação.
            </Alert>
          ) : (
            <Row className="g-4">
              {clinics.map((clinic) => (
                <Col md={6} key={clinic.id}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body className="p-4" style={{ minWidth: 0 }}>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="overflow-hidden">
                          <h5 className="font-serif fw-bold text-olive text-truncate" title={clinic.name}>{clinic.name}</h5>
                          <p className="text-muted mb-1 small text-truncate" title={`${clinic.address?.city}, ${clinic.address?.state}`}>
                            <i className="bi bi-geo-alt me-2"></i>
                            {clinic.address?.city}, {clinic.address?.state}
                          </p>
                          <p className="text-muted mb-0 small text-truncate" title={clinic.email}>
                            <i className="bi bi-envelope me-2"></i>
                            {clinic.email}
                          </p>
                          <small className="text-muted text-truncate d-block" title={`CNPJ: ${clinic.cnpj}`}>
                            <i className="bi bi-file-earmark-text me-1"></i>
                            CNPJ: {clinic.cnpj}
                          </small>
                        </div>
                        <Badge bg="warning" className="rounded-pill">Pendente</Badge>
                      </div>

                      <p className="text-muted text-break-word">{clinic.description?.substring(0, 100)}...</p>

                      {clinic.adminFeedback && (
                        <div className="p-3 bg-light rounded-4 mb-3">
                          <small className="text-muted fw-bold">Feedback anterior:</small>
                          <p className="mb-0 mt-1 small">{clinic.adminFeedback}</p>
                        </div>
                      )}

                      <div className="d-flex gap-2 mt-3">
                        <Button
                          variant="success"
                          className="rounded-pill flex-grow-1"
                          onClick={() => openModal(clinic.id, clinic.name, 'approve')}
                        >
                          <i className="bi bi-check-lg me-2"></i>
                          Aprovar
                        </Button>
                        <Button
                          variant="warning"
                          className="rounded-pill flex-grow-1 text-white"
                          onClick={() => openModal(clinic.id, clinic.name, 'requestInfo')}
                        >
                          <i className="bi bi-pencil me-2"></i>
                          Solicitar Info
                        </Button>
                        <Button
                          variant="outline-danger"
                          className="rounded-pill flex-grow-1"
                          onClick={() => openModal(clinic.id, clinic.name, 'reject')}
                        >
                          <i className="bi bi-x-lg me-2"></i>
                          Rejeitar
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-serif text-olive">
            {actionType === 'approve' ? 'Aprovar Clínica' : actionType === 'reject' ? 'Rejeitar Clínica' : 'Solicitar Informações'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            {actionType === 'approve'
              ? `Confirmar aprovação da clínica "${selectedClinic?.name}"?`
              : actionType === 'reject'
                ? `Rejeitar a clínica "${selectedClinic?.name}"?`
                : `Solicitar informações adicionais para "${selectedClinic?.name}"?`}
          </p>
          <Form.Group>
            <Form.Label className="fw-medium">
              {actionType === 'approve'
                ? 'Mensagem opcional para a clínica'
                : 'Feedback detalhado (será enviado por e-mail)'}
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="rounded-4"
              placeholder={
                actionType === 'reject'
                  ? 'Agradecemos o interesse, porém a empresa não foi aprovada em nosso processo de validação.'
                  : actionType === 'requestInfo'
                    ? 'Descreva quais informações ou documentos adicionais são necessários...'
                    : 'Mensagem opcional de boas-vindas...'
              }
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" className="rounded-pill" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button
            variant={actionType === 'approve' ? 'success' : actionType === 'reject' ? 'danger' : 'warning'}
            className="rounded-pill"
            onClick={handleConfirm}
            disabled={processing || (actionType !== 'approve' && !feedback.trim())}
          >
            {processing ? 'Processando...' : 'Confirmar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};
