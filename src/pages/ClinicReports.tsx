import { Container, Card, Row, Col, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClinicReports } from '../hooks/useClinicReports';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3A5A40', '#C6A86B', '#5A7A60', '#D4B87A', '#2A4A30', '#B8965B', '#7A9A80', '#E0C890'];

export const ClinicReports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const clinicId = user?.clinicId || user?.uid || '';
  const { monthlyRevenue, revenueByProfessional, procedureCounts, totalRevenue, averageTicket, completedCount, loading } = useClinicReports(clinicId);

  return (
    <Container className="py-5 mt-5">
      <div className="d-flex align-items-center mb-4">
        <i className="bi bi-arrow-left fs-5 me-3 text-gold" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/clinic')}></i>
        <h3 className="font-serif fw-bold text-olive mb-0">Relatórios Financeiros</h3>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" className="text-olive" /></div>
      ) : (
        <>
          <Row className="g-3 mb-4">
            <Col md={3}>
              <Card className="border-0 shadow-sm text-center h-100">
                <Card.Body className="p-3">
                  <small className="text-muted">Faturamento Total</small>
                  <h4 className="fw-bold text-olive mb-0">R$ {totalRevenue.toFixed(2)}</h4>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm text-center h-100">
                <Card.Body className="p-3">
                  <small className="text-muted">Ticket Médio</small>
                  <h4 className="fw-bold text-olive mb-0">R$ {averageTicket.toFixed(2)}</h4>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm text-center h-100">
                <Card.Body className="p-3">
                  <small className="text-muted">Agendamentos Concluídos</small>
                  <h4 className="fw-bold text-olive mb-0">{completedCount}</h4>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm text-center h-100">
                <Card.Body className="p-3">
                  <small className="text-muted">Receita Média/Mês</small>
                  <h4 className="fw-bold text-olive mb-0">
                    R$ {(monthlyRevenue.length > 0 ? totalRevenue / monthlyRevenue.length : 0).toFixed(2)}
                  </h4>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            <Col md={8}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h6 className="fw-bold text-olive mb-3">Faturamento Mensal</h6>
                  {monthlyRevenue.length === 0 ? (
                    <p className="text-muted text-center py-4">Nenhum dado disponível</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={monthlyRevenue}>
                        <defs>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3A5A40" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3A5A40" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="revenue" stroke="#3A5A40" fill="url(#revenueGradient)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h6 className="fw-bold text-olive mb-3">Por Profissional</h6>
                  {revenueByProfessional.length === 0 ? (
                    <p className="text-muted text-center py-4">Nenhum dado</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={revenueByProfessional} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                          {revenueByProfessional.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-4">
            <Col md={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h6 className="fw-bold text-olive mb-3">Procedimentos mais Realizados</h6>
                  {procedureCounts.length === 0 ? (
                    <p className="text-muted text-center py-4">Nenhum dado disponível</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={procedureCounts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3A5A40" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h6 className="fw-bold text-olive mb-3">Receita por Profissional</h6>
                  {revenueByProfessional.length === 0 ? (
                    <p className="text-muted text-center py-4">Nenhum dado disponível</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueByProfessional}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="#C6A86B" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};
