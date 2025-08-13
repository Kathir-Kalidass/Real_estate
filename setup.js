#!/usr/bin/env node

/**
 * Development Setup Script for Real Estate Application
 * This script helps set up the development environment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🏠 Real Estate App - Development Setup');
console.log('=====================================\n');

// Check if .env exists
if (!fs.existsSync('.env')) {
    console.log('📝 Creating .env file from template...');
    fs.copyFileSync('.env.example', '.env');
    console.log('✅ .env file created. Please update with your configuration.\n');
} else {
    console.log('✅ .env file already exists.\n');
}

// Create upload directories
const uploadDirs = [
    'uploads',
    'uploads/properties'
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        console.log(`📁 Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Create logs directory
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
    console.log('📁 Created logs directory');
}

console.log('\n🎉 Setup complete!');
console.log('\nNext steps:');
console.log('1. Update .env file with your database credentials');
console.log('2. Create MySQL database: CREATE DATABASE real_estate_db;');
console.log('3. Import schema: mysql -u root -p real_estate_db < config/schema.sql');
console.log('4. Run: npm run dev');
console.log('\n🚀 Happy coding!');
