import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({
    title,
    description,
    keywords,
    url,
    image,
    type = 'website',
    author = 'MMU Confessions'
}) {
    // Base configuration (Replace with your actual live domain)
    const DOMAIN = 'https://your-domain.com';

    const siteTitle = title ? `${title} | MMU Confessions` : 'MMU Confessions - The Voice of MMU Students';
    const siteDescription = description || 'Read, share, and discuss the latest anonymous confessions, stories, and experiences from Multimedia University (MMU) students in Cyberjaya and Melaka.';
    const siteUrl = url ? `${DOMAIN}${url}` : DOMAIN;
    const siteImage = image || `${DOMAIN}/favicon.svg`; // Fallback image for link sharing

    // JSON-LD Structured Data for Google Rich Results
    const structuredData = {
        "@context": "https://schema.org",
        "@type": type === 'article' ? 'Article' : 'WebSite',
        "name": siteTitle,
        "url": siteUrl,
        "description": siteDescription,
        "image": siteImage,
        "author": {
            "@type": "Organization",
            "name": author
        },
        "publisher": {
            "@type": "Organization",
            "name": "MMU Confessions",
            "logo": {
                "@type": "ImageObject",
                "url": `${DOMAIN}/favicon.svg`
            }
        }
    };

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{siteTitle}</title>
            <meta name="description" content={siteDescription} />
            {keywords && <meta name="keywords" content={keywords} />}
            <link rel="canonical" href={siteUrl} />

            {/* Open Graph / Facebook / WhatsApp */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={siteUrl} />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={siteDescription} />
            <meta property="og:image" content={siteImage} />
            <meta property="og:site_name" content="MMU Confessions" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={siteUrl} />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={siteDescription} />
            <meta name="twitter:image" content={siteImage} />

            <script type="application/ld+json">
                {JSON.stringify(structuredData)}
            </script>
        </Helmet>
    );
}