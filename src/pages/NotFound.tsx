import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <Container className="py-5 mt-5 text-center">
      <Row className="justify-content-center">
        <Col md={6}>
          <i className="bi bi-flower1 text-olive" style={{ fontSize: '5rem', opacity: 0.3 }}></i>
          <h1 className="font-serif fw-bold text-olive mt-4 display-3">404</h1>
          <p className="lead text-muted mb-4">Página não encontrada</p>
          <p className="text-muted mb-4">A página que você procura não existe ou foi removida.</p>
          <Link to="/" className="btn btn-olive rounded-pill px-5 py-2">
            <i className="bi bi-arrow-left me-2"></i>Voltar ao Início
          </Link>
        </Col>
      </Row>
    </Container>
  );
};
