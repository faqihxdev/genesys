'use client';

import { Button } from '@/components/custom/button';
import { PageTitle } from '@/components/custom/page-title';
import { Spinner } from '@/components/custom/spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/query-client';
import { queryKey } from '@/lib/query-keys';
import { withQuery } from '@/lib/utils';
import {
  addTicketResponse,
  createSupportTicket,
  deleteTicket,
  getUserTickets,
} from '@/server/support';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Clock, Inbox, MessageSquare, MessagesSquare, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Form schema
const ticketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  category: z.enum(['technical', 'billing', 'feature', 'other'], {
    required_error: 'Please select a category',
  }),
  priority: z.enum(['low', 'medium', 'high'], {
    required_error: 'Please select a priority',
  }),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description must not exceed 1000 characters'),
});

type TicketForm = z.infer<typeof ticketSchema>;

// Response form schema
const responseSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

type ResponseForm = z.infer<typeof responseSchema>;

export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Ticket submission form
  const ticketForm = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: '',
      category: undefined,
      priority: undefined,
      description: '',
    },
  });

  // Response form
  const responseForm = useForm<ResponseForm>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      message: '',
    },
  });

  // Query to get user's tickets
  const { data: userTickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: queryKey.support.getUserTickets(),
    queryFn: withQuery(getUserTickets),
    enabled: !!user?.id,
  });

  // Mutation to create ticket
  const { mutate: submitTicket, isPending: isSubmittingTicket } = useMutation({
    mutationFn: withQuery(createSupportTicket),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKey.support.getUserTickets(),
      });

      toast({
        title: 'Ticket submitted',
        description: 'Your support ticket has been submitted successfully.',
        variant: 'success',
      });

      ticketForm.reset();
    },
    onError: (error) => {
      console.error('Error submitting ticket:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit ticket. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Mutation to add response
  const { mutate: submitResponse, isPending: isSubmittingResponse } = useMutation({
    mutationFn: withQuery(addTicketResponse),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKey.support.getUserTickets(),
      });

      toast({
        title: 'Response added',
        description: 'Your response has been added successfully.',
      });

      responseForm.reset();
    },
    onError: (error) => {
      console.error('Error adding response:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add response. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Mutation to delete ticket
  const { mutate: deleteTicketItem, isPending: isDeletingTicket } = useMutation({
    mutationFn: withQuery(deleteTicket),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKey.support.getUserTickets(),
      });

      toast({
        title: 'Ticket deleted',
        description: 'Your support ticket has been deleted successfully.',
      });
    },
    onError: (error) => {
      console.error('Error deleting ticket:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete ticket. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmitTicket = (data: TicketForm) => {
    submitTicket(data);
  };

  const onSubmitResponse = (data: ResponseForm) => {
    if (!selectedTicketId) return;
    submitResponse({
      ticketId: selectedTicketId,
      message: data.message,
    });
  };

  return (
    <div className='w-full max-w-2xl mx-auto space-y-6'>
      <PageTitle
        title='Support Center'
        description='Get assistance with your Genesys experience. Contact our support team, submit tickets, and track the status of your support requests.'
      />

      {/* Submit Ticket */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MessageSquare className='h-5 w-5' />
            Submit Support Ticket
          </CardTitle>
          <CardDescription>
            Describe your issue in detail and we&apos;ll get back to you as soon as possible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...ticketForm}>
            <form onSubmit={ticketForm.handleSubmit(onSubmitTicket)} className='space-y-4'>
              <FormField
                control={ticketForm.control}
                name='subject'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder='Brief description of your issue' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={ticketForm.control}
                  name='category'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select category' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='technical'>Technical Issue</SelectItem>
                          <SelectItem value='billing'>Billing</SelectItem>
                          <SelectItem value='feature'>Feature Request</SelectItem>
                          <SelectItem value='other'>Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ticketForm.control}
                  name='priority'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select priority' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='low'>Low</SelectItem>
                          <SelectItem value='medium'>Medium</SelectItem>
                          <SelectItem value='high'>High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={ticketForm.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Provide detailed information about your issue'
                        className='min-h-[150px]'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Include any relevant details that might help us assist you better
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex items-center justify-end gap-4 pt-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => ticketForm.reset()}
                  disabled={isSubmittingTicket}
                >
                  Reset Form
                </Button>
                <Button type='submit' isLoading={isSubmittingTicket} loadingText='Submitting...'>
                  Submit Ticket
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MessagesSquare className='h-5 w-5' />
            Your Support Tickets
          </CardTitle>
          <CardDescription>Track the status of your support requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {isLoadingTickets ? (
              <div className='flex justify-center p-8'>
                <Spinner size='lg' />
              </div>
            ) : userTickets.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-8 text-center'>
                <div className='rounded-full bg-muted p-3 mb-4'>
                  <Inbox className='h-6 w-6 text-primary' />
                </div>
                <h3 className='font-medium text-lg mb-1'>No tickets yet</h3>
                <p className='text-sm text-muted-foreground max-w-sm'>
                  You haven&apos;t submitted any support tickets yet. Create one if you need
                  assistance!
                </p>
              </div>
            ) : (
              userTickets.map((ticket) => (
                <div key={ticket.id} className='flex flex-col p-4 rounded-lg border relative'>
                  <Button
                    variant='ghost'
                    className='absolute top-3 right-3 h-8 px-2 text-muted-foreground hover:text-destructive'
                    onClick={() => deleteTicketItem({ ticketId: ticket.id })}
                    isLoading={isDeletingTicket}
                    loadingText='Deleting...'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                  <div className='flex-1'>
                    <h4 className='font-medium pr-10'>{ticket.subject}</h4>
                    <p className='text-sm text-muted-foreground'>{ticket.description}</p>

                    {/* Responses */}
                    {ticket.responses && ticket.responses.length > 0 && (
                      <div className='mt-4 space-y-3 border rounded-md p-4'>
                        {ticket.responses.map((response) => (
                          <div
                            key={response.id}
                            className={`p-3 rounded-md ${
                              response.isFromSupport ? 'bg-primary/10 ml-4' : 'bg-muted/50 mr-4'
                            }`}
                          >
                            <p className='text-sm font-medium'>
                              {response.isFromSupport ? 'Support Team' : 'You'}
                            </p>
                            <p className='text-sm text-muted-foreground'>{response.message}</p>
                            <p className='text-xs text-muted-foreground mt-1'>
                              {format(new Date(response.createdAt), 'MMM d, yyyy HH:mm')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Response */}
                    {ticket.status !== 'closed' && (
                      <div className='mt-4'>
                        <Form {...responseForm}>
                          <form
                            onSubmit={responseForm.handleSubmit(onSubmitResponse)}
                            className='flex items-start gap-2'
                          >
                            <FormField
                              control={responseForm.control}
                              name='message'
                              render={({ field }) => (
                                <FormItem className='flex-1'>
                                  <FormControl>
                                    <Input
                                      placeholder='Type your response...'
                                      className='h-10'
                                      {...field}
                                      onFocus={() => setSelectedTicketId(ticket.id)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type='submit'
                              size='icon'
                              className='h-10 w-10'
                              disabled={isSubmittingResponse}
                              onClick={() => setSelectedTicketId(ticket.id)}
                            >
                              {isSubmittingResponse ? (
                                <Spinner size='sm' />
                              ) : (
                                <Send className='h-4 w-4' />
                              )}
                              <span className='sr-only'>Send response</span>
                            </Button>
                          </form>
                        </Form>
                      </div>
                    )}

                    <div className='flex items-center justify-between mt-4'>
                      <div className='flex items-center gap-2'>
                        <Clock className='h-3 w-3 text-muted-foreground' />
                        <p className='text-xs text-muted-foreground'>
                          Created: {format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='px-2 py-1 rounded-md text-xs capitalize bg-muted text-muted-foreground'>
                          {ticket.category}
                        </span>
                        <span className='px-2 py-1 rounded-md text-xs capitalize bg-muted text-muted-foreground'>
                          {ticket.priority}
                        </span>
                        <span className='px-2 py-1 rounded-md text-xs capitalize bg-muted text-muted-foreground'>
                          {ticket.status.replace(/-/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
