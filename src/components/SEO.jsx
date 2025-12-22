import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({
    title,
    description,
    image,
    url,
    type = 'website',
    publishedTime,
    author,
    schema
}) {
    const siteTitle = "MMU Confessions";
    const finalTitle = title ? `${title} | ${siteTitle}` : "MMU Confessions | Anonymous Student Community";
    const finalDescription = description || "The #1 anonymous confession platform for MMU students. Share secrets, read stories, and connect with your campus community.";
    const finalUrl = url || "https://mmuconfessions.fun/";
    const finalImage = image || "https://mmuconfessions.fun/default-og-image.png";

    return (
        <Helmet>
            <title>{finalTitle}</title>
            <meta name="description" content={finalDescription} />
            <link rel="canonical" href={finalUrl} />

            <meta property="og:site_name" content={siteTitle} />
            <meta property="og:type" content={type} />
            <meta property="og:url" content={finalUrl} />
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={finalDescription} />
            <meta property="og:image" content={finalImage} />
            <meta property="og:locale" content="en_US" />

            {publishedTime && <meta property="article:published_time" content={publishedTime} />}
            {author && <meta property="article:author" content={author} />}

            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
}