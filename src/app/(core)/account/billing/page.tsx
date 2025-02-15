'use client';

import { Button } from '@/components/custom/button';
import { PageTitle } from '@/components/custom/page-title';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, Receipt, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Mock data
const mockSubscriptionData = {
  plan: 'pro',
  status: 'active',
  nextBilling: '2024-04-01',
  amount: 49.99,
};

const mockInvoices = [
  { id: 1, date: '2024-03-01', amount: 49.99, status: 'paid' },
  { id: 2, date: '2024-02-01', amount: 49.99, status: 'paid' },
  { id: 3, date: '2024-01-01', amount: 49.99, status: 'paid' },
];

// Form schema
const paymentMethodSchema = z.object({
  cardNumber: z
    .string()
    .min(16, 'Card number must be 16 digits')
    .max(16, 'Card number must be 16 digits')
    .regex(/^\d+$/, 'Must contain only numbers'),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'Must be in MM/YY format'),
  cvv: z
    .string()
    .min(3, 'CVV must be 3 digits')
    .max(4, 'CVV must be 3-4 digits')
    .regex(/^\d+$/, 'Must contain only numbers'),
  cardholderName: z.string().min(3, 'Cardholder name is required'),
});

type PaymentMethodForm = z.infer<typeof paymentMethodSchema>;

export default function BillingPage() {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  // Form
  const form = useForm<PaymentMethodForm>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
    },
  });

  const onSubmit = async (data: PaymentMethodForm) => {
    setIsUpdating(true);
    try {
      // Simulate API call
      console.log('Updating payment method:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Payment method updated',
        description: 'Your payment method has been updated successfully.',
        variant: 'success',
      });

      form.reset();
    } catch (error) {
      console.error('Error updating payment method:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment method. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePlanChange = async (plan: string) => {
    setIsChangingPlan(true);
    try {
      // Simulate API call
      console.log('Changing plan to:', plan);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Plan updated',
        description: 'Your subscription plan has been updated successfully.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error changing plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to change plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPlan(false);
    }
  };

  return (
    <div className='w-full max-w-2xl mx-auto space-y-6'>
      <PageTitle
        title='Billing & Subscription'
        description='Manage your subscription plans, view billing history, update payment methods, and access invoices for your Genesys account.'
      />

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Wallet className='h-5 w-5' />
            Current Plan
          </CardTitle>
          <CardDescription>Your current subscription plan and status</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-sm font-medium'>Plan</p>
              <p className='text-2xl font-bold capitalize'>{mockSubscriptionData.plan}</p>
            </div>
            <div>
              <p className='text-sm font-medium'>Status</p>
              <p className='text-2xl font-bold capitalize'>{mockSubscriptionData.status}</p>
            </div>
            <div>
              <p className='text-sm font-medium'>Next Billing</p>
              <p className='text-2xl font-bold'>{mockSubscriptionData.nextBilling}</p>
            </div>
            <div>
              <p className='text-sm font-medium'>Amount</p>
              <p className='text-2xl font-bold'>${mockSubscriptionData.amount}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className='flex justify-between'>
          <Select disabled={isChangingPlan} onValueChange={handlePlanChange}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Change plan' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='starter'>Starter ($29/mo)</SelectItem>
              <SelectItem value='pro'>Pro ($49/mo)</SelectItem>
              <SelectItem value='enterprise'>Enterprise ($99/mo)</SelectItem>
            </SelectContent>
          </Select>
          <Button variant='outline' isLoading={isChangingPlan} loadingText='Cancelling...'>
            Cancel Subscription
          </Button>
        </CardFooter>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5' />
            Payment Method
          </CardTitle>
          <CardDescription>Update your payment method</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='cardNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card Number</FormLabel>
                    <FormControl>
                      <Input placeholder='1234 5678 9012 3456' {...field} maxLength={16} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='expiryDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input placeholder='MM/YY' {...field} maxLength={5} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='cvv'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CVV</FormLabel>
                      <FormControl>
                        <Input placeholder='123' {...field} maxLength={4} type='password' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='cardholderName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cardholder Name</FormLabel>
                    <FormControl>
                      <Input placeholder='John Doe' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type='submit'
                className='w-full'
                isLoading={isUpdating}
                loadingText='Updating...'
              >
                Update Payment Method
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Receipt className='h-5 w-5' />
            Billing History
          </CardTitle>
          <CardDescription>View your past invoices and payment history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {mockInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className='flex items-center justify-between p-4 rounded-lg border'
              >
                <div className='space-y-1'>
                  <p className='font-medium'>Invoice #{invoice.id}</p>
                  <p className='text-sm text-muted-foreground'>{invoice.date}</p>
                </div>
                <div className='space-y-1 text-right'>
                  <p className='font-medium'>${invoice.amount}</p>
                  <p className='text-sm capitalize text-green-600'>{invoice.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
