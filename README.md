# 🌟 Genesys

A generative AI-powered platform that creates diverse synthetic customer personas to simulate unique behaviors through marketing funnels, revealing friction points and conversion triggers for global campaign optimization.

## 📸 Screenshot

![Genesys Platform Screenshot](./.github/docs/screenshot.png)
_AI-Powered Customer Behavior Simulation Platform_

## 🚀 Features

- 🤖 AI-Powered Persona Generation
- 📊 Marketing Funnel Simulation
- 📈 Conversion Analysis
- 🎯 Friction Point Detection
- 🔄 Campaign Optimization
- 👥 Team Collaboration
- 📨 Notification System
- 🎫 Support System

## 🛠️ Tech Stack

- ⚛️ **Frontend Framework**: React 19 with NextJS 15
- 🔷 **Language**: TypeScript
- 🎨 **Styling**: Tailwind CSS + ShadcnUI
- 🔄 **State Management**: Jotai
- 🎯 **Form Handling**: React Hook Form
- ✨ **Icons**: Lucide React
- 🔍 **Data Fetching**: Tanstack Query
- 🗄️ **Database**: Supabase
- 🔒 **Authentication**: Supabase Auth
- 📦 **Package Manager**: pnpm
- 🚀 **Deployment**: Vercel
- ✅ **Validation**: Zod

## 📁 Project Structure

```
src/
├── app/             # Next.js app router pages
├── components/      # Reusable components
├── db/             # Database schemas and utilities
├── hooks/          # Custom React hooks
├── lib/            # Utilities and libraries
├── server/         # Server actions
├── stores/         # Jotai state management
├── middleware.ts   # Next.js middleware
├── env.js          # Environment variables
└── types.ts        # TypeScript definitions
```

## 🏗️ Architecture

### Database Schema

- Drizzle ORM with PostgreSQL
- Consistent ID generation with prefixes
- Timestamp tracking (created, updated, deleted)
- Strong typing with TypeScript
- Optimized indexing

### Server Actions

- Type-safe server functions
- Built-in Zod validation
- Comprehensive error handling
- Authentication middleware
- Clear separation of concerns

### API Patterns

- RESTful CRUD operations
- Server-side validation
- Type-safe query keys
- Error handling and logging
- Auth checks and middleware

## 🚦 Getting Started

1. **Prerequisites**

   ```bash
   node >= 18.0.0
   pnpm >= 9.0.0
   ```

2. **Installation**

   ```bash
   pnpm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   # Fill in your environment variables
   ```

4. **Database Setup**

   ```bash
   pnpm db:generate  # Generate migrations
   pnpm db:push     # Push to database
   ```

5. **Development**

   ```bash
   pnpm dev
   ```

6. **Build**

   ```bash
   pnpm build
   pnpm start
   ```

## 🧪 Development Guidelines

### Coding Standards

- Use JSDocs for functions and components
- Follow TypeScript best practices
- Implement proper error handling
- Write mobile-responsive components
- Support both light and dark themes

### Component Guidelines

- Use ShadcnUI when possible
- Implement proper loading states
- Handle all error cases
- Follow accessibility best practices
- Use React Hook Form for forms

### State Management

- Use Jotai for global state
- Keep state close to where it's used
- Implement proper loading states
- Handle error states
- Use proper TypeScript types

## 📖 Development Guide

### Server Actions Pattern

```typescript
// Example of a server action with error handling
export const createProject = createAction({
  // Zod validator for input
  validator: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
  }),
  // Require authentication
  requireAuth: true,
  // Action implementation
  actionFn: async ({ input, currentUser }) => {
    // Check permissions
    const { data: hasAccess, error: accessError } = await checkAccess(input.projectId);
    if (accessError) return fail(accessError);
    if (!hasAccess) {
      return fail({ message: 'Access denied', status: 403 });
    }

    try {
      // Implementation
      const result = await db.transaction(async (tx) => {
        // ... implementation
      });

      return result;
    } catch (error) {
      console.error('[createProject]:', error);
      return fail({
        message: 'Failed to create project',
        status: 500,
      });
    }
  },
});
```

Key points:

- Built-in error handling with fail() helper
- Consistent error response structure
- Proper error propagation
- Type-safe input and output
- Automatic error logging
- Transaction support with error handling

### Response Type

```typescript
// Standard response type for all server actions
type ActionResponse<T> = {
  data: T | null;
  error: ActionError | null;
};

// Standard error type
type ActionError = {
  message: string;
  status: number;
  errors?: ZodError['errors'];
};

// Example usage
const { data, error } = await createProject({
  name: 'New Project',
  description: 'Description',
});

if (error) {
  // Handle error based on status code
  switch (error.status) {
    case 400: // Bad Request
    case 401: // Unauthorized
    case 403: // Forbidden
    case 404: // Not Found
    case 409: // Conflict
    case 500: // Server Error
  }
}
```

### withQuery Wrapper Pattern

```typescript
// Type-safe query wrapper that handles ActionResponse
export function withQuery<TInput, TOutput>(
  action: (input: TInput) => Promise<ActionResponse<TOutput>>
): (input: TInput) => Promise<TOutput>;

// Usage with direct call
const project = await withQuery(getProjectById)({ projectId: 'prj-123' });

// Usage with TanStack Query
const { data: project } = useQuery({
  queryKey: queryKey.projects.getProjectById({ projectId }),
  queryFn: withQuery(() => getProjectById({ projectId })),
});
```

### Data Fetching Pattern

```typescript
// Example component showing the complete pattern
export default function ProjectPage({ projectId }: { projectId: string }) {
  // Query with proper key management and error handling
  const { data: project, error } = useQuery({
    queryKey: queryKey.projects.getProjectById({ projectId }),
    queryFn: withQuery(() => getProjectById({ projectId })),
  });

  // Mutation example
  const { mutate: updateProject } = useMutation({
    mutationFn: withQuery(updateProjectDetails),
    onSuccess: () => {
      // Invalidate queries and show success message
      queryClient.invalidateQueries({
        queryKey: queryKey.projects.getProjectById({ projectId }),
      });
      toast({ title: 'Project updated successfully' });
    },
    onError: (error) => {
      // Error is automatically handled and typed
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Usage in event handlers
  const handleUpdate = async (data: UpdateProjectInput) => {
    try {
      await updateProject({ projectId, ...data });
    } catch (error) {
      // Error handling with proper types
      console.error('[ProjectPage/handleUpdate]:', error);
    }
  };

  return (
    <div>
      {/* Components using the fetched data */}
    </div>
  );
}
```

Key points:

- Complete type safety from server to client
- Consistent error handling across the stack
- Centralized query key management
- Automatic error transformation
- Built-in loading states
- Proper cache invalidation
- Toast notification integration

### Query Key Management

```typescript
// Type-safe query keys in query-keys.ts
export const queryKey = {
  projects: {
    getProjectById: ({ projectId }: { projectId: string }) =>
      ['projects', 'detail', projectId] as const,
    getCurrentUserProjects: () => ['projects', 'user'] as const,
  },
} as const;
```

Key points:

- Centralized query key management
- Type-safe key generation
- Consistent key structure
- Prevents key conflicts
- Easy refactoring

### Database Schema Pattern

```typescript
// Example schema definition
export const projects = pgTable(
  'projects',
  {
    id: text().$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'prj-' })),
    name: text().notNull(),
    description: text(),
    ...timestamps,
  },
  (table) => [index('project_name_idx').on(table.name)]
);

// Relations definition
export const projectsRelations = relations(projects, ({ many }) => ({
  users: many(projectUsers),
}));
```

Key points:

- Use consistent ID generation with prefixes
- Include standard timestamps
- Define proper indexes
- Use relations for type safety
- Export inferred types

### Error Handling Pattern

```typescript
// 1. Server Action throws error
if (!hasPermission) {
  return fail({ message: 'Access denied', status: 403 });
}

// 2. withQuery transforms error
// Inside withQuery implementation
if (response.error) {
  throw new Error(response.error.message);
}

// 3. TanStack Query catches error
const { error } = useQuery({
  queryKey: queryKey.projects.getProjectById({ projectId }),
  queryFn: withQuery(() => getProjectById({ projectId })),
});

// 4. Component handles error
if (error) {
  toast({
    title: 'Error',
    description: error.message,
    variant: 'destructive',
  });
}
```

Key points:

- Use fail() helper for standardized error responses
- Consistent HTTP status codes:
  - 400 Bad Request for validation errors
  - 401 Unauthorized for auth errors
  - 403 Forbidden for permission errors
  - 404 Not Found for missing resources
  - 409 Conflict for resource conflicts
  - 500 Server Error for internal errors
- Proper error propagation
- Context-aware error messages
- Type-safe error handling

### State Management Pattern

```typescript
// Atom definition
export const userSettingsAtom = atom({
  key: 'userSettings',
  default: null as UserSettings | null,
});

// Derived state
export const userThemeAtom = atom((get) => {
  const settings = get(userSettingsAtom);
  return settings?.theme ?? 'system';
});
```

Key points:

- Use atoms for global state
- Derive state when possible
- Keep state minimal
- Type-safe state
- Clear state dependencies

### Form Handling Pattern

```typescript
// Form schema
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

// Form component
export const ProjectForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  return (
    <Form {...form}>
      {/* Form fields */}
    </Form>
  );
};
```

Key points:

- Use Zod for form validation
- Type-safe form fields
- Consistent error messages
- Reusable form schemas
- Proper form state management

## 🔒 Security

- Invite-only registration system
- Supabase authentication
- Role-based access control
- Secure environment variables
- Input validation and sanitization

## 🚀 Deployment

The application is deployed on Vercel with the following configuration:

- Automatic deployments from main branch
- Environment variable management
- Edge functions support
- Serverless functions
- Global CDN

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is proprietary and confidential.

## 👥 Team

Made with ❤️ by Genesys Team
