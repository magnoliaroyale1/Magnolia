import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container className="py-5 mt-5 text-center">
          <Row className="justify-content-center">
            <Col md={6}>
              <i className="bi bi-exclamation-triangle text-gold" style={{ fontSize: '4rem', opacity: 0.5 }}></i>
              <h2 className="font-serif fw-bold text-olive mt-4">Algo deu errado</h2>
              <p className="text-muted mb-4">Ocorreu um erro inesperado. Tente recarregar a página.</p>
              <Button variant="olive" className="rounded-pill px-5 py-2" onClick={this.handleReload}>
                <i className="bi bi-arrow-clockwise me-2"></i>Recarregar
              </Button>
            </Col>
          </Row>
        </Container>
      );
    }
    return this.props.children;
  }
}
