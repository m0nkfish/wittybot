import * as Postgres from 'pg'
import * as io from 'io-ts'
import { failure } from 'io-ts/lib/PathReporter'
import { log } from './log';

const pool = new Postgres.Pool()

async function withClient<T>(f: (client: Postgres.PoolClient) => T) {
  const client = await pool.connect()
  try {
    return f(client)
  } finally {
    client.release()
  }
}

export type DbCommand = {
  text: string
  values: any[]
}

export async function execute(commands: DbCommand[]) {
  return withClient(c => Promise.all(commands.map(cmd => c.query(cmd))))
}

export async function query<T>(validator: io.Type<T>, queryString: string, params: string[] = [], name?: string): Promise<T[]> {
  function validate(row: unknown): T {
    const decoded = validator.decode(row)
    if (decoded._tag === "Left") {
      throw new Error(failure(decoded.left).join(','))
    }
    return decoded.right
  }

  return withClient(async client => {
    const init = process.hrtime()
    log('db_query', { queryString: trimSql(queryString), params: params.join(',') })
    const res = await client.query({ name, text: queryString, values: params })
    const end = process.hrtime(init)
    log('db_query_finished', { count: res.rowCount, duration_ms: (end[0] * 1000) + (end[1] / 1000000) })
    return res.rows.map(validate)
  })
}

export function inserter<T extends io.Props>(table: string, validator: io.TypeC<T>) {
  return function(obj: io.OutputOf<typeof validator>) {
    const fields = Object.getOwnPropertyNames(validator.props)
    const fieldNames = fields.map(f => `"${f}"`).join(', ')
    const fieldVars = fields.map((_, i) => `$${i+1}`).join(', ')
    const fieldValues = fields.map(f => obj[f])
    const text = `INSERT INTO ${table}(${fieldNames}) VALUES (${fieldVars})`

    log('db_insert', { text, fieldValues: fieldValues.map(x => `${x}`).join(',') } )
    return {
      text: text,
      values: fieldValues
    }
  }
}

function trimSql(sql: string) {
  return sql.trim().replace(/\n|\s{2,}/g, ' ')
}