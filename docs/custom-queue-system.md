# Custom Queue System Implementation

## Overview

Due to issues with the PGMQ Supabase integration, we've implemented a custom queue system using regular Postgres tables. This avoids the schema access issues and provides a more flexible, robust solution for background processing.

## Architecture

### Database Schema

The queue system is built on a single table `queue_tasks` with the following key fields:

- `id`: Unique identifier for each task (prefixed with "task-")
- `queueName`: Name of the queue (e.g., "simulation_tasks", "failed_tasks")
- `status`: Current status of the task ("pending", "processing", "completed", "failed", "cancelled")
- `payload`: JSON data for the task (contains simulation-specific information)
- `visibleAfter`: Timestamp after which the task becomes visible for processing
- `processingStartedAt`: Timestamp when task started processing
- `processingCompletedAt`: Timestamp when task finished processing
- `errorMessage`: Error message if task failed
- `errorDetails`: Detailed error information
- `retryCount`: Number of times this task has been retried
- `createdAt`, `updatedAt`: Standard timestamps

### Server-Side Queue Management

The queue service (`src/lib/supabase/queue-service.ts`) provides functions for:

1. `enqueueSimulationTask`: Add a task to the queue
2. `dequeueSimulationTask`: Get a pending task for processing
3. `completeSimulationTask`: Mark a task as completed
4. `failSimulationTask`: Mark a task as failed and store error details
5. `retrySimulationTask`: Create a new task based on a failed one
6. `cleanupCompletedTasks`: Remove old completed tasks
7. `getQueueStats`: Get statistics about the queue

### Edge Function Processing

The Edge Function (`supabase/functions/process-simulation-queue/index.ts`) has been updated to:

1. Find and claim pending tasks from the `queue_tasks` table
2. Mark tasks as "processing" with an appropriate visibility timeout
3. Process the task using the OpenAI integration
4. Mark tasks as "completed" when done
5. Handle errors by storing detailed information in the failed tasks queue
6. Log performance metrics for monitoring

## Advantages Over PGMQ

1. **No Schema Issues**: Works with standard Postgres tables without requiring special schemas
2. **Better Error Handling**: More detailed error tracking and retry mechanisms
3. **Direct Database Access**: Can use all Drizzle ORM features for sophisticated queries
4. **Improved Monitoring**: Built-in statistics and better visibility into queue health
5. **Custom Workflow Support**: More flexible task payload and status handling
6. **Transaction Support**: Can use database transactions for reliable task processing

## Implementation Steps

1. Created `queue.ts` schema with task table definition
2. Created queue-service.ts with core queue operations
3. Updated the Edge Function to use our custom queue system
4. Updated server actions to enqueue tasks properly
5. Configured cron job to trigger the Edge Function regularly

## Usage

The queue system is designed to be used with the existing simulation workflow:

1. When a simulation is created, tasks are added to the queue
2. The Edge Function processes pending tasks in order
3. Tasks that fail are moved to a failed queue for later retry
4. Completed tasks can be automatically cleaned up

## Monitoring

To monitor the queue system:

1. Check the Supabase Edge Function logs for processing information
2. Query the `queue_tasks` table to see pending/processing/completed/failed tasks
3. Use the `getQueueStats` function to get aggregate statistics

## Future Improvements

1. Add a more sophisticated retry mechanism with exponential backoff
2. Implement queue prioritization for critical tasks
3. Add a dashboard for queue monitoring
4. Implement task dependencies for complex workflows
5. Add support for task cancellation
