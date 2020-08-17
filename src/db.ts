import * as Postgres from 'pg'
import * as io from 'io-ts'
import { Either, either } from 'fp-ts/lib/Either'
import { failure } from 'io-ts/lib/PathReporter'

const client = new Postgres.Client()

async function query<T>(validator: io.Type<T>, queryString: string, params: string[] = []): Promise<T[]> {
  await client.connect()
  try {
    const res = await client.query(queryString, params)
    function produce(row: unknown[]): T {
      const obj: Record<string, any> = {}
      res.fields.forEach((f, i) => obj[f.name] = row[i])

      const decoded = validator.decode(obj)
      if (decoded._tag === "Left") {
        throw new Error(failure(decoded.left).join(','))
      }
      return decoded.right
    }
    return res.rows.map(produce)
  } finally {
    await client.end()
  }
}

const tPrompt = io.type({
  id: io.number,
  text: io.string,
  type: io.string
})
export async function allPrompts() {
  return query(tPrompt, `SELECT id, text, type FROM prompts WHERE active = true`)
}

const tReplacement = io.type({
  id: io.number,
  replacement: io.string,
  type: io.string
})
export async function allReplacements() {
  return query(tReplacement, `SELECT * FROM replacements`)
}