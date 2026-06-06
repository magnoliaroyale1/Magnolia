import { Container, Row, Col, Button, Card, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClinics } from '../hooks/useClinics';
import { ClinicCard } from '../components/ClinicCard';

export const Home = () => {
  const { clinics, loading } = useClinics();
  const { user } = useAuth();
  const navigate = useNavigate();
  const featuredClinics = clinics.slice(0, 3);

  const handlePlanClick = (planId: string) => {
    if (!user || user.role === 'client' || user.role === 'admin' || user.role === 'professional') {
      navigate('/register-clinic');
    } else if (user.role === 'clinic') {
      navigate(`/dashboard/clinic/checkout?plan=${planId}`);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-olive text-white py-5">
        <Container className="py-5">
          <Row className="align-items-center">
            <Col lg={6}>
              <Badge bg="light" text="dark" className="mb-3 rounded-pill px-3">
                Premium Aesthetic Platform
              </Badge>
              <h1 className="font-serif display-4 fw-bold mb-4">
                Encontre as Melhores Clínicas de Estética
              </h1>
              <p className="lead mb-4 opacity-75">
                Conectamos você aos melhores profissionais de estética premium. 
                Avaliações verificadas, agendamento fácil e resultados extraordinários.
              </p>
              <div className="d-flex gap-3">
                <Link to="/clinics">
                  <Button size="lg" variant="gold" className="rounded-pill px-5">
                    Explorar Clínicas
                  </Button>
                </Link>
                <Link to="/register-clinic">
                  <Button size="lg" variant="outline-light" className="rounded-pill px-5">
                    Sou Clínica
                  </Button>
                </Link>
              </div>
            </Col>
            <Col lg={6} className="mt-5 mt-lg-0">
              <div className="position-relative">
                <div className="bg-gold rounded-4 position-absolute top-0 end-0 w-100 h-100" style={{ transform: 'translate(20px, 20px)' }}></div>
                <img 
                  src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800" 
                  alt="Clinic" 
                  className="rounded-4 shadow-lg position-relative w-100"
                  style={{ zIndex: 1, height: '400px', objectFit: 'cover' }}
                />
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Stats Section */}
      <Container className="py-5">
        <Row className="g-4">
          <Col md={3}>
            <Card className="text-center border-0 h-100">
              <Card.Body className="p-4">
                <i className="bi bi-building text-gold fs-1 mb-3"></i>
                <h3 className="font-serif fw-bold text-olive">500+</h3>
                <p className="text-muted mb-0">Clínicas Parceiras</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 h-100">
              <Card.Body className="p-4">
                <i className="bi bi-star-fill text-gold fs-1 mb-3"></i>
                <h3 className="font-serif fw-bold text-olive">10k+</h3>
                <p className="text-muted mb-0">Avaliações</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 h-100">
              <Card.Body className="p-4">
                <i className="bi bi-people text-gold fs-1 mb-3"></i>
                <h3 className="font-serif fw-bold text-olive">50k+</h3>
                <p className="text-muted mb-0">Clientes Satisfeitos</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 h-100">
              <Card.Body className="p-4">
                <i className="bi bi-shield-check text-gold fs-1 mb-3"></i>
                <h3 className="font-serif fw-bold text-olive">100%</h3>
                <p className="text-muted mb-0">Clínicas Verificadas</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Featured Clinics */}
      <div className="bg-white py-5">
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="font-serif fw-bold text-olive">Clínicas em Destaque</h2>
              <p className="text-muted mb-0">As mais bem avaliadas da plataforma</p>
            </div>
            <Link to="/clinics">
              <Button variant="outline-olive" className="rounded-pill px-4">
                Ver todas <i className="bi bi-arrow-right ms-2"></i>
              </Button>
            </Link>
          </div>
          
          <Row className="g-4">
            {loading ? (
              <Col className="text-center py-5">
                <div className="spinner-border text-olive" role="status">
                  <span className="visually-hidden">Carregando...</span>
                </div>
              </Col>
            ) : (
              featuredClinics.map(clinic => (
                <Col md={4} key={clinic.id}>
                  <ClinicCard clinic={clinic} />
                </Col>
              ))
            )}
          </Row>
        </Container>
      </div>

      {/* Plans Section */}
      <Container className="py-5">
        <div className="text-center mb-5">
          <h2 className="font-serif fw-bold text-olive">Planos para Clínicas</h2>
          <p className="text-muted">Escolha o melhor plano para sua clínica</p>
        </div>
        
        <Row className="g-4 justify-content-center">
          <Col md={4}>
            <Card className="h-100 border-0">
              <Card.Body className="p-5 text-center">
                <h4 className="font-serif text-muted mb-3">Básico</h4>
                <h2 className="font-serif fw-bold text-olive mb-4">R$ 97<small className="fs-6">/mês</small></h2>
                <ul className="list-unstyled mb-4">
                  <li className="mb-2"><i className="bi bi-check2 text-olive me-2"></i>Perfil básico</li>
                  <li className="mb-2"><i className="bi bi-check2 text-olive me-2"></i>Até 5 fotos</li>
                  <li className="mb-2"><i className="bi bi-check2 text-olive me-2"></i>Agendamentos</li>
                </ul>
                <Button variant="gold" className="w-100 rounded-pill" onClick={() => handlePlanClick('basic')}>Começar</Button>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="h-100 border-gold border-2 position-relative">
              <div className="position-absolute top-0 start-50 translate-middle">
                <Badge bg="gold" className="rounded-pill px-3 py-2">Mais Popular</Badge>
              </div>
              <Card.Body className="p-5 text-center">
                <h4 className="font-serif text-gold mb-3">Profissional</h4>
                <h2 className="font-serif fw-bold text-olive mb-4">R$ 197<small className="fs-6">/mês</small></h2>
                <ul className="list-unstyled mb-4">
                  <li className="mb-2"><i className="bi bi-check2 text-olive me-2"></i>Tudo do Básico</li>
                  <li className="mb-2"><i className="bi bi-check2 text-olive me-2"></i>Fotos ilimitadas</li>
                  <li className="mb-2"><i className="bi bi-check2 text-olive me-2"></i>Chat com clientes</li>
                  <li className="mb-2"><i className="bi bi-check2 text-olive me-2"></i>Destaque nas buscas</li>
                </ul>
                <Button variant="gold" className="w-100 rounded-pill" onClick={() => handlePlanClick('professional')}>Começar</Button>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="h-100 border-0">
              <Card.Body className="p-5 text-center">
                <h4 className="font-serif text-muted mb-3">Premium</h4>
                <h2 className="font-serif fw-bold text-olive mb-4">R$ 397<small className="fs-6">/mês</small></h2>
                <ul className="list-unstyled mb-4">
                  <li className="mb-2"><i className="bi bi-check2 text-olive me-2"></i>Tudo do Profissional</li>
                  <li className="mb-2"><i className="bi bi-check2 text-olive me-2"></i>Verificação prioritária</li>
                  <li className="mb-2"><i className="bi bi-check2 text-olive me-2"></i>Blog da clínica</li>
                  <li className="mb-2"><i className="bi bi-check2 text-olive me-2"></i>Suporte VIP</li>
                </ul>
                <Button variant="gold" className="w-100 rounded-pill" onClick={() => handlePlanClick('premium')}>Começar</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};