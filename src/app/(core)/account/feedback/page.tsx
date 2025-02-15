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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { createFeedback, deleteFeedback, getUserFeedback } from '@/server/feedback';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Clock, Inbox, MessageSquare, MessagesSquare, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Form schema
const feedbackSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  type: z.enum(['bug', 'feature', 'improvement', 'other'], {
    required_error: 'Please select a feedback type',
  }),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description must not exceed 1000 characters'),
  satisfaction: z.enum(
    ['very-satisfied', 'satisfied', 'neutral', 'dissatisfied', 'very-dissatisfied'],
    {
      required_error: 'Please rate your satisfaction',
    }
  ),
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

export default function FeedbackPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Form with proper defaultValues and mode
  const form = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      title: '',
      type: undefined,
      description: '',
      satisfaction: undefined,
    },
    mode: 'onTouched',
  });

  // Query to get user's feedback
  const { data: userFeedback = [], isLoading: isLoadingUserFeedback } = useQuery({
    queryKey: queryKey.feedback.getUserFeedback(),
    queryFn: withQuery(getUserFeedback),
    enabled: !!user?.id,
  });

  // Mutation to create feedback
  const { mutate: submitFeedback, isPending } = useMutation({
    mutationFn: withQuery(createFeedback),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKey.feedback.getUserFeedback(),
      });

      toast({
        title: 'Feedback submitted',
        description: 'Thank you for your feedback! We appreciate your input.',
        variant: 'success',
      });

      form.reset({
        title: '',
        type: undefined,
        description: '',
        satisfaction: undefined,
      });
    },
    onError: (error: any) => {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Mutation to delete feedback
  const { mutate: deleteFeedbackItem, isPending: isDeleting } = useMutation({
    mutationFn: withQuery(deleteFeedback),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKey.feedback.getUserFeedback(),
      });

      toast({
        title: 'Feedback deleted',
        description: 'Your feedback has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Error deleting feedback:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete feedback. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: FeedbackForm) => {
    submitFeedback(data);
  };

  return (
    <div className='w-full max-w-2xl mx-auto space-y-6'>
      <PageTitle
        title='Feedback & Suggestions'
        description='Share your thoughts, report issues, and suggest improvements to help us enhance your Genesys experience and shape the future of our platform.'
      />

      {/* Submit Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MessageSquare className='h-5 w-5' />
            Submit Feedback
          </CardTitle>
          <CardDescription>
            Help us improve by sharing your thoughts and suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder='Brief title for your feedback' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='bug'>Bug Report</SelectItem>
                        <SelectItem value='feature'>Feature Request</SelectItem>
                        <SelectItem value='improvement'>Improvement</SelectItem>
                        <SelectItem value='other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Provide detailed information about your feedback'
                        className='min-h-[150px]'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Be specific and include examples if possible</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='satisfaction'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall Satisfaction</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className='flex flex-col space-y-1'
                      >
                        <FormItem className='flex items-center space-x-3 space-y-0'>
                          <FormControl>
                            <RadioGroupItem value='very-satisfied' />
                          </FormControl>
                          <FormLabel className='font-normal'>Very Satisfied</FormLabel>
                        </FormItem>
                        <FormItem className='flex items-center space-x-3 space-y-0'>
                          <FormControl>
                            <RadioGroupItem value='satisfied' />
                          </FormControl>
                          <FormLabel className='font-normal'>Satisfied</FormLabel>
                        </FormItem>
                        <FormItem className='flex items-center space-x-3 space-y-0'>
                          <FormControl>
                            <RadioGroupItem value='neutral' />
                          </FormControl>
                          <FormLabel className='font-normal'>Neutral</FormLabel>
                        </FormItem>
                        <FormItem className='flex items-center space-x-3 space-y-0'>
                          <FormControl>
                            <RadioGroupItem value='dissatisfied' />
                          </FormControl>
                          <FormLabel className='font-normal'>Dissatisfied</FormLabel>
                        </FormItem>
                        <FormItem className='flex items-center space-x-3 space-y-0'>
                          <FormControl>
                            <RadioGroupItem value='very-dissatisfied' />
                          </FormControl>
                          <FormLabel className='font-normal'>Very Dissatisfied</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex items-center justify-end gap-4 pt-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    form.reset({
                      title: '',
                      type: undefined,
                      description: '',
                      satisfaction: undefined,
                    });
                  }}
                  disabled={isPending}
                >
                  Reset Form
                </Button>
                <Button type='submit' isLoading={isPending} loadingText='Submitting...'>
                  Submit Feedback
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Past Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MessagesSquare className='h-5 w-5' />
            Your Past Feedback
          </CardTitle>
          <CardDescription>View and track the status of your submitted feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {isLoadingUserFeedback ? (
              <div className='flex justify-center p-8'>
                <Spinner size='lg' />
              </div>
            ) : userFeedback.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-8 text-center'>
                <div className='rounded-full bg-muted p-3 mb-4'>
                  <Inbox className='h-6 w-6 text-muted-foreground animate-pulse' />
                </div>
                <h3 className='font-medium text-lg mb-1'>No feedback yet</h3>
                <p className='text-sm text-muted-foreground max-w-sm'>
                  We'd love to hear your thoughts on how we can improve your experience!
                </p>
              </div>
            ) : (
              userFeedback.map((feedback) => (
                <div key={feedback.id} className='flex flex-col p-4 rounded-lg border relative'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-destructive'
                    onClick={() => deleteFeedbackItem({ feedbackId: feedback.id })}
                    isLoading={isDeleting}
                  >
                    <Trash2 className='h-4 w-4' />
                    <span className='sr-only'>Delete feedback</span>
                  </Button>
                  <div className='flex-1'>
                    <h4 className='font-medium pr-10'>{feedback.title}</h4>
                    <p className='text-sm text-muted-foreground'>{feedback.description}</p>
                    {feedback.adminResponse && (
                      <div className='mt-2 p-3 bg-muted/50 rounded-md'>
                        <p className='text-sm font-medium'>Admin Response:</p>
                        <p className='text-sm text-muted-foreground'>{feedback.adminResponse}</p>
                      </div>
                    )}
                    <div className='flex items-center justify-between mt-4'>
                      <div className='flex items-center gap-2'>
                        <Clock className='h-3 w-3 text-muted-foreground' />
                        <p className='text-xs text-muted-foreground'>
                          Submitted: {new Date(feedback.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='px-2 py-1 rounded-md text-xs capitalize bg-muted text-muted-foreground'>
                          {feedback.type}
                        </span>
                        <span className='px-2 py-1 rounded-md text-xs capitalize bg-muted text-muted-foreground'>
                          {feedback.status}
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
