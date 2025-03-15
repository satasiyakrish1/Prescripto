import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = 'Prescripto', 
  description = 'Book appointments with trusted doctors, browse medicines, and manage your health with Prescripto.', 
  keywords = 'doctors, appointments, medicines, healthcare, prescriptions, medical, health',
  canonicalUrl,
  ogType = 'website',
  ogImage = '/favicon.svg',
  children
}) => {
  // Build the full canonical URL
  const siteUrl = 'https://prescripto.com';
  const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Canonical Link */}
      <link rel="canonical" href={fullCanonicalUrl} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
      
      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      
      {/* Additional elements passed as children */}
      {children}
    </Helmet>
  );
};

export default SEO;