import { Container, Row, Col } from 'react-bootstrap';

export const TermsOfUse = () => {
  return (
    <Container className="py-5 mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <h1 className="font-serif fw-bold text-olive mb-4">Termos de Uso</h1>
          <p className="text-muted mb-4">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <section className="mb-4">
            <h5 className="fw-bold text-olive">1. Aceitação dos Termos</h5>
            <p className="text-muted">
              Ao acessar ou utilizar a plataforma Magnolia Royale, você declara ter lido, compreendido e aceitado
              todos os termos e condições descritos neste documento. Caso não concorde com qualquer disposição,
              você não deve utilizar nossos serviços.
            </p>
          </section>

          <section className="mb-4">
            <h5 className="fw-bold text-olive">2. Definições</h5>
            <p className="text-muted">
              <strong>Plataforma:</strong> refere-se ao site Magnolia Royale, que conecta clínicas de estética a clientes.<br />
              <strong>Clínica:</strong> prestador de serviços cadastrado na plataforma.<br />
              <strong>Cliente:</strong> usuário que busca e agenda serviços estéticos.<br />
              <strong>Profissional:</strong> profissional vinculado a uma clínica parceira.
            </p>
          </section>

          <section className="mb-4">
            <h5 className="fw-bold text-olive">3. Cadastro e Conta</h5>
            <p className="text-muted">
              Para utilizar a plataforma, é necessário criar uma conta com dados verídicos. Você é responsável
              pela confidencialidade de seus dados de acesso e por todas as atividades realizadas em sua conta.
            </p>
          </section>

          <section className="mb-4">
            <h5 className="fw-bold text-olive">4. Agendamentos</h5>
            <p className="text-muted">
              Os agendamentos realizados através da plataforma estão sujeitos à confirmação pela clínica.
              A Magnolia Royale não se responsabiliza por cancelamentos ou alterações realizadas diretamente
              entre cliente e clínica. Cada clínica define suas próprias regras de cancelamento e remarcação.
            </p>
          </section>

          <section className="mb-4">
            <h5 className="fw-bold text-olive">5. Avaliações</h5>
            <p className="text-muted">
              As avaliações refletem a opinião pessoal dos clientes. A Magnolia Royale não se responsabiliza
              pelo conteúdo das avaliações, mas reserva-se o direito de remover avaliações que violem estes termos.
            </p>
          </section>

          <section className="mb-4">
            <h5 className="fw-bold text-olive">6. Limitação de Responsabilidade</h5>
            <p className="text-muted">
              A Magnolia Royale atua como intermediária na conexão entre clientes e clínicas. Não nos
              responsabilizamos pela qualidade dos serviços prestados pelas clínicas parceiras, nem por
              danos decorrentes da prestação desses serviços.
            </p>
          </section>

          <section className="mb-4">
            <h5 className="fw-bold text-olive">7. Modificações</h5>
            <p className="text-muted">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações serão
              comunicadas através da plataforma e o uso continuado implica aceitação das novas condições.
            </p>
          </section>

          <section className="mb-4">
            <h5 className="fw-bold text-olive">8. Contato</h5>
            <p className="text-muted">
              Para dúvidas ou esclarecimentos, entre em contato pelo e-mail contato@magnoliaroyale.com.br
              ou através do chat de suporte na plataforma.
            </p>
          </section>
        </Col>
      </Row>
    </Container>
  );
};
