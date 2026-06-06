import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, ProgressBar, Alert, Row, Col, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClinicAssessment, INITIAL_ASSESSMENT, type AssessmentData } from '../hooks/useClinicAssessment';
import { useUploadClinicImages } from '../hooks/useUploadImage';
import { useClinicProfile } from '../hooks/useClinicProfile';

const EQUIPAMENTOS = [
  'Laser Fracionado', 'Laser CO2', 'Laser Nd:YAG', 'LED Terapia',
  'Microagulhamento', 'Radiofrequência', 'Ultrassom Microfocado',
  'Criolipólise', 'Hidrafacial', 'Peeling Químico', 'Botox',
  'Preenchedores', 'Mesa Cirúrgica', 'Autoclave', 'Esterilizador'
];

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export const QuestionarioClinica = () => {
  const { user } = useAuth();
  const clinicId = user?.clinicId || user?.uid || '';
  const { saveAssessment, saving } = useClinicAssessment(clinicId);
  const { uploadClinicImage, uploading } = useUploadClinicImages();
  const { clinic } = useClinicProfile(clinicId);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<AssessmentData>(INITIAL_ASSESSMENT);

  useEffect(() => {
    if (clinic?.assessmentCompleted) {
      navigate('/dashboard/clinic');
    }
  }, [clinic]);

  const updateDoc = (field: keyof AssessmentData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const addProfissional = () => {
    setData(prev => ({
      ...prev,
      profissionais: {
        ...prev.profissionais,
        quantidade: prev.profissionais.quantidade + 1,
        lista: [...prev.profissionais.lista, { nome: '', certificacao: '', certificadoFile: '' }]
      }
    }));
  };

  const updateProfissional = (index: number, field: string, value: string) => {
    setData(prev => {
      const lista = [...prev.profissionais.lista];
      lista[index] = { ...lista[index], [field]: value };
      return { ...prev, profissionais: { ...prev.profissionais, lista } };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadClinicImage(file, `assessments/${clinicId}`);
    if (url) {
      setData(prev => ({ ...prev, estrutura: { ...prev.estrutura, fotos: [...prev.estrutura.fotos, url] } }));
    }
  };

  const toggleDia = (dia: string) => {
    setData(prev => {
      const dias = prev.horarios.diasSemana.includes(dia)
        ? prev.horarios.diasSemana.filter(d => d !== dia)
        : [...prev.horarios.diasSemana, dia];
      return { ...prev, horarios: { ...prev.horarios, diasSemana: dias } };
    });
  };

  const toggleEquipamento = (eq: string) => {
    setData(prev => {
      const equipamentos = prev.estrutura.equipamentos.includes(eq)
        ? prev.estrutura.equipamentos.filter(e => e !== eq)
        : [...prev.estrutura.equipamentos, eq];
      return { ...prev, estrutura: { ...prev.estrutura, equipamentos } };
    });
  };

  const handleSubmit = async () => {
    const success = await saveAssessment({ ...data, status: 'completed' });
    if (success) {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard/clinic'), 2000);
    } else {
      setError('Erro ao salvar. Tente novamente.');
    }
  };

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const canGoNext = (): boolean => {
    switch (step) {
      case 1: return (data.documentacao.registroVigilancia?.length ?? 0) > 0;
      case 2: return data.profissionais.lista.every(p => p.nome && p.certificacao);
      case 3: return data.estrutura.equipamentos.length > 0;
      case 4: return data.horarios.diasSemana.length > 0 && data.horarios.abertura.length > 0;
      default: return true;
    }
  };

  return (
    <Container className="py-5 mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <i className="bi bi-clipboard-check text-olive fs-1"></i>
                <h3 className="font-serif fw-bold text-olive mt-2">Avaliação da Clínica</h3>
                <p className="text-muted">Preencha os dados para análise da nossa equipe</p>
              </div>

              <ProgressBar now={progress} variant="gold" className="mb-4" style={{ height: '8px' }} />
              <div className="text-center mb-4 text-muted small">Passo {step} de {totalSteps}</div>

              {error && <Alert variant="danger" className="rounded-4">{error}</Alert>}
              {success && <Alert variant="success" className="rounded-4">Questionário enviado com sucesso! Redirecionando...</Alert>}

              {step === 1 && (
                <>
                  <h5 className="font-serif fw-bold text-olive mb-4">
                    <i className="bi bi-file-earmark-text me-2"></i>Documentação
                  </h5>
                  <Form.Group className="mb-3">
                    <Form.Label>CNPJ (arquivo)</Form.Label>
                    <Form.Control type="file" accept=".pdf,.jpg,.png" className="rounded-pill" />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Alvará de Funcionamento</Form.Label>
                    <Form.Control type="file" accept=".pdf,.jpg,.png" className="rounded-pill" />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Licença Sanitária</Form.Label>
                    <Form.Control type="file" accept=".pdf,.jpg,.png" className="rounded-pill" />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Registro na Vigilância Sanitária</Form.Label>
                    <Form.Control
                      type="text"
                      value={data.documentacao.registroVigilancia}
                      onChange={(e) => updateDoc('documentacao', { ...data.documentacao, registroVigilancia: e.target.value })}
                      className="rounded-pill"
                      placeholder="Número do registro"
                    />
                  </Form.Group>
                </>
              )}

              {step === 2 && (
                <>
                  <h5 className="font-serif fw-bold text-olive mb-4">
                    <i className="bi bi-people me-2"></i>Profissionais
                  </h5>
                  {data.profissionais.lista.map((prof, idx) => (
                    <div key={idx} className="mb-4 p-3 bg-light rounded-4">
                      <h6 className="fw-bold text-olive mb-3">Profissional {idx + 1}</h6>
                      <Form.Group className="mb-2">
                        <Form.Label className="small">Nome completo</Form.Label>
                        <Form.Control
                          type="text"
                          value={prof.nome}
                          onChange={(e) => updateProfissional(idx, 'nome', e.target.value)}
                          className="rounded-pill"
                          placeholder="Nome do profissional"
                        />
                      </Form.Group>
                      <Form.Group className="mb-2">
                        <Form.Label className="small">Certificação / Especialidade</Form.Label>
                        <Form.Control
                          type="text"
                          value={prof.certificacao}
                          onChange={(e) => updateProfissional(idx, 'certificacao', e.target.value)}
                          className="rounded-pill"
                          placeholder="Ex: Dermatologista - CRM 12345"
                        />
                      </Form.Group>
                      <Form.Group>
                        <Form.Label className="small">Certificado (arquivo)</Form.Label>
                        <Form.Control type="file" accept=".pdf,.jpg,.png" className="rounded-pill" />
                      </Form.Group>
                    </div>
                  ))}
                  <Button variant="outline-olive" className="rounded-pill" onClick={addProfissional}>
                    <i className="bi bi-plus-lg me-1"></i>Adicionar Profissional
                  </Button>
                </>
              )}

              {step === 3 && (
                <>
                  <h5 className="font-serif fw-bold text-olive mb-4">
                    <i className="bi bi-building me-2"></i>Estrutura
                  </h5>
                  <Form.Group className="mb-3">
                    <Form.Label>Fotos do Espaço</Form.Label>
                    <div className="d-flex gap-2 flex-wrap mb-2">
                      {data.estrutura.fotos.map((foto, idx) => (
                        <img key={idx} src={foto} className="rounded-3" style={{ width: '100px', height: '80px', objectFit: 'cover' }} />
                      ))}
                    </div>
                    <Form.Control type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="rounded-pill" />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Equipamentos Disponíveis</Form.Label>
                    <div className="d-flex gap-2 flex-wrap">
                      {EQUIPAMENTOS.map(eq => (
                        <Badge
                          key={eq}
                          bg={data.estrutura.equipamentos.includes(eq) ? 'olive' : 'light'}
                          text={data.estrutura.equipamentos.includes(eq) ? 'white' : 'dark'}
                          className="rounded-pill px-3 py-2"
                          style={{ cursor: 'pointer' }}
                          onClick={() => toggleEquipamento(eq)}
                        >
                          {eq}
                        </Badge>
                      ))}
                    </div>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Metragem do espaço (m²)</Form.Label>
                    <Form.Control
                      type="number"
                      value={data.estrutura.metragem}
                      onChange={(e) => updateDoc('estrutura', { ...data.estrutura, metragem: e.target.value })}
                      className="rounded-pill"
                      placeholder="Ex: 200"
                    />
                  </Form.Group>
                </>
              )}

              {step === 4 && (
                <>
                  <h5 className="font-serif fw-bold text-olive mb-4">
                    <i className="bi bi-clock me-2"></i>Horários de Funcionamento
                  </h5>
                  <Form.Group className="mb-3">
                    <Form.Label>Dias de Funcionamento</Form.Label>
                    <div className="d-flex gap-2 flex-wrap">
                      {DIAS_SEMANA.map(dia => (
                        <Badge
                          key={dia}
                          bg={data.horarios.diasSemana.includes(dia) ? 'olive' : 'light'}
                          text={data.horarios.diasSemana.includes(dia) ? 'white' : 'dark'}
                          className="rounded-pill px-3 py-2"
                          style={{ cursor: 'pointer' }}
                          onClick={() => toggleDia(dia)}
                        >
                          {dia}
                        </Badge>
                      ))}
                    </div>
                  </Form.Group>
                  <Row className="g-3 mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Horário de Abertura</Form.Label>
                        <Form.Control
                          type="time"
                          value={data.horarios.abertura}
                          onChange={(e) => updateDoc('horarios', { ...data.horarios, abertura: e.target.value })}
                          className="rounded-pill"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Horário de Fechamento</Form.Label>
                        <Form.Control
                          type="time"
                          value={data.horarios.fechamento}
                          onChange={(e) => updateDoc('horarios', { ...data.horarios, fechamento: e.target.value })}
                          className="rounded-pill"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Check
                    type="switch"
                    label="Atende finais de semana?"
                    checked={data.horarios.atendeFimSemana}
                    onChange={(e) => updateDoc('horarios', { ...data.horarios, atendeFimSemana: e.target.checked })}
                  />
                </>
              )}

              <div className="d-flex justify-content-between mt-4">
                <Button
                  variant="outline-olive"
                  className="rounded-pill"
                  onClick={() => setStep(step - 1)}
                  disabled={step === 1}
                >
                  <i className="bi bi-arrow-left me-1"></i>Voltar
                </Button>
                {step < totalSteps ? (
                  <Button
                    variant="olive"
                    className="rounded-pill"
                    onClick={() => setStep(step + 1)}
                    disabled={!canGoNext()}
                  >
                    Próximo<i className="bi bi-arrow-right ms-1"></i>
                  </Button>
                ) : (
                  <Button
                    variant="gold"
                    className="rounded-pill"
                    onClick={handleSubmit}
                    disabled={saving || !canGoNext()}
                  >
                    {saving ? 'Enviando...' : 'Enviar para Análise'}
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
