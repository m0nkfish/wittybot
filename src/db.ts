import * as Postgres from 'pg'
import * as io from 'io-ts'
import { failure } from 'io-ts/lib/PathReporter'
import { Round } from './context';
import { Id } from './id';

const pool = new Postgres.Pool()

async function withClient<T>(f: (client: Postgres.PoolClient) => T) {
  const client = await pool.connect()
  try {
    return f(client)
  } finally {
    client.release()
  }
}

async function query<T>(validator: io.Type<T>, queryString: string, params: any[] = []): Promise<T[]> {
  function validate(row: unknown): T {
    const decoded = validator.decode(row)
    if (decoded._tag === "Left") {
      throw new Error(failure(decoded.left).join(','))
    }
    return decoded.right
  }

  return withClient(async client => {
    const res = await client.query({ text: queryString, values: params })
    return res.rows.map(validate)
  })
}

function inserter<T extends io.Props>(table: string, validator: io.TypeC<T>) {
  return function(obj: io.OutputOf<typeof validator>) {
    const fields = Object.getOwnPropertyNames(validator.props)
    const fieldNames = fields.join(', ')
    const fieldVars = fields.map((_, i) => `$${i+1}`).join(', ')
    const fieldValues = fields.map(f => obj[f])
    const text = `INSERT INTO ${table}(${fieldNames}) VALUES (${fieldVars})`

    console.log(text, fieldValues)
    return {
      text: text,
      values: fieldValues
    }
  }
}

const insertRound = inserter('rounds', io.type({ 'id': io.string, 'prompt_id': io.number, 'prompt_filled': io.string }))
const insertSubmission = inserter('submissions', io.type({ 'id': io.string, 'round_id': io.string, 'submission': io.string, 'user': io.string }))
const insertVote = inserter('votes', io.type({ 'submission_id': io.string, 'user': io.string }))

export async function saveRound(round: Round) {
  await withClient(async client => {
    await client.query(insertRound({
      id: round.id.value,
      prompt_id: round.prompt.id,
      prompt_filled: round.prompt.prompt
    }))

    const submissions = Array.from(round.submissions)
      .map(([user, {submission, votes}]) => ({ id: Id.create(), submission, voters: votes, user }))

    await Promise.all(submissions.map(async sub => {
      await client.query(insertSubmission({ id: sub.id.value, round_id: round.id.value, submission: sub.submission, user: sub.user.username }))
      await Promise.all(sub.voters.map(async voter => {
        await client.query(insertVote({ submission_id: sub.id.value, user: voter.username }))
      }))
    }))
  })
}

export async function allPrompts() {
  const tPrompt = io.type({
    id: io.number,
    text: io.string,
    type: io.string
  })
  return query(tPrompt, `SELECT id, text, type FROM prompts WHERE active = true`)
}

export async function allReplacements() {
  const tReplacement = io.type({
    id: io.number,
    replacement: io.string,
    type: io.string
  })
  return query(tReplacement, `SELECT * FROM replacements`)
}