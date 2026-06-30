import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-olive text-white py-5 mt-5">
      <Container>
        <Row className="g-4">
          <Col md={4}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-flower1 fs-3"></i>
              <span className="font-serif fw-bold fs-4">Magnolia Royale</span>
            </div>
            <p className="opacity-75 small">
              Conectando você às melhores clínicas de estética premium do Brasil.
            </p>
          </Col>
          <Col md={2}>
            <h6 className="fw-bold mb-3">Plataforma</h6>
            <div className="d-flex flex-column gap-2">
              <Link to="/clinics" className="text-white text-decoration-none opacity-75 small">Clínicas</Link>
              <Link to="/ranking" className="text-white text-decoration-none opacity-75 small">Ranking</Link>
              <Link to="/blog" className="text-white text-decoration-none opacity-75 small">Blog</Link>
            </div>
          </Col>
          <Col md={3}>
            <h6 className="fw-bold mb-3">Links Úteis</h6>
            <div className="d-flex flex-column gap-2">
              <Link to="/termos" className="text-white text-decoration-none opacity-75 small">Termos de Uso</Link>
              <Link to="/privacidade" className="text-white text-decoration-none opacity-75 small">Política de Privacidade</Link>
              <Link to="/contato" className="text-white text-decoration-none opacity-75 small">Fale Conosco</Link>
            </div>
          </Col>
          <Col md={3}>
            <h6 className="fw-bold mb-3">Contato</h6>
            <div className="d-flex flex-column gap-2">
              <span className="opacity-75 small"><i className="bi bi-envelope me-2"></i>contato@magnoliaroyale.com.br</span>
              <span className="opacity-75 small"><i className="bi bi-chat-dots me-2"></i>Chat de suporte na plataforma</span>
            </div>
          </Col>
        </Row>
        <hr className="my-4 opacity-25" />
        <p className="text-center opacity-75 small mb-0">
          &copy; {new Date().getFullYear()} Magnolia Royale. Todos os direitos reservados.
        </p>
      </Container>
    </footer>
  );
};
