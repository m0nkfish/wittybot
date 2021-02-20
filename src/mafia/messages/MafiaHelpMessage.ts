import * as Discord from 'discord.js';
import { Emojis, StaticMessage } from '../../messages';
import { Role } from '../model/Role';
import { commandText, roleText } from './text';

export class MafiaHelpMessage implements StaticMessage {
  readonly type = 'static'

  get content() {
    return new Discord.MessageEmbed()
      .setTitle(`${Emojis.info} Mafia help`)
      .setDescription(`A simple mafia game for discord`)
      .addField('How to play', [
        `1. Someone starts a game with the \`!mafia\` command`,
        `2. Players join the game (it can be started early with \`!start\`)`,
        `3. Each player is assigned a role (see below) and can take certain actions`,
        `4. The game alternates between night mode and day mode, during which players can take their actions`,
        `5. The goal is to be the last team remaining`
      ])
      .addField('Commands', MafiaHelpMessage.commands.map(([command, description]) => `\`!${command}\` - ${description}`))
      .setFooter(`This incarnation of wittybot was brought to you by monkfish#4812`)
  }

  static commands = [
    ['help mafia', "you're looking at it"],
    ['help mafia roles', `role information`],
    ['mafia [reveals <on|off>] [players <min>]', [`start a new game`,
      '• `reveals <on|off>`: determines whether roles are publicly revealed on death. default is on',
      "• `players <min>`: specify the minimum number of players (2 - 10). default is 5"
    ].join('\n')],
    ['in', "register your interest when a game begins"],
    ['out', "retract your interest"],
  ] as const
}

export class MafiaHelpRolesMessage implements StaticMessage {
  readonly type = 'static'

  get content() {
    return new Discord.MessageEmbed()
      .setTitle(`${Emojis.info} Mafia roles`)
      .setDescription(`Each player is assigned a role at the start of the game. During the day, players vote to execute any one player, and during the night players may perform an action according to their role.`)
      .addFields(
        Object.values(Role).map(x => x as Role).map(role => {
          const { emoji, name, desc } = roleText(role)
          const { day, night } = role.commands
          return {
            name: `${emoji} ${name}`,
            value: [
              desc,
              night && `• **${commandText(night).verb}**: ${commandText(night).desc}`
            ]
          }
        })
      )
      .setFooter(`This incarnation of wittybot was brought to you by monkfish#4812`)
  }
}