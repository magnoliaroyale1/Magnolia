import { Container, Row, Col, Card, Table, Badge } from 'react-bootstrap';
import { AdminSidebar } from '../../components/AdminSidebar';
import { useClients } from '../../hooks/useAdmin';

export const AdminClientsList = () => {
  const { clients, loading } = useClients();

  // Função auxiliar para formatar data do Firebase
  const formatDate = (createdAt: any): string => {
    if (!createdAt) return '-';
    
    // Firebase Timestamp tem seconds e nanoseconds
    if (createdAt.seconds) {
      return new Date(createdAt.seconds * 1000).toLocaleDateString('pt-BR');
    }
    
    // Se já for Date
    if (createdAt instanceof Date) {
      return createdAt.toLocaleDateString('pt-BR');
    }
    
    return '-';
  };

  return (
    <Container className="py-5">
      <Row>
        <Col md={3}>
          <AdminSidebar />
        </Col>
        <Col md={9}>
          <h2 className="font-serif fw-bold text-olive mb-4">Clientes Cadastrados</h2>
          
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
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Data de Cadastro</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.uid}>
                        <td className="fw-medium">{client.displayName}</td>
                        <td>{client.email}</td>
                        <td>{formatDate(client.createdAt)}</td>
                        <td>
                          <Badge bg="info" className="rounded-pill">Ativo</Badge>
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
    </Container>
  );
};