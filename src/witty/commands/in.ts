import * as Discord from 'discord.js';
import { Case } from '../../case'
import { CommandFactory } from '../../commands';
import { StartingState } from '../state';

export const In = Case('interested', (member: Discord.GuildMember) => ({ member }))

export const InFactory = () => new CommandFactory((state, message) => {
  if (state instanceof StartingState && message.member && message.channel === state.context.channel && message.content === '!in') {
    return In(message.member)
  }
})
