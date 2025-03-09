# Funnel Simulation Implementation Plan

## Overview
This document outlines the step-by-step plan for implementing the funnel simulation feature in the Genesys platform. The feature will allow users to simulate how personas from selected persona configurations interact with marketing funnels.

## Implementation Phases

### Phase 1: Schema Modifications

- [x] **Create ResponseStage Table**
  - [x] Define schema for `responseStages` table with fields:
    - `id` (primary key)
    - `simulationId` (foreign key to simulations)
    - `personaId` (foreign key to personas)
    - `stageId` (foreign key to stages)
    - `proceed` (boolean)
    - `proceedReason` (text)
    - `nextStageId` (foreign key to stages, nullable)
    - timestamps
  - [x] Create indexes for performance optimization
  - [x] Set up foreign key relationships
  - [x] Create TypeScript types and interfaces

- [x] **Update Response Schema**
  - [x] Refocus `responses` table to handle only item-level responses:
    - Remove `proceed` and `proceedReason` fields (moving to `responseStages`)
  - [x] Update TypeScript types and interfaces
  - [x] Update any existing code that references removed fields

- [x] **Add Simulation Configuration Options**
  - [x] Add `parametersJson` text field to `simulations` table for storing configuration options
  - [x] Define TypeScript interfaces for simulation parameters
  - [x] Create migration file for schema changes

- [x] **Update Affected Analysis Code**
  - [x] Modify `getSimulationAnalysis` to work with the new schema structure
  - [x] Update `SimulationQueryResult` interface to include new fields
  - [x] Adjust query joins to fetch proceed data from `responseStages` table
  - [x] Update `ResponseWithDetails` interface to handle the joined data

### Phase 2: Supabase Queue Setup

- [x] **Implement PGMQ in Supabase**
  - [x] Research current Supabase implementation details for PGMQ
  - [x] Configure Queue Schema in Supabase (already enabled in pgmq schema)
  - [x] Create simulation queue and dead-letter queue
  - [x] Define SQL setup for queue tables

- [x] **Create Queue Helper Functions**
  - [x] Implement `enqueueSimulationChunk` function for adding simulation tasks
  - [x] Implement `dequeueSimulationChunk` function for processing simulation tasks
  - [x] Add error handling and retry logic
  - [x] Create TypeScript types for queue messages

- [x] **Create Edge Function for Queue Processing**
  - [x] Set up Supabase Edge Function for processing queue messages
  - [x] Implement basic queue processing logic
  - [x] Set up error handling and reporting
  - [x] Create placeholder for full simulation processing logic (to be implemented in Phase 4)

### Phase 3: Server Actions Implementation

- [x] **Create Simulation Management Actions**
  - [x] Implement `createSimulation` action:
    - Validate inputs (funnelId, personaConfigId)
    - Create simulation record
    - Initialize simulation stages
    - Return simulation ID
  - [x] Implement `getSimulationStatus` action:
    - Retrieve current status of a simulation
    - Include progress metrics (completed/total personas)
    - Handle error states
  - [x] Implement `cancelSimulation` action:
    - Mark simulation as cancelled
    - Clean up any pending queue items

- [x] **Implement Queue Management Actions**
  - [x] Create `queueSimulationInitialChunks` function:
    - Break simulation into manageable chunks
    - Add chunks to queue
    - Update simulation status
  - [x] Integrate with createSimulation action to automatically queue initial chunks
  - [x] Implement logic to find starting stages based on funnel structure

### Phase 4: OpenAI Integration

- [x] **Design Prompt Templates**
  - [x] Create base prompt template for persona simulation
  - [x] Design structured output format using tool_calls
  - [x] Implement context formatting for funnel/stage/items

- [x] **Implement OpenAI Service**
  - [x] Create `generatePersonaResponse` function:
    - [x] Format prompt with persona, funnel, stage, and item data
    - [x] Call OpenAI API with appropriate parameters
    - [x] Parse and validate response
    - [x] Handle rate limiting and retries
  - [x] Implement response parsing logic:
    - [x] Extract responses for each stage item
    - [x] Extract proceed decision and reason
    - [x] Handle error cases and edge conditions

- [x] **Create Simulation Logic**
  - [x] Implement `processSimulationChunk` function:
    - [x] Get persona traits
    - [x] Get stage and items data
    - [x] Generate persona responses
    - [x] Store responses in database
    - [x] Determine next stage based on proceed decision and stage links
  - [x] Implement path selection logic for branching funnels

### Phase 5: Background Processing

- [x] **Custom Queue System Implementation**
  - [x] Create custom queue system using Postgres tables
  - [x] Implement queue service utilities
  - [x] Update server actions to use custom queue
  - [x] Configure cron schedule for processing simulation queue
  - [x] Configure monitoring and alerting
  - [x] Test cron job execution

- [x] **Deploy Edge Function**
  - [x] Update edge function to use custom queue system
  - [x] Deploy the edge function to Supabase
  - [x] Set up appropriate environment variables
  - [x] Test end-to-end processing flow

- [x] **Implement Progress Tracking**
  - [x] Create database triggers for updating simulation status
  - [x] Implement real-time progress updates
  - [x] Add detailed logging for troubleshooting
  - [x] Add queue statistics and monitoring tools

### Phase 6: UI Implementation

- [x] **Add Persona Config Selection**
  - [x] Create persona config dropdown in funnel page
  - [x] Implement fetching of persona configs for the project
  - [x] Add validation and error handling

- [x] **Implement Simulation Controls**
  - [x] Add "Simulate" button with proper validation
  - [x] Create simulation options modal with parameters
  - [x] Implement simulation status indicator with progress bar
  - [x] Add cancel simulation functionality

- [ ] **Create Simulation Results View**
  - [ ] Design compact simulation results summary
  - [ ] Implement detailed results view
  - [ ] Add filtering and sorting options for results
  - [ ] Create visualization for simulation paths

## Technical Notes

### Chunking Strategy
For simulations that exceed Vercel's time limits (60 seconds max), we'll use the following chunking approach:
1. Process one persona at a time
2. For each persona, process one stage at a time
3. Update simulation status after each chunk
4. Queue the next chunk for processing

### OpenAI API Configuration
- Model: GPT-4o-mini (optimized for performance)
- Temperature: 0.7 (balance between consistency and creativity)
- Max tokens: 2048 (balance between context and response space)
- Tool call format: Structured JSON output with responses, sentiment, and proceed decision

### Error Handling
- Implement retries for transient errors
- Store detailed error information in the database
- Provide user-friendly error messages
- Create an admin view for monitoring failed simulations

### Performance Considerations
- Use batch operations for database updates
- Implement efficient query patterns
- Consider caching frequently accessed data
- Monitor API usage and optimize as needed 