// Application configuration
// This file contains configurable settings for the application

export const APP_CONFIG = {
  // Default district for membership applications
  // Can be overridden via environment variable DEFAULT_DISTRICT
  DEFAULT_DISTRICT: process.env.DEFAULT_DISTRICT || 'Barpeta',
  
  // Other configurable settings can be added here
};

