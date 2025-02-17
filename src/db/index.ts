import env from '@/env';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection string from Supabase
const connectionString = env.SUPABASE_DATABASE_URL;

// Connection options
const connectionOptions = {
  max: 3, // Limited pool for serverless
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout after 10 seconds
  prepare: false, // Disable prepared statements
  ssl:
    env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false, // Allow self-signed certificates in production
        }
      : false,
  connection: {
    application_name: 'genesys', // Add application name for monitoring
  },
};

// Create the connection
export const client = postgres(connectionString, connectionOptions);

// Create the database instance with schema
export const db = drizzle(client, { schema });

// Helper type for all tables
export type DbClient = typeof db;

// Handle cleanup on app termination
process.on('SIGTERM', () => {
  client.end().catch((err) => {
    console.error('Error closing database connections:', err);
  });
});
