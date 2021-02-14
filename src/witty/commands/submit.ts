import * as Discord from 'discord.js'
import { Case } from '../../case'
import { CommandFactory } from '../../commands';
import { log } from '../../log'
import { SubmissionState } from '../state';

export const Submit = Case('witty-submit', (submission: string, message: Discord.Message) => ({ user: message.author, submission, message }))

export const SubmitFactory = () => new CommandFactory((state, message) => {
  if (state instanceof SubmissionState) {
    if (message.channel instanceof Discord.DMChannel) {
      return Submit(message.content, message)
    } else if (message.channel === state.context.channel) {
      const spoilered = message.content.match(/^\|\|(.*)\|\|$/)
      if (spoilered && spoilered[1]) {
        try {
          message.delete({ reason: 'Message recognised as wittybot submission' })
        } catch (e) {
          const error = e instanceof Error ? e.message : 'unknown'
          log.warn('delete_failed', { error })
        }
        return Submit(spoilered[1], message)
      }
    }
  }
})