import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className='mx-auto min-h-screen max-w-3xl px-6 py-24'>
      <article className='space-y-6 text-muted-foreground'>
        <h1 className='text-4xl font-bold tracking-tight text-foreground'>Terms of Service</h1>
        <p className='text-sm'>Last updated: August 11, 2026</p>
        <p>
          Genesys was developed for the NUS Guru Network AI Innovation Project to explore synthetic
          customer personas and marketing funnel simulations. It is not a marketing, legal,
          financial, or business decision service.
        </p>
        <h2 className='text-2xl font-semibold text-foreground'>Acceptable use</h2>
        <p>
          You may not use the application to break applicable laws, access another user&apos;s data,
          disrupt the service, probe credentials, or submit unlawful or harmful content.
        </p>
        <h2 className='text-2xl font-semibold text-foreground'>AI-generated output</h2>
        <p>
          Generated personas, responses, and recommendations may be incomplete or inaccurate. Review
          all output independently before relying on it.
        </p>
        <h2 className='text-2xl font-semibold text-foreground'>Availability and warranties</h2>
        <p>
          The software is provided &quot;as is&quot; without warranties. Features may change or
          become unavailable without notice.
        </p>
        <h2 className='text-2xl font-semibold text-foreground'>Contact</h2>
        <p>
          For repository questions, open an issue in the project&apos;s public GitHub repository.
        </p>
        <p>
          <Link href='/' className='font-medium'>
            Return to Genesys
          </Link>
        </p>
      </article>
    </main>
  );
}
