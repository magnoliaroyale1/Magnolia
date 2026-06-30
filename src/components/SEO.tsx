import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SITE_NAME = 'Magnolia Royale';
const DEFAULT_DESC = 'Conectamos você às melhores clínicas de estética premium do Brasil. Agende procedimentos, veja avaliações e encontre a clínica ideal.';
const DEFAULT_IMAGE = '/favicon.svg';

export const SEO = ({ title, description, image, url, type = 'website' }: SEOProps) => {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Clínicas Premium`;
  const pageDesc = description || DEFAULT_DESC;
  const pageImage = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:image" content={pageImage} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDesc} />
      <meta name="twitter:image" content={pageImage} />
    </Helmet>
  );
};
