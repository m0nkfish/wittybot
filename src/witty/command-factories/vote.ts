import * as Discord from 'discord.js'
import { CommandFactory } from '../../commands';
import { MessageReceived } from '../../discord-events';
import { log } from '../../log'
import { tryParseInt } from '../../util';
import { Vote } from '../commands';
import { VotingState } from '../state';

export const VoteFactory = () => CommandFactory.build.state(VotingState).event(MessageReceived).process(((state, { message }) => {
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
}))