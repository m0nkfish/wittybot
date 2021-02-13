import * as Discord from 'discord.js'
import { Case } from '../../case'
import { CommandFactory } from '../../commands';
import { log } from '../../log'
import { tryParseInt } from '../../util';
import { VotingState } from '../state';

export const Vote = Case('witty-vote', (entry: number, message: Discord.Message) => ({ user: message.author, entry, message }))

export const VoteFactory = new CommandFactory((state, message) => {
  if (state instanceof VotingState) {
    if (message.channel instanceof Discord.DMChannel) {
      const entry = tryParseInt(message.content)
      if (entry !== null) {
        return Vote(entry, message)
      }
    } else if (message.channel === state.context.channel) {
      const spoilered = message.content.match(/^\|\|(\d+)\|\|$/)
      if (spoilered && spoilered[1]) {
        const entry = tryParseInt(spoilered[1].trim())
        if (entry !== null) {
          try {
            message.delete({ reason: 'Message recognised as wittybot submission' })
          } catch (e) {
            const error = e instanceof Error ? e.message : 'unknown'
            log.warn('delete_failed', { error })
          }
          return Vote(entry, message)
        }
      }
    }
  }
})