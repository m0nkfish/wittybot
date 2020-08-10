import * as Discord from 'discord.js';

export const getNotifyRole = (guild: Discord.Guild) => 
  guild.roles.cache.find(r => r.name === 'wittybot players')