import env from '@/env';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection string from Supabase
const connectionString = env.SUPABASE_DATABASE_URL;

// Connection options
const connectionOptions = {
  max: 1, // Use max 1 connection (required for serverless)
  prepare: false, // Disable prepared statements
  ssl: env.NODE_ENV === 'production', // Enable SSL in production
  casing: 'snake_case',
};

// Create the connection
export const client = postgres(connectionString, connectionOptions);

// Create the database instance with schema
export const db = drizzle(client, { schema });

// Helper type for all tables
export type DbClient = typeof db;
