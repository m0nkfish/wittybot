import * as Discord from 'discord.js';

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
}