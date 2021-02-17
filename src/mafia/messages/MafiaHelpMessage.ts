import * as Discord from 'discord.js'
import { Message } from '../../messages'
import { Role } from '../Role'
import { roleText } from './text'
import { StaticMessage } from '../../messages';

export class MafiaHelpMessage implements StaticMessage {
  readonly type = 'static'

  constructor() { }

  get content() {
    return new Discord.MessageEmbed()
      .setTitle(':information_source: Mafia help')
      .setDescription(`A simple mafia game for discord`)
      .addField('How to play', [
        `1. Someone starts a game with the \`!mafia\` command`,
        `2. Players join the game (it can be started early with \!start\`)`,
        `3. Each player is assigned a role (see below) and can take certain actions`,
        `4. The game alternates between night mode and day mode, during which players can take their actions`,
        `5. The goal is to be the last team remaining`
      ])
      .addField('Commands', MafiaHelpMessage.commands.map(([command, description]) => `\`!${command}\` - ${description}`))
      .addField('Roles', Object.values(Role).map(x => roleText.get(x)!).map(({ emoji, desc }) => `${emoji} - ${desc}`))
      .setFooter(`This incarnation of wittybot was brought to you by monkfish#4812`)
  }

  static commands = [
    ['help mafia', "you're looking at it"],
    ['in', "register your interest when a game begins"],
    ['out', "retract your interest"],
  ] as const
}
