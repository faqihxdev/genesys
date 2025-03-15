import { AnimationToggle } from '@/components/custom/animation-toggle';
import { BeamsBackground } from '@/components/custom/beams-background';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LucideBarChart2,
  LucideDatabase,
  LucideTarget,
  LucideTimer,
  LucideUsers,
  LucideZap,
} from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { EmailSubscriptionForm } from './_email-subscription';

export const metadata: Metadata = {
  title: 'Genesys - AI-Powered Customer Behavior Simulation',
  description:
    'Generate synthetic personas and simulate customer behaviors to optimize your conversion funnel.',
};

const features = [
  {
    id: 'sim',
    icon: LucideZap,
    label: 'Simulation',
    title: 'AI-Powered Behavior Simulation',
    description: 'Create and analyze detailed customer journey simulations with precision.',
    image: '/landing-simulation.png',
  },
  {
    id: 'per',
    icon: LucideDatabase,
    label: 'Persona',
    title: 'Synthetic Persona Generation',
    description: 'Generate realistic customer profiles with distinct behaviors and preferences.',
    image: '/landing-persona.png',
  },
  {
    id: 'ana',
    icon: LucideBarChart2,
    label: 'Analysis',
    title: 'Behavioral Analysis',
    description: 'Extract valuable insights from simulated customer interactions.',
    image: '/landing-analysis.png',
  },
] as const;

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const featureId = typeof params.f === 'string' ? params.f : 'sim';
  const activeFeature = features.find((f) => f.id === featureId) || features[0];

  return (
    <div className='min-h-screen w-full relative overflow-x-hidden'>
      {/* Beams Background - Positioned absolute at the top with extended width */}
      <div className='absolute top-0 left-0 right-0 h-screen z-0 overflow-hidden pointer-events-none w-[calc(100%+200px)] -ml-[100px]'>
        <BeamsBackground intensity='medium' className='opacity-80' />
      </div>

      {/* Animation Toggle - Fixed position in bottom-right corner */}
      <div className='fixed bottom-6 right-6 z-50'>
        <AnimationToggle />
      </div>

      {/* Content Container */}
      <div className='relative z-10 min-h-screen w-full'>
        {/* Hero Section */}
        <main className='w-full'>
          <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='pt-32 pb-16'>
              <div className='mx-auto max-w-3xl text-center'>
                <div className='flex flex-col md:flex-row items-center justify-center gap-2 mb-4 mt-4'>
                  <div className='inline-flex items-center rounded-full border px-4 py-1.5 bg-background/50'>
                    <span className='text-xs sm:text-sm'>
                      AI-Powered Customer Behavior Simulation
                    </span>
                  </div>
                </div>
                <div className='flex flex-col items-center'>
                  <h1 className='my-6 text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight'>
                    Predict Customer
                    <br />
                    Behavior with AI Precision
                  </h1>
                </div>
                <p className='mt-6 mb-8 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto'>
                  Generate synthetic personas and simulate customer behaviors to optimize your
                  conversion funnel.
                </p>
                <div className='flex flex-wrap items-center justify-center gap-4'>
                  <Link href='/auth?tab=signin'>
                    <Button size='lg' className='w-full max-w-[160px]'>
                      Try it for free
                    </Button>
                  </Link>
                  <Link
                    href='https://youtu.be/UImOEvPzvRo'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <Button size='lg' variant='outline' className='w-full max-w-[160px]'>
                      Watch Demo
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Feature Tabs */}
              <div className='mt-16 sm:mt-24'>
                <div className='flex justify-center mb-8 sm:mb-12'>
                  <div className='flex justify-center items-center w-full max-w-lg mx-auto overflow-x-auto px-4 pb-4 sm:pb-0'>
                    <div className='w-fit flex items-center justify-center gap-1 rounded-full border bg-background p-1.5 sm:p-2'>
                      {features.map((feature) => {
                        const Icon = feature.icon;
                        const isActive = activeFeature.id === feature.id;
                        return (
                          <Link
                            key={feature.id}
                            href={{ query: { f: feature.id } }}
                            scroll={false}
                            replace
                            className={cn(
                              'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full transition-all duration-100 whitespace-nowrap text-sm sm:text-base min-w-[40px] sm:min-w-[120px] justify-center',
                              isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                              !isActive && 'sm:w-auto'
                            )}
                          >
                            <Icon className='h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0' />
                            <span
                              className={cn(
                                'transition-all duration-50',
                                !isActive && 'hidden sm:inline'
                              )}
                            >
                              {feature.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Feature Content */}
                <div className='space-y-8'>
                  <div className='text-center max-w-2xl mx-auto'>
                    <h2 className='text-xl sm:text-2xl font-bold mb-3'>{activeFeature.title}</h2>
                    <p className='text-sm sm:text-base text-muted-foreground'>
                      {activeFeature.description}
                    </p>
                  </div>

                  {/* Software Interface Preview */}
                  <div className='w-full max-w-5xl mx-auto'>
                    <div className='rounded-xl border bg-card p-2 sm:p-3 shadow-lg transition-all duration-300'>
                      <div className='aspect-video w-full rounded-lg bg-muted relative overflow-hidden'>
                        {/* Display the feature image using Next.js Image component */}
                        <Image
                          src={activeFeature.image}
                          alt={`${activeFeature.title} feature preview`}
                          fill
                          sizes='(max-width: 768px) 100vw, 1200px'
                          priority={activeFeature.id === 'sim'}
                          className='object-cover object-center'
                        />
                        {/* Add a subtle gradient overlay for better text visibility if needed */}
                        {/* <div className='absolute inset-0 bg-gradient-to-t from-background/40 to-transparent'></div> */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className='py-24 border-t'>
              <div className='text-center mb-16'>
                <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold mb-4'>
                  AI-Driven Simulation At Scale
                </h2>
                <p className='text-muted-foreground text-base sm:text-lg'>
                  Our platform efficiently processes thousands of synthetic personas with
                  industry-standard latency.
                </p>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto'>
                {[
                  {
                    icon: LucideDatabase,
                    label: 'Personas Generated',
                    value: '50K+',
                  },
                  {
                    icon: LucideUsers,
                    label: 'Supported Scenarios',
                    value: 'Unlimited',
                  },
                  {
                    icon: LucideTimer,
                    label: 'Response Time',
                    value: '<100ms',
                  },
                  {
                    icon: LucideTarget,
                    label: 'Platform Uptime',
                    value: '99.99%',
                  },
                ].map((stat) => (
                  <div key={stat.label} className='text-center p-6 rounded-lg border bg-card'>
                    <div className='flex justify-center mb-4'>
                      <stat.icon className='h-8 w-8 text-primary' />
                    </div>
                    <div className='text-2xl sm:text-3xl font-bold mb-2'>{stat.value}</div>
                    <div className='text-sm text-muted-foreground'>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Build Fast Section */}
            <div id='features' className='py-24 border-t'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
                <div>
                  <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold mb-6'>
                    Build fast. Test faster.
                  </h2>
                  <p className='text-muted-foreground text-base sm:text-lg mb-8'>
                    Forget months of setup. Generate synthetic personas immediately with our AI
                    engine and start optimizing your customer journey today.
                  </p>
                  <div className='space-y-4'>
                    {[
                      'Instant persona generation',
                      'Real-time behavior simulation',
                      'Advanced analysis dashboard',
                      'Custom scenario builder',
                    ].map((feature) => (
                      <div key={feature} className='flex items-center gap-2'>
                        <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className='rounded-xl border bg-muted/50 p-4 aspect-[4/3] relative overflow-hidden'>
                  <div className='relative w-full h-full p-2'>
                    <Image
                      src='/build-fast.png'
                      alt='Platform Interface Preview'
                      fill
                      sizes='(max-width: 768px) 100vw, 600px'
                      className='object-contain object-center w-fit h-full rounded-lg overflow-hidden'
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Technology Stack Section */}
            <div className='py-24 border-t'>
              <div className='text-center mb-16'>
                <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold mb-4'>
                  Built with cutting-edge technology
                </h2>
                <p className='text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto'>
                  Leveraging modern tech stack for reliable performance and scalability.
                </p>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto'>
                {[
                  {
                    icon: LucideZap,
                    title: 'Real-time Processing',
                    description: 'Process and analyze customer behavior data in real-time.',
                  },
                  {
                    icon: LucideDatabase,
                    title: 'Advanced AI Models',
                    description: 'State-of-the-art models for accurate predictions.',
                  },
                  {
                    icon: LucideBarChart2,
                    title: 'Data Visualization',
                    description: 'Interactive dashboards and reports for data visualization.',
                  },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className='text-center p-6 rounded-lg border bg-card flex flex-col items-center'
                  >
                    <feature.icon className='h-8 w-8 mb-4 text-primary' />
                    <h3 className='text-lg font-semibold mb-2'>{feature.title}</h3>
                    <p className='text-sm text-muted-foreground'>{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Showcase Section */}
            {/* Commenting out the Customer Showcase Section
            <div id='customers' className='py-24 border-t scroll-mt-16'>
              <div className='text-center mb-16'>
                <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold mb-4'>
                  Trusted by innovative companies
                </h2>
                <p className='text-muted-foreground text-base sm:text-lg max-w-3xl mx-auto'>
                  Join thousands of companies using Genesys to optimize their customer experience.
                </p>
              </div>

              <div className='max-w-5xl mx-auto px-4'>
                <div className='w-full overflow-hidden relative'>
                  <div className='flex gap-8 animate-scroll'>
                    {[
                      'Company A',
                      'Company B',
                      'Company C',
                      'Company D',
                      'Company E',
                      'Company F',
                      'Company A',
                      'Company B',
                      'Company C',
                      'Company D',
                    ].map((company, index) => (
                      <div
                        key={index}
                        className='flex-shrink-0 w-[200px] aspect-[3/2] rounded-lg border bg-card flex items-center justify-center p-4'
                      >
                        <div className='text-sm text-muted-foreground'>{company}</div>
                      </div>
                    ))}
                  </div>
                  <div className='absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent' />
                  <div className='absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent' />
                </div>
              </div>
            </div>
            */}

            {/* Pricing Section */}
            <div id='pricing' className='py-24 border-t scroll-mt-16'>
              <div className='text-center mb-16'>
                <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold mb-4'>
                  Simple, credit-based pricing
                </h2>
                <p className='text-muted-foreground text-base sm:text-lg max-w-3xl mx-auto'>
                  Start with our flexible plans and scale as you grow. Pay only for what you use.
                </p>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4'>
                {/* Individual Plan */}
                <div className='rounded-xl border bg-card p-6 sm:p-8 flex flex-col h-full'>
                  <div>
                    <h3 className='text-lg font-semibold mb-2'>Individual</h3>
                    <div className='flex items-baseline gap-2'>
                      <span className='text-3xl font-bold'>$49</span>
                      <span className='text-muted-foreground'>/month</span>
                    </div>
                    <p className='text-sm text-muted-foreground mt-2'>
                      Perfect for individual researchers and small projects
                    </p>
                  </div>

                  <div className='space-y-4 mt-8'>
                    <div className='flex items-center gap-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                      <span>5,000 credits included</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                      <span className='text-sm text-muted-foreground'>Up to 25 simulations</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                      <span>$0.008 per additional credit</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                      <span>Basic analysis</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                      <span>Email support</span>
                    </div>
                  </div>

                  <div className='mt-auto pt-8'>
                    <Link href='/auth?tab=signup'>
                      <Button size='lg' variant='outline' className='w-full'>
                        Get started
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Professional Plan */}
                <div className='rounded-xl border-2 border-primary bg-card p-6 sm:p-8 relative overflow-hidden flex flex-col h-full shadow-lg'>
                  <div className='absolute top-3 right-3'>
                    <div className='bg-primary px-3 py-1 rounded-full'>
                      <span className='text-xs text-primary-foreground font-medium'>Popular</span>
                    </div>
                  </div>

                  <div>
                    <h3 className='text-lg font-semibold mb-2'>Professional</h3>
                    <div className='flex items-baseline gap-2'>
                      <span className='text-3xl font-bold'>$149</span>
                      <span className='text-muted-foreground'>/month</span>
                    </div>
                    <p className='text-sm text-muted-foreground mt-2'>
                      For growing teams and businesses
                    </p>
                  </div>

                  <div className='space-y-4 mt-8'>
                    <div className='flex items-center gap-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                      <span>25,000 credits included</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                      <span className='text-sm text-muted-foreground'>Up to 125 simulations</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                      <span>$0.005 per additional credit</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                      <span>Advanced analysis</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                      <span>Priority support</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                      <span>API access</span>
                    </div>
                  </div>

                  <div className='mt-auto pt-8'>
                    <Link href='/auth?tab=signup'>
                      <Button size='lg' className='w-full'>
                        Get started now
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Enterprise Plan */}
                <div className='rounded-xl border bg-card p-6 sm:p-8 flex flex-col h-full'>
                  <div>
                    <h3 className='text-lg font-semibold mb-2'>Enterprise</h3>
                    <div className='flex items-baseline gap-2'>
                      <span className='text-3xl font-bold'>$499</span>
                      <span className='text-muted-foreground'>/month</span>
                    </div>
                    <p className='text-sm text-muted-foreground mt-2'>
                      For large organizations with advanced needs
                    </p>
                  </div>

                  <div className='space-y-4 mt-8'>
                    <div className='flex items-center gap-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                      <span>100,000 credits included</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                      <span className='text-sm text-muted-foreground'>Up to 500 simulations</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                      <span>$0.003 per additional credit</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                      <span>Enterprise analysis</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                      <span>24/7 priority support</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                      <span>Custom integrations</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                      <span>Dedicated account manager</span>
                    </div>
                  </div>

                  <div className='mt-auto pt-8'>
                    <Link href='#stay-in-touch'>
                      <Button size='lg' variant='outline' className='w-full'>
                        Contact Us
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              <div className='mt-16 text-center'>
                <p className='text-sm text-muted-foreground'>
                  Need a custom plan? Contact us for volume pricing and custom requirements.
                </p>
              </div>
            </div>

            {/* CTA Section */}
            <div className='py-24 border-t'>
              <div className='max-w-4xl mx-auto text-center'>
                <div className='rounded-3xl px-6 py-16 sm:px-12 sm:py-20 border relative overflow-hidden'>
                  {/* Background image with overlay */}
                  <div className='absolute inset-0 z-0'>
                    <Image
                      src='/landing-analysis.png'
                      alt='Background'
                      fill
                      sizes='(max-width: 1024px) 100vw, 1024px'
                      className='object-cover object-center'
                    />
                    <div className='absolute inset-0 bg-background/90 backdrop-blur-sm'></div>
                  </div>

                  {/* Content */}
                  <div className='relative z-10'>
                    <h2 className='text-3xl sm:text-4xl md:text-5xl font-bold mb-6'>
                      Ready to transform your customer insights?
                    </h2>
                    <p className='text-muted-foreground text-base sm:text-lg mb-8 max-w-2xl mx-auto'>
                      Start generating synthetic personas and optimize your customer journey today.
                    </p>
                    <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
                      <Link href='/auth?tab=signin'>
                        <Button size='lg' className='w-full sm:w-[200px]'>
                          Try it for free
                        </Button>
                      </Link>
                      <Link
                        href='https://youtu.be/UImOEvPzvRo'
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <Button size='lg' variant='outline' className='w-full sm:w-[200px]'>
                          Watch Demo
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Transition element - creates a smooth fade from background to beam */}
        <div className='relative h-24 -mt-24 pointer-events-none'>
          <div className='absolute inset-0 bg-gradient-to-t from-transparent to-background dark:to-background z-10'></div>
        </div>

        {/* Email Updates Section */}
        <div id='stay-in-touch' className='border-t scroll-mt-24'>
          <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24'>
            <div className='max-w-3xl mx-auto text-center'>
              <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold mb-4'>Stay in the loop</h2>
              <p className='text-muted-foreground text-base sm:text-lg mb-8'>
                Get notified about our latest features and updates.
              </p>
              <EmailSubscriptionForm />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className='border-t'>
          <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
              <div>
                <Link href='/' className='flex items-center gap-2 mb-4'>
                  <Image
                    src='/genesys-logo.png'
                    alt='Genesys Logo'
                    width={32}
                    height={32}
                    className='h-8 w-8'
                  />
                  <span className='font-bold text-xl'>Genesys</span>
                </Link>
                <p className='text-sm text-muted-foreground mb-4 max-w-sm'>
                  Next-generation AI platform for customer behavior simulation and analysis.
                </p>
              </div>

              {[
                {
                  title: 'Product',
                  links: ['Features', 'Security', 'Pricing', 'Resources'],
                },
                {
                  title: 'Platform & Support',
                  links: ['Developer API', 'Documentation', 'Help Center', 'Contact us'],
                },
                {
                  title: 'Company',
                  links: ['About us', 'Blog', 'Terms', 'Privacy'],
                },
              ].map((section) => (
                <div key={section.title}>
                  <h3 className='font-semibold mb-3'>{section.title}</h3>
                  <ul className='space-y-2'>
                    {section.links.map((link) => (
                      <li key={link}>
                        <Link
                          href='#'
                          className='text-sm text-muted-foreground hover:text-primary transition-colors'
                        >
                          {link}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className='mt-12 pt-8 border-t'>
              <div className='flex flex-col sm:flex-row justify-between items-center gap-4'>
                <div className='text-sm text-muted-foreground'>
                  © {new Date().getFullYear()} Genesys. All rights reserved.
                </div>
                <div className='flex items-center gap-4'>
                  <Link href='#' className='text-sm text-muted-foreground hover:text-primary'>
                    Privacy
                  </Link>
                  <Link href='#' className='text-sm text-muted-foreground hover:text-primary'>
                    Terms
                  </Link>
                  <Link href='#' className='text-sm text-muted-foreground hover:text-primary'>
                    Cookies
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
