import { Helmet } from 'react-helmet-async'

export default function SEO({
  title,
  description,
  image = '/og-default.png',
  url,
}) {
  const siteName = 'ERAU Model United Nations'
  const fullTitle = title ? `${title} — ${siteName}` : siteName
  const fullUrl = url ? `https://eraumun.com${url}` : 'https://eraumun.com'
  const fullDescription = description ?? 'Embry-Riddle Aeronautical University\'s official Model United Nations organization, based in Daytona Beach, Florida.'

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={`https://eraumun.com${image}`} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={`https://eraumun.com${image}`} />
    </Helmet>
  )
}