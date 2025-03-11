import { PageTitle } from '@/components/custom/page-title';
import { Card } from '@/components/ui/card';
import { LineChart } from 'lucide-react';

export default function SingleStepPage() {
  return (
    <div className='space-y-8'>
      <PageTitle
        title='Single Step Analysis'
        description='Deep dive into individual funnel steps to identify friction points and optimize conversion rates with AI-powered behavioral insights.'
      />

      <Card className='flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center animate-in fade-in-50'>
        <div className='rounded-full bg-primary/10 p-4'>
          <LineChart className='h-8 w-8 text-primary' />
        </div>
        <div className='space-y-2'>
          <h3 className='text-xl font-semibold tracking-tight'>Coming Soon</h3>
          <p className='text-sm text-muted-foreground max-w-[400px]'>
            We&apos;re developing powerful AI-driven analytics to help you understand and optimize
            each step of your funnel. Stay tuned for detailed insights!
          </p>
        </div>
      </Card>
    </div>
  );
}
