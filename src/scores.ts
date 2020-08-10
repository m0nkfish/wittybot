import * as Discord from 'discord.js';
import { EmbedMessage } from './actions';

export class Scores {

  constructor(readonly map: Map<Discord.User, number>) { }

  add(other: Scores) {
    const map = new Map(this.map)
    other.map.forEach((count, user) => {
      const base = map.get(user) ?? 0
      map.set(user, base + count)
    })
    return new Scores(map)
  }

  inOrder() {
    return Array.from(this.map).sort(([, a], [, b]) => b - a)
  }

  static empty() {
    return new Scores(new Map())
  }

  show(channel: Discord.TextChannel | Discord.DMChannel) {
    return EmbedMessage(channel, new Discord.MessageEmbed()
      .setTitle(`Scores on the doors...`)
      .setDescription(
        `The scores (since the bot was last restarted!) are:\n` +
        this.inOrder()
          .map(([user, score]) => `${score} points: ${user.username}`)
          .join('\n')))
  }
}