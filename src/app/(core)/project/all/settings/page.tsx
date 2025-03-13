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
          <h3 className='text-xl font-semibold tracking-tight'>Not Available in Demo</h3>
          <p className='text-sm text-muted-foreground max-w-[400px]'>
            Project settings for managing permissions, subscriptions, and billing are not included
            in the demo version.
          </p>
        </div>
      </Card>
    </div>
  );
}
