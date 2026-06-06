import { useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form, Alert } from 'react-bootstrap';
import { AdminSidebar } from '../../components/AdminSidebar';
import { useApprovedClinics } from '../../hooks/useAdmin';
import { useVerification, type VerificationCriteria } from '../../hooks/useVerification';
import type { Clinic } from '../../types';

export const AdminClinicsList = () => {
  const { clinics, loading } = useApprovedClinics();
  const { updateVerification, updating } = useVerification();

  const [showModal, setShowModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [criteria, setCriteria] = useState<VerificationCriteria>({
    documentacaoValida: false,
    profissionaisQualificados: false,
    boasAvaliacoes: false,
    assessmentCompleto: false
  });
  const [successMsg, setSuccessMsg] = useState('');

  const openModal = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setCriteria({
      documentacaoValida: clinic.verified || false,
      profissionaisQualificados: clinic.verified || false,
      boasAvaliacoes: clinic.verified || false,
      assessmentCompleto: clinic.verified || false
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedClinic) return;
    const success = await updateVerification(selectedClinic.id, criteria, selectedClinic);
    if (success) {
      setSuccessMsg(`Verificação atualizada para "${selectedClinic.name}"`);
      setTimeout(() => { setSuccessMsg(''); setShowModal(false); }, 2000);
    }
  };

  const allMet = criteria.documentacaoValida && criteria.profissionaisQualificados
    && criteria.boasAvaliacoes && criteria.assessmentCompleto;

  return (
    <Container className="py-5">
      <Row>
        <Col md={3}>
          <AdminSidebar />
        </Col>
        <Col md={9}>
          <h2 className="font-serif fw-bold text-olive mb-4">Clínicas Aprovadas</h2>
          {successMsg && <Alert variant="success" className="rounded-4">{successMsg}</Alert>}

          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-olive" role="status"></div>
                </div>
              ) : (
                <Table hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>ID</th>
                      <th>Nome</th>
                      <th>Cidade</th>
                      <th>Status</th>
                      <th>Verificado</th>
                      <th>Plano</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {clinics.map((clinic) => (
                      <tr key={clinic.id}>
                        <td><code className="small">{clinic.id.substring(0, 8)}...</code></td>
                        <td className="fw-medium text-truncate" style={{ maxWidth: '200px' }}>{clinic.name}</td>
                        <td>{clinic.address?.city}</td>
                        <td>
                          <Badge bg="success" className="rounded-pill">Aprovada</Badge>
                        </td>
                        <td>
                          {clinic.verified ? (
                            <Badge bg="gold" text="white" className="rounded-pill">
                              <i className="bi bi-patch-check-fill me-1"></i>Verificada
                            </Badge>
                          ) : (
                            <Badge bg="light" text="dark" className="rounded-pill">Pendente</Badge>
                          )}
                        </td>
                        <td>
                          <Badge bg="light" text="dark" className="rounded-pill text-capitalize">
                            {clinic.plan}
                          </Badge>
                        </td>
                        <td>
                          <Button variant="outline-olive" size="sm" className="rounded-pill" onClick={() => openModal(clinic)}>
                            Verificar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-serif text-olive">
            Verificar Clínica: {selectedClinic?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            Marque os critérios atendidos pela clínica. Todos precisam estar ok para conceder o selo "Clínica Verificada".
          </p>
          <Form.Group className="mb-3">
            <Form.Check
              type="switch"
              label="Documentação válida (CNPJ, alvará, licença sanitária)"
              checked={criteria.documentacaoValida}
              onChange={(e) => setCriteria(prev => ({ ...prev, documentacaoValida: e.target.checked }))}
            />
            <Form.Check
              type="switch"
              label="Profissionais qualificados (certificações, registros)"
              checked={criteria.profissionaisQualificados}
              onChange={(e) => setCriteria(prev => ({ ...prev, profissionaisQualificados: e.target.checked }))}
            />
            <Form.Check
              type="switch"
              label="Boas avaliações (média superior a 4.0)"
              checked={criteria.boasAvaliacoes}
              onChange={(e) => setCriteria(prev => ({ ...prev, boasAvaliacoes: e.target.checked }))}
            />
            <Form.Check
              type="switch"
              label="Questionário de avaliação completo"
              checked={criteria.assessmentCompleto}
              onChange={(e) => setCriteria(prev => ({ ...prev, assessmentCompleto: e.target.checked }))}
            />
          </Form.Group>
          <div className={`p-3 rounded-4 ${allMet ? 'bg-success text-white' : 'bg-light'}`}>
            <strong>
              {allMet
                ? '✓ Todos os critérios atendidos — selo será concedido!'
                : 'Atenda todos os critérios para conceder o selo'}
            </strong>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" className="rounded-pill" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button
            variant={allMet ? 'gold' : 'olive'}
            className="rounded-pill"
            onClick={handleSave}
            disabled={updating}
          >
            {updating ? 'Salvando...' : allMet ? 'Conceder Selo' : 'Salvar Critérios'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};
