import { Container, Row, Col } from 'react-bootstrap';

export const Privacy = () => {
  return (
    <Container className="py-5 mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <h1 className="font-serif fw-bold text-olive mb-4">Política de Privacidade</h1>
          <p className="text-muted mb-4">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <section className="mb-4">
            <h5 className="fw-bold text-olive">1. Dados Coletados</h5>
            <p className="text-muted">
              Coletamos os seguintes dados pessoais ao utilizar nossa plataforma: nome, e-mail, telefone,
              endereço (quando fornecido), histórico de agendamentos, avaliações e preferências.
            </p>
          </section>

          <section className="mb-4">
            <h5 className="fw-bold text-olive">2. Finalidade dos Dados</h5>
            <p className="text-muted">
              Seus dados são utilizados para: criar e gerenciar sua conta, processar agendamentos,
              permitir comunicação entre clientes e clínicas, enviar notificações relevantes,
              melhorar nossos serviços e cumprir obrigações legais.
            </p>
          </section>

          <section className="mb-4">
            <h5 className="fw-bold text-olive">3. Compartilhamento de Dados</h5>
            <p className="text-muted">
              Compartilhamos seus dados apenas com clínicas parceiras para viabilizar agendamentos
              e com prestadores de serviço essenciais (hospedagem, processamento de pagamentos).
              Não vendemos seus dados pessoais a terceiros.
            </p>
          </section>

          <section className="mb-4">
            <h5 className="fw-bold text-olive">4. Armazenamento e Segurança</h5>
            <p className="text-muted">
              Utilizamos criptografia e práticas de segurança recomendadas para proteger seus dados.
              Os dados são armazenados em servidores seguros com acesso restrito.
            </p>
          </section>

          <section className="mb-4">
            <h5 className="fw-bold text-olive">5. Seus Direitos (LGPD)</h5>
            <p className="text-muted">
              Conforme a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018), você tem direito a:
              acessar seus dados, corrigir dados incompletos ou desatualizados, solicitar anonimização
              ou exclusão de dados desnecessários, revogar consentimento, solicitar portabilidade
              e ser informado sobre o compartilhamento com terceiros.
            </p>
          </section>

          <section className="mb-4">
            <h5 className="fw-bold text-olive">6. Cookies</h5>
            <p className="text-muted">
              Utilizamos cookies essenciais para o funcionamento da plataforma. Cookies de terceiros
              podem ser utilizados para análises de uso e melhoria dos serviços.
            </p>
          </section>

          <section className="mb-4">
            <h5 className="fw-bold text-olive">7. Retenção de Dados</h5>
            <p className="text-muted">
              Mantemos seus dados enquanto sua conta estiver ativa. Após exclusão da conta, os dados
              serão eliminados ou anonimizados em até 90 dias, exceto quando a lei exigir retenção.
            </p>
          </section>

          <section className="mb-4">
            <h5 className="fw-bold text-olive">8. Contato do Encarregado (DPO)</h5>
            <p className="text-muted">
              Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato:
              dpo@magnoliaroyale.com.br
            </p>
          </section>
        </Col>
      </Row>
    </Container>
  );
};
