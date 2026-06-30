import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ProgressBar } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { PROCEDURES_LIST, BRAZIL_STATES } from '../utils/constants';
import type { Clinic } from '../types';

export const RegisterClinic = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    street: '',
    number: '',
    city: '',
    state: '',
    zipCode: '',
    neighborhood: '',
    description: '',
    otherProcedure: '',
    agreeTerms: false,
    procedures: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return setError('As senhas não coincidem');
    }
    if (!formData.agreeTerms) {
      return setError('Você precisa aceitar os Termos de Uso e a Política de Privacidade.');
    }

    try {
      setError('');
      setLoading(true);

      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(user, { displayName: formData.name });
      await sendEmailVerification(user);

      // Processar procedimentos (incluindo "Outros")
      const finalProcedures = formData.procedures.includes('Outros') && formData.otherProcedure
        ? [...formData.procedures.filter(p => p !== 'Outros'), formData.otherProcedure]
        : formData.procedures.filter(p => p !== 'Outros');

      const clinicData = {
        name: formData.name,
        cnpj: formData.cnpj,
        email: formData.email,
        phone: formData.phone,
        status: 'pending',
        approved: false,
        address: {
          street: formData.street,
          number: formData.number,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          neighborhood: formData.neighborhood
        },
        procedures: finalProcedures,
        description: formData.description,
        rating: 0,
        reviewCount: 0,
        verified: false,
        score: 0,
        images: [],
        plan: 'basic',
        ownerId: user.uid,
        createdAt: Timestamp.now()
      };

      await setDoc(doc(db, 'clinics', user.uid), clinicData);
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: formData.email,
        displayName: formData.name,
        role: 'clinic',
        clinicId: user.uid,
        emailVerified: false,
        createdAt: new Date()
      });

      navigate('/verify-email');
    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'Este e-mail já está em uso.',
        'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
        'auth/invalid-email': 'E-mail inválido.',
      };
      setError(messages[err.code] || 'Erro ao cadastrar clínica. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const toggleProcedure = (proc: string) => {
    setFormData(prev => ({
      ...prev,
      procedures: prev.procedures.includes(proc)
        ? prev.procedures.filter(p => p !== proc)
        : [...prev.procedures, proc]
    }));
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <i className="bi bi-building-add text-olive fs-1"></i>
                <h2 className="font-serif fw-bold text-olive mt-2">Cadastrar Clínica</h2>
                <p className="text-muted">Junte-se à rede premium de estética</p>
              </div>

              <ProgressBar now={(step / 3) * 100} className="mb-4" variant="gold" />

              {error && <Alert variant="danger" className="rounded-4">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                {step === 1 && (
                  <>
                    <h5 className="font-serif text-olive mb-3">Dados da Empresa</h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Razão Social *</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="rounded-pill"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">CNPJ *</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="00.000.000/0000-00"
                            value={formData.cnpj}
                            onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                            className="rounded-pill"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">E-mail *</Form.Label>
                          <Form.Control
                            type="email"
                            placeholder="contato@clinica.com"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="rounded-pill"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Telefone *</Form.Label>
                          <Form.Control
                            type="tel"
                            placeholder="(11) 99999-9999"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="rounded-pill"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Senha *</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            className="rounded-pill"
                            required
                            minLength={6}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Confirmar Senha *</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Repita a senha"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                            className="rounded-pill"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h5 className="font-serif text-olive mb-3">Endereço Completo</h5>
                    <Row>
                      <Col md={8}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Rua *</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.street}
                            onChange={(e) => setFormData({...formData, street: e.target.value})}
                            className="rounded-pill"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Número *</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.number}
                            onChange={(e) => setFormData({...formData, number: e.target.value})}
                            className="rounded-pill"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Bairro *</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.neighborhood}
                            onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                            className="rounded-pill"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">CEP</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="00000-000"
                            value={formData.zipCode}
                            onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                            className="rounded-pill"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Cidade *</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                            className="rounded-pill"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Estado *</Form.Label>
                          <Form.Select
                            value={formData.state}
                            onChange={(e) => setFormData({...formData, state: e.target.value})}
                            className="rounded-pill"
                            required
                          >
                            <option value="">Selecione</option>
                            {BRAZIL_STATES.map(state => (
                              <option key={state.value} value={state.value}>{state.label}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h5 className="font-serif text-olive mb-3">Especialidades e Serviços</h5>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">Descrição da Clínica *</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Descreva sua clínica, diferenciais, experiência..."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="rounded-4"
                        required
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">Procedimentos Oferecidos *</Form.Label>
                      <div className="d-flex flex-wrap gap-3">
                        {PROCEDURES_LIST.map(proc => (
                          <Button
                            key={proc}
                            variant={formData.procedures.includes(proc) ? 'olive' : 'outline-olive'}
                            className="rounded-pill"
                            onClick={() => toggleProcedure(proc)}
                          >
                            {proc === 'Outros' && <i className="bi bi-plus-circle me-2"></i>}
                            {proc}
                          </Button>
                        ))}
                      </div>
                    </Form.Group>

                    {/* CAMPO OUTROS - Aparece quando selecionado */}
                    {formData.procedures.includes('Outros') && (
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">Qual outro procedimento? *</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Ex: Radiofrequência, Drenagem Linfática..."
                          value={formData.otherProcedure}
                          onChange={(e) => setFormData({...formData, otherProcedure: e.target.value})}
                          className="rounded-pill"
                          required
                        />
                      </Form.Group>
                    )}
                    <Form.Check
                      type="checkbox"
                      id="clinicAgreeTerms"
                      className="mb-3"
                      label={
                        <span className="small">
                          Aceito os <Link to="/termos" target="_blank" className="text-gold">Termos de Uso</Link> e a{' '}
                          <Link to="/privacidade" target="_blank" className="text-gold">Política de Privacidade</Link>
                        </span>
                      }
                      checked={formData.agreeTerms || false}
                      onChange={e => setFormData(prev => ({ ...prev, agreeTerms: e.target.checked }))}
                      required
                    />
                  </>
                )}

                <div className="d-flex justify-content-between mt-4">
                  {step > 1 && (
                    <Button variant="outline-secondary" className="rounded-pill" onClick={() => setStep(step - 1)}>
                      <i className="bi bi-arrow-left me-2"></i>Voltar
                    </Button>
                  )}
                  {step < 3 ? (
                    <Button 
                      variant="olive" 
                      className="rounded-pill ms-auto" 
                      onClick={() => {
                        if (step === 1 && (!formData.name || !formData.email || !formData.password || !formData.confirmPassword)) {
                          return setError('Preencha todos os campos obrigatórios');
                        }
                        if (step === 2 && (!formData.street || !formData.city || !formData.state)) {
                          return setError('Preencha todos os campos obrigatórios');
                        }
                        setError('');
                        setStep(step + 1);
                      }}
                    >
                      Próximo <i className="bi bi-arrow-right ms-2"></i>
                    </Button>
                  ) : (
                    <Button 
                      variant="gold" 
                      className="rounded-pill ms-auto" 
                      type="submit" 
                      disabled={loading || formData.procedures.length === 0 || !formData.agreeTerms}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          Finalizar Cadastro
                        </>
                      )}
                    </Button>
                  )}
                </div>
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