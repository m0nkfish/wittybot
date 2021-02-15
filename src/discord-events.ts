import { Case } from "./case";
import * as Discord from 'discord.js';
import { Message } from "./messages";

export const MessageReceived = Case('discord-message', (message: Discord.Message) => ({ message }))
export const ReactionAdded = Case('discord-reaction-add', (reaction: Discord.MessageReaction, user: Discord.User, message: Message) => ({ reaction, user, message }))
export const ReactionRemoved = Case('discord-reaction-remove', (reaction: Discord.MessageReaction, user: Discord.User, message: Message) => ({ reaction, user, message }))

export type DiscordEvent =
  | ReturnType<typeof MessageReceived>
  | ReturnType<typeof ReactionAdded>
  | ReturnType<typeof ReactionRemoved>