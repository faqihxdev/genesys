import env from '@/env';
import { getCurrentUser } from '@/server/auth';
import type { User } from '@supabase/supabase-js';
import { z } from 'zod';

/**
 * Get colored text based on execution time
 * @param ms - Time in milliseconds
 * @returns Colored string with timing
 */
function getColoredTiming(ms: number): string {
  // ANSI escape codes for colors
  const green = '\x1b[32m';
  const yellow = '\x1b[33m';
  const red = '\x1b[31m';
  const reset = '\x1b[0m';

  // Thresholds for different colors
  if (ms < 100) {
    return `${green}${ms}${reset}`;
  } else if (ms < 500) {
    return `${yellow}${ms}${reset}`;
  } else {
    return `${red}${ms}${reset}`;
  }
}

/**
 * Generic server action error type
 */
export type ActionError = {
  message: string;
  status: number;
  errors?: z.ZodError['errors'];
};

/**
 * Generic server action response type
 */
export type ActionResponse<T> = {
  data: T | null;
  error: ActionError | null;
};

/**
 * A unique symbol used for branding fail results.
 */
const FAIL_SYMBOL = Symbol('fail');

/**
 * The branded type used to signal an error.
 */
export type FailReturn = { [FAIL_SYMBOL]: true; error: ActionError };

/**
 * Use this helper to "return" an error from your action function.
 */
export function fail(error: ActionError): FailReturn {
  return { [FAIL_SYMBOL]: true, error } as FailReturn;
}

// A type guard for our FailReturn type.
function isFail<T>(result: T | FailReturn): result is FailReturn {
  return typeof result === 'object' && result !== null && FAIL_SYMBOL in result;
}

/* ----------------------------------------------------------------------------
   Overloads for createAction
   ----------------------------------------------------------------------------
   1. No validator, no auth.
---------------------------------------------------------------------------- */
export function createAction<TOutput>(config: {
  name?: string;
  validator: null;
  requireAuth: false;
  actionFn: (params: object) => Promise<TOutput | FailReturn>;
}): () => Promise<ActionResponse<TOutput>>;

/* ----------------------------------------------------------------------------
   2. With validator, no auth.
---------------------------------------------------------------------------- */
export function createAction<TInput, TOutput>(config: {
  name?: string;
  validator: z.ZodType<TInput>;
  requireAuth: false;
  actionFn: (params: { input: TInput }) => Promise<TOutput | FailReturn>;
}): (input: TInput) => Promise<ActionResponse<TOutput>>;

/* ----------------------------------------------------------------------------
   3. No validator, with auth.
---------------------------------------------------------------------------- */
export function createAction<TOutput>(config: {
  name?: string;
  validator: null;
  requireAuth: true;
  actionFn: (params: { currentUser: User }) => Promise<TOutput | FailReturn>;
}): () => Promise<ActionResponse<TOutput>>;

/* ----------------------------------------------------------------------------
   4. With validator, with auth.
---------------------------------------------------------------------------- */
export function createAction<TInput, TOutput>(config: {
  name?: string;
  validator: z.ZodType<TInput>;
  requireAuth: true;
  actionFn: (params: { input: TInput; currentUser: User }) => Promise<TOutput | FailReturn>;
}): (input: TInput) => Promise<ActionResponse<TOutput>>;

/* ----------------------------------------------------------------------------
   Implementation
---------------------------------------------------------------------------- */
export function createAction<TInput, TOutput>(config: {
  name?: string;
  validator: z.ZodType<TInput> | null;
  requireAuth: boolean;
  actionFn:
    | ((params: { input: TInput }) => Promise<TOutput | FailReturn>)
    | ((params: { currentUser: User }) => Promise<TOutput | FailReturn>)
    | ((params: { input: TInput; currentUser: User }) => Promise<TOutput | FailReturn>)
    | ((params: object) => Promise<TOutput | FailReturn>);
}) {
  return async (input?: TInput): Promise<ActionResponse<TOutput>> => {
    const startTime = performance.now();
    try {
      let currentUser: User | undefined = undefined;
      if (config.requireAuth) {
        const { data, error } = await getCurrentUser();
        if (error) return { data: null, error };
        if (!data) return { data: null, error: { message: 'Unauthorized', status: 401 } };
        currentUser = data;
      }

      if (config.validator) {
        const validatedInput = config.validator.parse(input);
        if (config.requireAuth) {
          const params: { input: TInput; currentUser: User } = {
            input: validatedInput,
            currentUser: currentUser!,
          };
          const fn = config.actionFn as (params: {
            input: TInput;
            currentUser: User;
          }) => Promise<TOutput | FailReturn>;
          const result = await fn(params);
          if (isFail(result)) return { data: null, error: result.error };
          return { data: result, error: null };
        } else {
          const params: { input: TInput } = { input: validatedInput };
          const fn = config.actionFn as (params: {
            input: TInput;
          }) => Promise<TOutput | FailReturn>;
          const result = await fn(params);
          if (isFail(result)) return { data: null, error: result.error };
          return { data: result, error: null };
        }
      } else {
        if (config.requireAuth) {
          const params: { currentUser: User } = { currentUser: currentUser! };
          const fn = config.actionFn as (params: {
            currentUser: User;
          }) => Promise<TOutput | FailReturn>;
          const result = await fn(params);
          if (isFail(result)) return { data: null, error: result.error };
          return { data: result, error: null };
        } else {
          const params: object = {};
          const fn = config.actionFn as (params: object) => Promise<TOutput | FailReturn>;
          const result = await fn(params);
          if (isFail(result)) return { data: null, error: result.error };
          return { data: result, error: null };
        }
      }
    } catch (error) {
      console.error('[createAction error]:', error);
      const isProd = env.NODE_ENV === 'production';
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
            message: isProd ? 'Unknown error occurred' : error.message,
            status: 'status' in error ? (error as ActionError).status : 500,
          },
        };
      }
      return {
        data: null,
        error: {
          message: isProd ? 'Unknown error occurred' : JSON.stringify(error),
          status: 500,
        },
      };
    } finally {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      // Only log in development
      if (env.NODE_ENV !== 'production') {
        console.log(` >>> ${config.name ? `${config.name}` : ''} ${getColoredTiming(duration)} ms`);
      }
    }
  };
}
