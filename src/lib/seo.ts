import { SITE_URL, SITE_NAME, CURRENT_FISCAL_YEAR, CONTACT_EMAIL, AUTHOR_NAME } from '../config';

export function buildCanonical(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const withTrailingSlash = cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`;
  return `${SITE_URL}${withTrailingSlash}`;
}

export function buildWebApplicationSchema(name: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    url: buildCanonical(url),
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'MAD',
    },
    inLanguage: 'fr',
  };
}

export interface FAQItem {
  question: string;
  answer: string;
}

export function buildFAQSchema(items: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
    inLanguage: 'fr',
  };
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: buildCanonical(item.url),
    })),
  };
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/og-default.png`,
    description: `Calculateurs de salaire gratuits pour le Maroc, mis à jour pour l'année fiscale ${CURRENT_FISCAL_YEAR}.`,
    foundingDate: '2025',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      email: CONTACT_EMAIL,
      contactType: 'customer service',
      availableLanguage: ['French', 'Arabic'],
    },
    founder: {
      '@type': 'Person',
      name: AUTHOR_NAME,
      jobTitle: 'Expert en finances personnelles',
      description: 'Expert en finances personnelles et fiscalité marocaine, diplômé MBA de l\'INSEAD.',
      image: `${SITE_URL}/team/mottalib-radif.jpg`,
      alumniOf: { '@type': 'CollegeOrUniversity', name: 'INSEAD' },
    },
  };
}

export interface PersonSchemaProps {
  name: string;
  jobTitle: string;
  description: string;
  alumniOf?: { name: string; url?: string }[];
  knowsAbout?: string[];
  url?: string;
}

export function buildPersonSchema(props: PersonSchemaProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: props.name,
    jobTitle: props.jobTitle,
    description: props.description,
    image: `${SITE_URL}/team/mottalib-radif.jpg`,
    url: props.url || `${SITE_URL}/a-propos/`,
    worksFor: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    ...(props.alumniOf && {
      alumniOf: props.alumniOf.map((a) => ({
        '@type': 'EducationalOrganization',
        name: a.name,
        ...(a.url && { url: a.url }),
      })),
    }),
    ...(props.knowsAbout && { knowsAbout: props.knowsAbout }),
  };
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'fr',
    description: `Calculateurs de salaire brut/net, IR, CNSS et coût employeur pour le Maroc ${CURRENT_FISCAL_YEAR}.`,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function buildArticleSchema(
  headline: string,
  description: string,
  url: string,
  datePublished?: string,
  dateModified?: string,
) {
  const now = new Date().toISOString().split('T')[0];
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url: buildCanonical(url),
    datePublished: datePublished || now,
    dateModified: dateModified || now,
    inLanguage: 'fr',
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
      url: `${SITE_URL}/a-propos/`,
      image: `${SITE_URL}/team/mottalib-radif.jpg`,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-default.png` },
    },
  };
}
