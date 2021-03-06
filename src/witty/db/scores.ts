
import * as io from 'io-ts'
import { Id } from '../../id';
import * as Discord from 'discord.js';
import { getOrSet, invoke } from '../../util';
import { ScoreUnit } from '../scores';
import { query } from '../../db';

export async function scores(guild: Discord.Guild, unit: Exclude<ScoreUnit, 'game'>) {
  const roundsResult = io.type({
    'round_id': io.string,
    'prompt_filled': io.string,
    'submission_id': io.string,
    'submission': io.string,
    'submitter_id': io.string,
    'voter_id': io.union([io.null, io.string]),
  })

  let roundsQuery = `
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
  `

  const interval = invoke(() => {
    switch (unit) {
      case 'day': return '1 day'
      case 'week': return '7 days'
      case 'month': return '1 month'
      case 'year': return '1 year'
      case 'alltime': return null
      default: throw new Error(`Incorrect unit: ${unit}`)
    }
  })
  if (interval) {
    roundsQuery = roundsQuery + ` and r.finished >= NOW() - INTERVAL '${interval}'`
  }

  const rounds = await query(roundsResult, roundsQuery, [guild.id])

  const roundsById: Map<string, RoundDbView> = new Map()

  for (const r of rounds) {
    const round = getOrSet(roundsById, r.round_id, () => new RoundDbView(Id.fromString(r.round_id), r.prompt_filled))
    const submission = round.getSubmission(r.submission_id, r.submission, r.submitter_id)
    if (r.voter_id) {
      submission.votes.add(r.voter_id)
    }
  }

  return Array.from(roundsById.values())
}

export class RoundDbView {
  constructor(readonly id: Id, readonly filledPrompt: string) { }

  readonly submissions = new Map<string, SubmissionDbView>()

  getSubmission(id: string, text: string, submitterId: string) {
    return getOrSet(this.submissions, id, () => new SubmissionDbView(Id.fromString(id), text, submitterId))
  }
}

export class SubmissionDbView {
  constructor(readonly id: Id, readonly text: string, readonly submitterId: string) { }

  readonly votes = new Set<string>()
}
