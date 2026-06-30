import { useState, useEffect } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const COOKIE_CONSENT_KEY = 'magnolia_cookie_consent';

export const CookieBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setShow(false);
  };

  if (!show) return null;

  return (
    <Alert
      variant="light"
      className="fixed-bottom m-0 rounded-0 border-top shadow-lg py-3"
      style={{ zIndex: 9999 }}
    >
      <div className="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
        <p className="mb-0 text-muted small text-center text-md-start">
          Utilizamos cookies essenciais e analíticos para melhorar sua experiência.
          Ao continuar navegando, você concorda com nossa{' '}
          <Link to="/privacidade#cookies" className="text-olive">Política de Privacidade</Link>.
        </p>
        <div className="d-flex gap-2 flex-shrink-0">
          <Button variant="olive" size="sm" className="rounded-pill px-4" onClick={accept}>
            Aceitar
          </Button>
          <Link to="/privacidade#cookies">
            <Button variant="outline-olive" size="sm" className="rounded-pill px-4">
              Saiba Mais
            </Button>
          </Link>
        </div>
      </div>
    </Alert>
  );
};
