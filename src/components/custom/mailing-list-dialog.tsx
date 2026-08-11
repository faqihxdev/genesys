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
import { withQuery } from '@/lib/utils';
import { subscribeToMailingList } from '@/server/mailing-list';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
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

  // Subscribe mutation
  const { mutate: subscribe, isPending } = useMutation({
    mutationFn: (data: MailingListForm) => withQuery(subscribeToMailingList)(data),
    onSuccess: () => {
      toast({
        title: 'Subscribed successfully',
        description: 'Thank you for subscribing to our mailing list!',
        variant: 'success',
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
                  <FormMessage />
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
              <Button type='submit' disabled={isPending} className='w-full sm:w-auto'>
                {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Subscribe
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
