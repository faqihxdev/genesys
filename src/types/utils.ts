/**
 * @description Generic server action error type
 */
export interface ActionError {
  message: string;
  status?: number;
}

/**
 * @description Generic server action response type
 */
export interface ActionResponse<T = void> {
  data: T | null;
  error: ActionError | null;
}
