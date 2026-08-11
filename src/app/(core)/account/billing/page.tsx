import { PageTitle } from '@/components/custom/page-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeCheck } from 'lucide-react';

export default function BillingPage() {
  return (
    <div className='container mx-auto space-y-6 p-6'>
      <PageTitle title='Billing' description='Plan and billing information' />

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BadgeCheck className='h-5 w-5 text-primary' aria-hidden='true' />
            Billing is not configured
          </CardTitle>
          <CardDescription>
            This application does not offer paid plans or process payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>
            No card details are collected, and no charges can be created from this application.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
