import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className='mx-auto min-h-screen max-w-3xl px-6 py-24'>
      <article className='space-y-6 text-muted-foreground'>
        <h1 className='text-4xl font-bold tracking-tight text-foreground'>Privacy Policy</h1>
        <p className='text-sm'>Last updated: October 21, 2026</p>
        <p>
          Genesys was developed for the NUS Guru Network AI Innovation Project. This notice explains
          the categories of information the application code is designed to process.
        </p>
        <h2 className='text-2xl font-semibold text-foreground'>Information processed</h2>
        <p>
          The application may process account identifiers, project content, funnel definitions,
          synthetic persona settings, simulation results, support requests, feedback, and
          mailing-list preferences.
        </p>
        <h2 className='text-2xl font-semibold text-foreground'>Service providers</h2>
        <p>
          Cloudflare hosts the application, stores account and project data in D1, and processes
          background simulation jobs with Queues. OpenAI processes prompts for persona generation,
          simulations, and analysis. Optional Umami analytics runs only when configured by the
          operator.
        </p>
        <h2 className='text-2xl font-semibold text-foreground'>Data choices</h2>
        <p>
          Do not submit confidential or regulated data to this application. Account and project
          deletion controls remove associated application records where supported by the data model.
        </p>
        <h2 className='text-2xl font-semibold text-foreground'>Security</h2>
        <p>
          The project uses authenticated, project-scoped server actions and encrypted network
          connections. No internet service can guarantee absolute security.
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
