/**
 * Database Setup Script
 * Runs schema.sql and seed.sql to initialize the database
 */

require('dotenv').config({ path: '../server/.env' })
const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

async function runSetup() {
  let connection

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true,
    })

    console.log('✓ Connected to database')

    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')
    console.log('\n📋 Running schema.sql...')
    await connection.query(schemaSql)
    console.log('✓ Schema created successfully')

    // Read and execute seed.sql
    const seedPath = path.join(__dirname, 'seed.sql')
    const seedSql = fs.readFileSync(seedPath, 'utf8')
    console.log('\n📋 Running seed.sql...')
    await connection.query(seedSql)
    console.log('✓ Seed data inserted successfully')

    // Verify
    console.log('\n🔍 Verifying data...')
    const [users] = await connection.query('SELECT user_id, email, password FROM users LIMIT 3')
    console.log('✓ Sample users:')
    users.forEach((user) => {
      console.log(`  - ${user.email} (password hash: ${user.password.substring(0, 20)}...)`)
    })

    console.log('\n✅ Database setup complete!')
  } catch (err) {
    console.error('\n❌ Error:', err.message)
    process.exit(1)
  } finally {
    if (connection) await connection.end()
  }
}

runSetup()
