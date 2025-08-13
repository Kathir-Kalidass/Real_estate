const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  console.log('🗄️  Setting up database...');
  
  try {
    // Connect to MySQL server (without specifying database)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'real_estate_db'}`);
    console.log(`✅ Database '${process.env.DB_NAME || 'real_estate_db'}' created or verified`);

    // Use the database
    await connection.query(`USE ${process.env.DB_NAME || 'real_estate_db'}`);

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'config', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Remove comments and split SQL statements
    const cleanedSchema = schema
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    const statements = cleanedSchema
      .split(';')
      .map(s => s.trim())
      .filter(s => s && s.length > 5);
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
        } catch (err) {
          console.error(`❌ Error executing statement ${i + 1}:`, err.message);
          console.log('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }

    console.log('✅ Database schema created successfully');

    // Check if we have sample data
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    if (users[0].count === 0) {
      console.log('📝 Adding sample data...');
      
      // Add sample users with properly hashed passwords
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('test123A', 12);
      
      await connection.execute(`
        INSERT INTO users (username, email, password_hash, role, full_name, phone) VALUES
        ('john_owner', 'john@example.com', ?, 'owner', 'John Smith', '555-0101'),
        ('jane_buyer', 'jane@example.com', ?, 'buyer', 'Jane Doe', '555-0102'),
        ('mike_owner', 'mike@example.com', ?, 'owner', 'Mike Johnson', '555-0103')
      `, [hashedPassword, hashedPassword, hashedPassword]);

      // Add sample properties
      await connection.execute(`
        INSERT INTO properties (owner_id, title, description, location, price, property_type, bedrooms, bathrooms, area_sqft) VALUES
        (1, 'Beautiful Family Home', 'Spacious 3-bedroom house with modern amenities', 'New York, NY', 750000.00, 'house', 3, 2, 2200),
        (1, 'Downtown Apartment', 'Modern apartment in the heart of the city', 'Manhattan, NY', 450000.00, 'apartment', 2, 1, 1100),
        (3, 'Luxury Condo', 'High-end condominium with city views', 'Brooklyn, NY', 650000.00, 'condo', 2, 2, 1400)
      `);

      console.log('✅ Sample data added');
    } else {
      console.log('ℹ️  Sample data already exists');
    }

    await connection.end();
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
