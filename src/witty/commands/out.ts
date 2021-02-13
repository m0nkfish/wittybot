import * as Discord from 'discord.js';
import { Case } from '../../case'
import { CommandFactory } from '../../commands';
import { StartingState } from '../state';

export const Out = Case('uninterested', (member: Discord.GuildMember) => ({ member }))

export const OutFactory = new CommandFactory((state, message) => {
  if (state instanceof StartingState && message.member && message.channel === state.context.channel && message.content === '!out') {
    return Out(message.member)
  }
})
