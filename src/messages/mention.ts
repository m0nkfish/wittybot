import * as Discord from 'discord.js';

export function mention(entity: Discord.User | Discord.Role) {
  return entity instanceof Discord.Role ? `<@&${entity.id}>` : `<@${entity.id}>`
}