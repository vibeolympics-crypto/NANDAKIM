/**
 * Schema.org Structured Data Generator
 * Generates JSON-LD structured data for SEO
 */

export interface SchemaConfig {
  siteName: string;
  siteUrl: string;
  logo?: string;
  socialProfiles?: string[];
  author?: {
    name: string;
    url?: string;
    image?: string;
  };
}

export interface PageSchema {
  type: 'home' | 'blog' | 'project' | 'about' | 'contact';
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
  keywords?: string[];
}

/**
 * Generate WebSite schema
 */
export const generateWebSiteSchema = (config: SchemaConfig) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.siteName,
    url: config.siteUrl,
    ...(config.logo && { logo: config.logo }),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${config.siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
};

/**
 * Generate Organization schema
 */
export const generateOrganizationSchema = (config: SchemaConfig) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.siteName,
    url: config.siteUrl,
    ...(config.logo && { logo: config.logo }),
    ...(config.socialProfiles &&
      config.socialProfiles.length > 0 && {
        sameAs: config.socialProfiles,
      }),
  };
};

/**
 * Generate Person schema (for about page)
 */
export const generatePersonSchema = (config: SchemaConfig, page: PageSchema) => {
  if (!config.author) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: config.author.name,
    ...(config.author.url && { url: config.author.url }),
    ...(config.author.image && { image: config.author.image }),
    ...(page.description && { description: page.description }),
    ...(config.socialProfiles &&
      config.socialProfiles.length > 0 && {
        sameAs: config.socialProfiles,
      }),
  };
};

/**
 * Generate WebPage schema
 */
export const generateWebPageSchema = (config: SchemaConfig, page: PageSchema) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.description,
    url: page.url,
    ...(page.image && { image: page.image }),
    ...(page.datePublished && { datePublished: page.datePublished }),
    ...(page.dateModified && { dateModified: page.dateModified }),
    inLanguage: 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      name: config.siteName,
      url: config.siteUrl,
    },
  };
};

/**
 * Generate BlogPosting schema
 */
export const generateBlogPostingSchema = (config: SchemaConfig, page: PageSchema) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: page.title,
    description: page.description,
    url: page.url,
    ...(page.image && {
      image: {
        '@type': 'ImageObject',
        url: page.image,
      },
    }),
    ...(page.datePublished && { datePublished: page.datePublished }),
    ...(page.dateModified && { dateModified: page.dateModified }),
    ...(page.author && {
      author: {
        '@type': 'Person',
        name: page.author,
      },
    }),
    ...(page.keywords &&
      page.keywords.length > 0 && {
        keywords: page.keywords.join(', '),
      }),
    publisher: {
      '@type': 'Organization',
      name: config.siteName,
      ...(config.logo && {
        logo: {
          '@type': 'ImageObject',
          url: config.logo,
        },
      }),
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': page.url,
    },
  };
};

/**
 * Generate CreativeWork schema (for projects)
 */
export const generateCreativeWorkSchema = (config: SchemaConfig, page: PageSchema) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: page.title,
    description: page.description,
    url: page.url,
    ...(page.image && {
      image: {
        '@type': 'ImageObject',
        url: page.image,
      },
    }),
    ...(page.datePublished && { dateCreated: page.datePublished }),
    ...(page.dateModified && { dateModified: page.dateModified }),
    ...(page.author && {
      creator: {
        '@type': 'Person',
        name: page.author,
      },
    }),
    ...(page.keywords &&
      page.keywords.length > 0 && {
        keywords: page.keywords.join(', '),
      }),
  };
};

/**
 * Generate BreadcrumbList schema
 */
export const generateBreadcrumbSchema = (breadcrumbs: Array<{ name: string; url: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
};

/**
 * Generate complete schema markup for a page
 */
export const generatePageSchema = (config: SchemaConfig, page: PageSchema): string => {
  const schemas: any[] = [];

  // Always include WebSite and Organization
  schemas.push(generateWebSiteSchema(config));
  schemas.push(generateOrganizationSchema(config));

  // Add page-specific schemas
  switch (page.type) {
    case 'home':
      schemas.push(generateWebPageSchema(config, page));
      break;

    case 'blog':
      schemas.push(generateBlogPostingSchema(config, page));
      break;

    case 'project':
      schemas.push(generateCreativeWorkSchema(config, page));
      break;

    case 'about': {
      const personSchema = generatePersonSchema(config, page);
      if (personSchema) {
        schemas.push(personSchema);
      }
      schemas.push(generateWebPageSchema(config, page));
      break;
    }

    case 'contact':
      schemas.push(generateWebPageSchema(config, page));
      break;

    default:
      schemas.push(generateWebPageSchema(config, page));
  }

  // Return as JSON-LD script content
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@graph': schemas,
    },
    null,
    2
  );
};

/**
 * Validate schema markup
 */
export const validateSchema = (schema: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  try {
    const parsed = JSON.parse(schema);

    // Check for required @context
    if (!parsed['@context']) {
      errors.push('Missing @context property');
    }

    // Check for @graph or @type
    if (!parsed['@graph'] && !parsed['@type']) {
      errors.push('Missing @graph or @type property');
    }

    // Validate each schema in @graph
    if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
      parsed['@graph'].forEach((item: any, index: number) => {
        if (!item['@type']) {
          errors.push(`Schema at index ${index} missing @type property`);
        }
      });
    }
  } catch (error) {
    errors.push('Invalid JSON format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Generate meta tags from SEO settings
 */
export interface MetaTags {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  robots?: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  ogType?: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
}

export const generateMetaTags = (tags: MetaTags): string => {
  const metaElements: string[] = [];

  // Basic meta tags
  metaElements.push(`<title>${tags.title}</title>`);
  metaElements.push(`<meta name="description" content="${tags.description}" />`);

  if (tags.keywords) {
    metaElements.push(`<meta name="keywords" content="${tags.keywords}" />`);
  }

  if (tags.canonical) {
    metaElements.push(`<link rel="canonical" href="${tags.canonical}" />`);
  }

  if (tags.robots) {
    metaElements.push(`<meta name="robots" content="${tags.robots}" />`);
  }

  // Open Graph tags
  metaElements.push(`<meta property="og:title" content="${tags.ogTitle}" />`);
  metaElements.push(`<meta property="og:description" content="${tags.ogDescription}" />`);
  metaElements.push(`<meta property="og:image" content="${tags.ogImage}" />`);
  metaElements.push(`<meta property="og:url" content="${tags.ogUrl}" />`);
  metaElements.push(`<meta property="og:type" content="${tags.ogType || 'website'}" />`);

  // Twitter Card tags
  metaElements.push(`<meta name="twitter:card" content="${tags.twitterCard}" />`);
  metaElements.push(`<meta name="twitter:title" content="${tags.twitterTitle}" />`);
  metaElements.push(`<meta name="twitter:description" content="${tags.twitterDescription}" />`);
  metaElements.push(`<meta name="twitter:image" content="${tags.twitterImage}" />`);

  return metaElements.join('\n');
};
