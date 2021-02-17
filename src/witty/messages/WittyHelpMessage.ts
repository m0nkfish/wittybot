import * as Discord from 'discord.js'
import { Message, StaticMessage } from '../../messages'

export class WittyHelpMessage implements StaticMessage {
  readonly type = 'static'
  
  constructor() { }

  get content() {
    return new Discord.MessageEmbed()
      .setTitle(':information_source: Wittybot help')
      .setDescription(`Wittybot is a simple, fast-paced text game where you submit text answers to prompts, then vote for the funniest one.`)
      .addField('How to play', [
        `1. Someone starts a game with the \`!witty\` command`,
        `2. The bot sends a prompt to the channel`,
        `3. Players have a certain amount of time to submit the funniest thing they can think of (either DM the bot or use \`||spoiler||\` tags in-channel)`,
        `4. After submissions are in and the time's up, players vote for the funniest entry`,
        `5. Repeat ad infinitum (or until there aren't enough players)`
      ])
      .addField('Commands', WittyHelpMessage.commands.map(([command, description]) => `\`!${command}\` - ${description}`))
      .setFooter(`This incarnation of wittybot was brought to you by monkfish#4812`)
  }

  static commands = [
    ['help witty', "you're looking at it"],
    ['witty [race <score>] [timeout <seconds>] [players <min>]', ["start a new game",
      "• `race <score>`: the game will finish when someone reaches <score> (5 - 30). default is 20",
      "• `timeout <seconds>`: specify the number of seconds per round (10 - 120). default is 80",
      "• `players <min>`: specify the minimum number of players (3 - 6). default is 3"
    ].join('\n')],
    ['in', "register your interest when a game begins"],
    ['out', "retract your interest"],
    ['skip', "skip the current prompt"],
    ['notify', "be notified when a new game starts"],
    ['unnotify', "stop being notified when a new game starts"],
    ['scores [day|week|month|year|alltime]', "show the scores from this server (defaults to day)"]
  ] as const
}
