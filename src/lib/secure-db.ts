import { createSupabaseAdminClient } from './supabase';

// Row Level Security: Tourists can only see their own data
export function createSecureSupabaseClient() {
  // Return the full admin client for now
  // In production, you would implement proper RLS policies in Supabase
  return createSupabaseAdminClient();
};

// Helper function to check if user is admin
export function isAdminUser(userId: string): boolean {
  // In a real app, you'd check against an admin_users table
  // For now, we'll use a simple check
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || [];
  return adminUserIds.includes(userId);
}

// Security headers for API responses
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.supabase.co; frame-ancestors 'self';"
};
