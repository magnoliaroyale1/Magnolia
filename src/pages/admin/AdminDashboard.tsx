import { Container, Row, Col, Card } from 'react-bootstrap';
import { AdminSidebar } from '../../components/AdminSidebar';
import { useAdminStats } from '../../hooks/useAdmin';

export const AdminDashboard = () => {
  const { stats, loading } = useAdminStats();

  const StatCard = ({ title, value, icon, color }: { title: string; value: number | string; icon: string; color: string }) => (
    <Card className="border-0 shadow-sm h-100">
      <Card.Body className="p-4">
        <div className="d-flex align-items-center">
          <div className={`bg-${color} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3`} style={{ width: '60px', height: '60px' }}>
            <i className={`bi ${icon} text-${color} fs-4`}></i>
          </div>
          <div>
            <h6 className="text-muted mb-1">{title}</h6>
            <h3 className="font-serif fw-bold text-olive mb-0">{loading ? '...' : value}</h3>
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <Container className="py-5">
      <Row>
        <Col md={3}>
          <AdminSidebar />
        </Col>
        <Col md={9}>
          <h2 className="font-serif fw-bold text-olive mb-4">Dashboard Administrativo</h2>
          
          <Row className="g-4 mb-4">
            <Col md={4}>
              <StatCard title="Total Clínicas" value={stats.totalClinics} icon="bi-building" color="olive" />
            </Col>
            <Col md={4}>
              <StatCard title="Aprovadas" value={stats.approvedClinics} icon="bi-check-circle" color="success" />
            </Col>
            <Col md={4}>
              <StatCard title="Pendentes" value={stats.pendingClinics} icon="bi-clock" color="warning" />
            </Col>
          </Row>
          
          <Row className="g-4">
            <Col md={6}>
              <StatCard title="Total Clientes" value={stats.totalClients} icon="bi-people" color="info" />
            </Col>
            <Col md={6}>
              <StatCard title="Ganhos Estimados" value={`R$ ${stats.estimatedRevenue}`} icon="bi-currency-dollar" color="gold" />
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};