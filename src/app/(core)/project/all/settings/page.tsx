import { PageTitle } from '@/components/custom/page-title';
import { Card } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function ProjectSettingsPage() {
  return (
    <div className='space-y-8'>
      <PageTitle
        title='Project Settings'
        description='Manage your subscription plans, view billing history, update payment methods, and access invoices for your Genesys account.'
      />

      <Card className='flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center animate-in fade-in-50'>
        <div className='rounded-full bg-primary/10 p-4'>
          <Settings className='h-8 w-8 text-primary' />
        </div>
        <div className='space-y-2'>
          <h3 className='text-xl font-semibold tracking-tight'>Coming Soon</h3>
          <p className='text-sm text-muted-foreground max-w-[400px]'>
            We&apos;re working on advanced project settings and management features to give you more
            control over your Genesys experience. Stay tuned for updates!
          </p>
        </div>
      </Card>
    </div>
  );
}
