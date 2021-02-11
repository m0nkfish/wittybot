import * as Discord from 'discord.js';

const notifyRoleName = 'wittybot players'

export const getNotifyRole = async (guild: Discord.Guild) => {
  const role = guild.roles.cache.find(r => r.name === notifyRoleName)
  if (role) {
    return role
  }

  try {
    return await guild.roles.create({
      data: {
        name: notifyRoleName,
        mentionable: true
      },
      reason: 'Notification role for wittybot players'
    })
  } catch {
    return undefined
  }
}