import * as Discord from 'discord.js';

export function memberName(guild: Discord.Guild, user: Discord.User) {
  return guild.member(user)?.displayName ?? user.username
}