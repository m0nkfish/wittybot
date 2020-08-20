import * as Postgres from 'pg'
import * as io from 'io-ts'
import { failure } from 'io-ts/lib/PathReporter'
import { Round } from './context';
import { Id } from './id';
import * as Discord from 'discord.js';
import { getOrSet } from './util';

const pool = new Postgres.Pool()

async function withClient<T>(f: (client: Postgres.PoolClient) => T) {
  const client = await pool.connect()
  try {
    return f(client)
  } finally {
    client.release()
  }
}

type Command = {
  text: string
  values: any[]
}

async function execute(commands: Command[]) {
  return withClient(c => Promise.all(commands.map(cmd => c.query(cmd))))
}

async function query<T>(validator: io.Type<T>, queryString: string, params: any[] = [], name?: string): Promise<T[]> {
  function validate(row: unknown): T {
    const decoded = validator.decode(row)
    if (decoded._tag === "Left") {
      throw new Error(failure(decoded.left).join(','))
    }
    return decoded.right
  }

  return withClient(async client => {
    const res = await client.query({ name, text: queryString, values: params })
    return res.rows.map(validate)
  })
}

function inserter<T extends io.Props>(table: string, validator: io.TypeC<T>) {
  return function(obj: io.OutputOf<typeof validator>) {
    const fields = Object.getOwnPropertyNames(validator.props)
    const fieldNames = fields.map(f => `"${f}"`).join(', ')
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

const insertRound = inserter('rounds', io.type({ 'id': io.string, 'prompt_id': io.number, 'prompt_filled': io.string, 'skipped': io.boolean, 'guild_id': io.string }))
const insertSubmission = inserter('submissions', io.type({ 'id': io.string, 'round_id': io.string, 'submission': io.string, 'user_id': io.string }))
const insertVote = inserter('votes', io.type({ 'submission_id': io.string, 'user_id': io.string }))

export async function saveRound(round: Round) {
  const commands: Command[] = []
  commands.push(insertRound({
    id: round.id.value,
    prompt_id: round.prompt.id,
    prompt_filled: round.prompt.prompt,
    skipped: round.skipped,
    guild_id: round.channel.guild.id
  }))
  
  for (const [user, {submission, votes}] of round.submissions) {
    const subId = Id.create()
    commands.push(insertSubmission({ id: subId.value, round_id: round.id.value, submission, user_id: user.id }))
    for (const voter of votes) {
      commands.push(insertVote({ submission_id: subId.value, user_id: voter.id }))
    }
  }

  return execute(commands)
}

/** fetches prompts that have not been seen in the last (total/2) rounds */
export async function fetchUnseenPrompts(guild: Discord.Guild) {
  const tPrompt = io.type({
    id: io.number,
    text: io.string,
    type: io.string
  })
  const sql = `
    select id, text, type from prompts p
    left join (
      select prompt_id
      from rounds
      where guild_id != $1
      group by (prompt_id)
      order by max(finished) desc
      limit (select count(*) / 2 from prompts where active = true)
    ) seen on seen.prompt_id = p.id
    where seen.prompt_id is null and p.active = true
  `
  return query(tPrompt, sql, [guild.id], "fetch_prompts")
}

export async function allReplacements() {
  const tReplacement = io.type({
    id: io.number,
    replacement: io.string,
    type: io.string
  })
  return query(tReplacement, `SELECT * FROM replacements`)
}

export async function dailyRounds(guild: Discord.Guild) {
  const roundsResult = io.type({
    'round_id': io.string,
    'prompt_filled': io.string,
    'submission_id': io.string,
    'submission': io.string,
    'submitter_id': io.string,
    'voter_id': io.union([io.null, io.string]),
  })

  const getRounds = `
    select
      r.id as round_id,
      r.prompt_filled,
      s.id as submission_id,
      s.submission,
      s.user_id as submitter_id,
      v.user_id as voter_id
    from rounds r
    inner join submissions s on r.id = s.round_id
    left join votes v on v.submission_id = s.id
    where r.guild_id = $1
    and r.finished >= NOW() - INTERVAL '24 HOURS'
  `

  const rounds = await query(roundsResult, getRounds, [guild.id], 'fetch_daily_rounds')

  const roundsById: Map<Id, RoundView> = new Map()

  for (const r of rounds) {
    const id = Id.fromString(r.round_id)
    const round = getOrSet(roundsById, id, () => new RoundView(id, r.prompt_filled))
    const submission = round.getSubmission(Id.fromString(r.submission_id), r.submission, r.submitter_id)
    if (r.voter_id) {
      submission.votes.add(r.voter_id)
    }
  }

  return roundsById
}

class RoundView {
  constructor(readonly id: Id, readonly filledPrompt: string) {}

  readonly submissions = new Map<Id, SubmissionView>()

  getSubmission(id: Id, text: string, submitterId: string) {
    return getOrSet(this.submissions, id, () => new SubmissionView(id, text, submitterId))
  }
}

class SubmissionView {
  constructor(readonly id: Id, readonly text: string, readonly submitterId: string) {}

  readonly votes = new Set<string>()
}
