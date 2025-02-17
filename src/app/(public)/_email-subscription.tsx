'use client';

import { Button } from '@/components/custom/button';
import { MailingListDialog } from '@/components/custom/mailing-list-dialog';
import { useState } from 'react';

/**
 * Email subscription form component with mailing list dialog
 * Used in the landing page to collect email subscriptions
 */
export function EmailSubscriptionForm() {
  const [email, setEmail] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setShowDialog(true);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className='flex flex-col sm:flex-row items-center gap-4 sm:gap-3 max-w-xl mx-auto'
      >
        <div className='flex-1 w-full'>
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='Enter your email address'
            className='h-12 sm:h-14 px-6 rounded-lg border bg-background text-base w-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors'
          />
        </div>
        <Button
          type='submit'
          size='lg'
          className='whitespace-nowrap w-full sm:w-auto h-12 sm:h-14 text-base px-8'
        >
          Keep Me Updated
        </Button>
      </form>

      <MailingListDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        defaultEmail={email}
        onSuccess={() => setEmail('')}
      />
    </>
  );
}
