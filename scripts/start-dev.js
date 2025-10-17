#!/usr/bin/env node

/**
 * Development startup script for Rentauras X Backend
 * This script helps set up the development environment
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Rentauras X Backend Development Environment...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('📋 Please copy .env.example to .env and configure your environment variables:');
  console.log('   cp .env.example .env\n');
  process.exit(1);
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('❌ Dependencies not installed!');
  console.log('📦 Please install dependencies first:');
  console.log('   npm install\n');
  process.exit(1);
}

// Function to run command and pipe output
const runCommand = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', reject);
  });
};

// Check if Supabase is running
const checkSupabase = async () => {
  try {
    console.log('🔍 Checking Supabase status...');
    await runCommand('supabase', ['status'], { stdio: 'pipe' });
    console.log('✅ Supabase is running\n');
    return true;
  } catch (error) {
    console.log('❌ Supabase is not running');
    console.log('💡 Please start Supabase first:');
    console.log('   cd .. && supabase start\n');
    return false;
  }
};

// Check if Redis is running
const checkRedis = async () => {
  try {
    console.log('🔍 Checking Redis connection...');
    const { createClient } = require('redis');
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    await client.connect();
    await client.ping();
    await client.quit();
    
    console.log('✅ Redis is running\n');
    return true;
  } catch (error) {
    console.log('❌ Redis is not running');
    console.log('💡 Please start Redis:');
    console.log('   redis-server');
    console.log('   # OR using Docker:');
    console.log('   docker run -d -p 6379:6379 redis:alpine\n');
    return false;
  }
};

// Main startup function
const startDevelopment = async () => {
  try {
    // Load environment variables
    require('dotenv').config({ path: envPath });

    // Check prerequisites
    const supabaseRunning = await checkSupabase();
    const redisRunning = await checkRedis();

    if (!supabaseRunning || !redisRunning) {
      console.log('❌ Prerequisites not met. Please fix the issues above and try again.');
      process.exit(1);
    }

    console.log('🎉 All prerequisites met! Starting development server...\n');
    
    // Start the development server
    await runCommand('npm', ['run', 'dev']);
    
  } catch (error) {
    console.error('❌ Failed to start development server:', error.message);
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down development server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down development server...');
  process.exit(0);
});

// Start the development environment
startDevelopment();
