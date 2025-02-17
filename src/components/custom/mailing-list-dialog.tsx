'use client';

import { Button } from '@/components/custom/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/query-client';
import { queryKey } from '@/lib/query-keys';
import { withQuery } from '@/lib/utils';
import { isEmailSubscribed, subscribeToMailingList } from '@/server/mailing-list';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const mailingListSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
});

type MailingListForm = z.infer<typeof mailingListSchema>;

interface MailingListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
  onSuccess?: () => void;
}

export function MailingListDialog({
  open,
  onOpenChange,
  defaultEmail = '',
  onSuccess,
}: MailingListDialogProps) {
  const { toast } = useToast();

  const form = useForm<MailingListForm>({
    resolver: zodResolver(mailingListSchema),
    defaultValues: {
      email: defaultEmail,
      description: '',
    },
  });

  // Check if email is already subscribed
  const { data: isSubscribed } = useQuery({
    queryKey: queryKey.mailingList.isEmailSubscribed({ email: form.watch('email') }),
    queryFn: () => withQuery(isEmailSubscribed)({ email: form.watch('email') }),
    enabled: !!form.watch('email') && form.watch('email').includes('@'),
  });

  // Subscribe mutation
  const { mutate: subscribe, isPending } = useMutation({
    mutationFn: (data: MailingListForm) => withQuery(subscribeToMailingList)(data),
    onSuccess: () => {
      toast({
        title: 'Subscribed successfully',
        description: 'Thank you for subscribing to our mailing list!',
        variant: 'success',
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: queryKey.mailingList.isEmailSubscribed({ email: form.getValues('email') }),
      });

      queryClient.invalidateQueries({
        queryKey: queryKey.mailingList.getSubscriptionByEmail({ email: form.getValues('email') }),
      });

      onSuccess?.();
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Subscription failed',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive',
      });
    },
  });

  // Update email when defaultEmail changes
  useEffect(() => {
    if (defaultEmail) {
      form.setValue('email', defaultEmail);
    }
  }, [defaultEmail, form]);

  const onSubmit = (data: MailingListForm) => {
    if (isSubscribed) {
      toast({
        title: 'Already subscribed',
        description: 'This email is already subscribed to our mailing list.',
        variant: 'default',
      });
      return;
    }

    subscribe(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Subscribe to Updates</DialogTitle>
          <DialogDescription>Stay informed about new features & updates.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type='email' placeholder='Enter your email' {...field} />
                  </FormControl>
                  <FormMessage>{isSubscribed && 'This email is already subscribed'}</FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder='What interests you about Genesys? (Optional)'
                      className='resize-none'
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type='submit'
                disabled={isPending || isSubscribed}
                className='w-full sm:w-auto'
              >
                {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isSubscribed ? 'Already Subscribed' : 'Subscribe'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
