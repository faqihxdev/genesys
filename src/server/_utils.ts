import { getCurrentUser } from '@/server/auth';
import type { User } from '@supabase/supabase-js';
import { z } from 'zod';

/**
 * @description Generic server action error type
 */
export type ActionError = {
  message: string;
  status: number;
  errors?: z.ZodError['errors'];
};

/**
 * @description Generic server action response type
 */
export type ActionResponse<T> = {
  data: T | null;
  error: ActionError | null;
};

/* ----------------------------------------------------------------------------
   Overloads for createAction
   ----------------------------------------------------------------------------
   1. No validator, no auth.
---------------------------------------------------------------------------- */
export function createAction<TOutput>(config: {
  validator: null;
  requireAuth: false;
  actionFn: (params: {}) => Promise<TOutput>;
}): () => Promise<ActionResponse<TOutput>>;

/* ----------------------------------------------------------------------------
   2. With validator, no auth.
---------------------------------------------------------------------------- */
export function createAction<TInput, TOutput>(config: {
  validator: z.ZodType<TInput>;
  requireAuth: false;
  actionFn: (params: { input: TInput }) => Promise<TOutput>;
}): (input: TInput) => Promise<ActionResponse<TOutput>>;

/* ----------------------------------------------------------------------------
   3. No validator, with auth.
---------------------------------------------------------------------------- */
export function createAction<TOutput>(config: {
  validator: null;
  requireAuth: true;
  actionFn: (params: { currentUser: User }) => Promise<TOutput>;
}): () => Promise<ActionResponse<TOutput>>;

/* ----------------------------------------------------------------------------
   4. With validator, with auth.
---------------------------------------------------------------------------- */
export function createAction<TInput, TOutput>(config: {
  validator: z.ZodType<TInput>;
  requireAuth: true;
  actionFn: (params: { input: TInput; currentUser: User }) => Promise<TOutput>;
}): (input: TInput) => Promise<ActionResponse<TOutput>>;

/* ----------------------------------------------------------------------------
   Implementation
---------------------------------------------------------------------------- */
export function createAction<TInput, TOutput>(config: {
  validator: z.ZodType<TInput> | null;
  requireAuth: boolean;
  actionFn:
    | ((params: { input: TInput }) => Promise<TOutput>)
    | ((params: { currentUser: User }) => Promise<TOutput>)
    | ((params: { input: TInput; currentUser: User }) => Promise<TOutput>)
    | ((params: {}) => Promise<TOutput>);
}) {
  return async (input?: TInput): Promise<ActionResponse<TOutput>> => {
    try {
      let currentUser: User | undefined = undefined;
      if (config.requireAuth) {
        const { data, error } = await getCurrentUser();
        if (error) throw error;
        if (!data) throw new Error('Unauthorized');
        currentUser = data;
      }

      // Branch based on the provided options.
      if (config.validator) {
        // Validate the input using the provided Zod schema.
        const validatedInput = config.validator.parse(input);
        if (config.requireAuth) {
          // Branch: with validator and auth.
          const params: { input: TInput; currentUser: User } = {
            input: validatedInput,
            currentUser: currentUser!,
          };
          const fn = config.actionFn as (params: {
            input: TInput;
            currentUser: User;
          }) => Promise<TOutput>;
          const data = await fn(params);
          return { data, error: null };
        } else {
          // Branch: with validator but no auth.
          const params: { input: TInput } = { input: validatedInput };
          const fn = config.actionFn as (params: { input: TInput }) => Promise<TOutput>;
          const data = await fn(params);
          return { data, error: null };
        }
      } else {
        // No validator provided.
        if (config.requireAuth) {
          // Branch: no validator, but auth is required.
          const params: { currentUser: User } = { currentUser: currentUser! };
          const fn = config.actionFn as (params: { currentUser: User }) => Promise<TOutput>;
          const data = await fn(params);
          return { data, error: null };
        } else {
          // Branch: no validator and no auth.
          const params: {} = {};
          const fn = config.actionFn as (params: {}) => Promise<TOutput>;
          const data = await fn(params);
          return { data, error: null };
        }
      }
    } catch (error: any) {
      console.error('[createAction error]:', error);
      if (error instanceof z.ZodError) {
        return {
          data: null,
          error: {
            message: 'Validation failed',
            status: 400,
            errors: error.errors,
          },
        };
      }
      if (error instanceof Error) {
        return {
          data: null,
          error: {
            message: error.message,
            status: 'status' in error ? (error as any).status : 500,
          },
        };
      }
      throw error;
    }
  };
}
