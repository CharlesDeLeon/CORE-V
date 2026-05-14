const { Pool } = require('pg')
const dotenv = require('dotenv')

dotenv.config()

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' || process.env.DB_SSL === '1' ? { rejectUnauthorized: false } : undefined,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      max: 10,
    }

const pool = new Pool(poolConfig)

const convertPlaceholders = (sql, params = []) => {
  if (!params || params.length === 0) return { sql, params }
  let index = 0
  return {
    sql: sql.replace(/\?/g, () => `$${++index}`),
    params,
  }
}

const enrichRows = (result) => {
  const rows = result.rows || []
  rows.insertId = null
  if (result.command === 'INSERT' && rows.length > 0) {
    const firstRow = rows[0]
    rows.insertId = firstRow.user_id || firstRow.group_id || firstRow.comment_id || firstRow.review_id || firstRow.submission_id || firstRow.notification_id || null
  }
  rows.affectedRows = result.rowCount
  return rows
}

const query = async (sql, params = []) => {
  const { sql: convertedSql, params: convertedParams } = convertPlaceholders(sql, params)
  const result = await pool.query(convertedSql, convertedParams)
  return [enrichRows(result), result.fields]
}

const getConnection = async () => {
  const client = await pool.connect()
  const nativeQuery = client.query.bind(client)

  client.query = async (sql, params = []) => {
    const { sql: convertedSql, params: convertedParams } = convertPlaceholders(sql, params)
    const result = await nativeQuery(convertedSql, convertedParams)
    return [enrichRows(result), result.fields]
  }

  client.beginTransaction = async () => await nativeQuery('BEGIN')
  client.commit = async () => await nativeQuery('COMMIT')
  client.rollback = async () => await nativeQuery('ROLLBACK')

  return client
}

module.exports = {
  query,
  getConnection,
  end: pool.end.bind(pool),
}
