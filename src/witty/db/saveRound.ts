import * as io from 'io-ts'
import { Round } from '../round';
import { Id } from '../../id';
import { inserter, DbCommand, execute } from '../../db';

const insertRound = inserter('rounds', io.type({ 'id': io.string, 'prompt_id': io.number, 'prompt_filled': io.string, 'skipped': io.boolean, 'guild_id': io.string }))
const insertSubmission = inserter('submissions', io.type({ 'id': io.string, 'round_id': io.string, 'submission': io.string, 'user_id': io.string }))
const insertVote = inserter('votes', io.type({ 'submission_id': io.string, 'user_id': io.string }))

export async function saveRound(round: Round) {
  const commands: DbCommand[] = []
  commands.push(insertRound({
    id: round.id,
    prompt_id: round.prompt.id,
    prompt_filled: round.prompt.prompt,
    skipped: round.skipped,
    guild_id: round.channel.guild.id
  }))

  for (const [user, { submission, votes }] of round.submissions) {
    const subId = Id.create()
    commands.push(insertSubmission({ id: subId, round_id: round.id, submission, user_id: user.id }))
    for (const voter of votes) {
      commands.push(insertVote({ submission_id: subId, user_id: voter.id }))
    }
  }

  return execute(commands)
}
