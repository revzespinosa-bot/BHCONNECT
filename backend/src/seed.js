require('dotenv').config();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const schema = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
  const seedSql = fs.readFileSync(path.join(__dirname, '../../database/seed.sql'), 'utf8');

  console.log('Creating database and tables...');
  await connection.query(schema);

  const passwordHash = await bcrypt.hash('password123', 10);
  const seedWithHash = seedSql.replace(
    /\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy/g,
    passwordHash
  );

  console.log('Inserting seed data...');
  await connection.query(seedWithHash);

  await connection.end();
  console.log('Database seeded successfully.');
  console.log('Login: admin / password123');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
