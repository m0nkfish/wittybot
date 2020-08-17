import * as Postgres from 'pg'

const client = new Postgres.Client()

async function query(queryString: string, params: string[] = []) {
  await client.connect()
  try {
    const res = await client.query(queryString, params)
    function produce(row: unknown[]) {
      const obj: Record<string, any> = {}
      res.fields.forEach((f, i) => obj[f.name] = row[i])
      return obj
    }
    return res.rows.map(produce)
  } finally {
    await client.end()
  }
}

export async function allPrompts() {
  return query(`SELECT * FROM prompts WHERE active = true`)
}

export async function allReplacements() {
  return query(`SELECT * FROM replacements`)
}