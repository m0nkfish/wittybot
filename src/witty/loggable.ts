import * as Discord from 'discord.js';
import { Message, BasicMessage } from '../messages'
import { SubmissionState } from './state';
import { VotingState } from './state';
import { GameState } from '../state';

export const logUsernames = (users: Iterable<Discord.User>) => Array.from(users).map(u => u.username).join(',')
export const logGuild = (guild?: Discord.Guild) => ({ guildId: guild?.id, guildName: guild?.name })
export const logUser = (user?: Discord.User) => ({ userId: user?.id, userName: user?.username })
export const logMember = (member: Discord.GuildMember) => ({ ...logGuild(member.guild), ...logUser(member.user) })
export const logChannel = (channel: Discord.TextChannel) => ({ ...logGuild(channel.guild), channel: channel.name })
export const logSource = (source: Discord.TextChannel | Discord.User) => source instanceof Discord.TextChannel ? logChannel(source) : logUser(source)
export const logState = (state: GameState<any>) =>
  state instanceof SubmissionState ? { submissions: logUsernames(state.submissions.keys()) }
    : state instanceof VotingState ? { submissions: logUsernames(state.submissions.map(x => x.user)), votes: logUsernames(state.votes.keys()) }
      : undefined

export const logMessage = (message: Message) =>
  message instanceof BasicMessage ? { content: message.content }
    : undefined

export const getName = (obj: any) => obj?.constructor?.name