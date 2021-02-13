import { CommandHandler } from '../../command-handler';
import { GetScores } from '../commands';
import { Send } from '../actions'
import { BasicMessage } from '../../messages';
import { WittyGameContext } from '../context';
import { ScoresByPointsMessage, ScoresByRatingMessage } from '../messages';
import { Scores } from '../scores';
import * as db from '../db'
import { log } from '../../log';
import { RoundScoreView } from '../round';
import { beginTimer } from '../../util'
import * as Discord from 'discord.js';
import { logUser } from '../loggable';

export const GetScoresHandler = new CommandHandler(async (state, command) => {

  async function getUser(id: string): Promise<Discord.User> {
    const t = beginTimer()
    const user = await state.context.client.users.fetch(id, true)
    log(`fetched_user`, logUser(user), { duration_ms: t.getMs() })
    return user
  }

  async function getUserLookup(rounds: db.RoundDbView[]): Promise<Map<string, Discord.User>> {
    const ids = getUniqueIds(rounds)
    const users = await Promise.all(ids.map(id => getUser(id)))
    return new Map(users.map((u, i) => [ids[i], u]))
  }

  if (command.type === GetScores.type) {
    if (command.unit === 'game') {
      const message = state.context instanceof WittyGameContext
        ? new ScoresByPointsMessage(Scores.fromRounds(state.context.rounds))
        : new BasicMessage(`No game is running; start a game with \`!witty\``)
      return Send(command.source, message)
    }

    const rounds = await db.scores(command.source.guild, command.unit)

    const fetchUsersTime = beginTimer()
    log(`fetching_user_cache`)
    const users = await getUserLookup(rounds)
    log(`fetched_user_cache`, { unit: command.unit, rounds: rounds.length, users: users.size, duration_ms: fetchUsersTime.getMs() })

    const getScoresTime = beginTimer()
    log(`building_scores`, { unit: command.unit, rounds: rounds.length })
    const scoreView = rounds.map(round => RoundScoreView.fromDbView(round, users))
    log(`built_scores`, { unit: command.unit, duration_ms: getScoresTime.getMs() })

    const scores = Scores.fromRoundViews(scoreView)
    const timeframe = command.unit === 'alltime' ? "since the dawn of time itself" : `from the last ${command.unit}`
    return Send(command.source, new ScoresByRatingMessage(scores, timeframe))
  }
})

function getUniqueIds(rounds: db.RoundDbView[]): string[] {
  const ids = new Set<string>()
  for (const r of rounds) {
    for (const s of r.submissions.values()) {
      ids.add(s.submitterId)
      // we can skip the voters because every voter must have submitted
    }
  }

  return Array.from(ids)
}