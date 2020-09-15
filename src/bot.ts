import * as Discord from 'discord.js'
import { Engine } from './engine';
import { Send } from './actions';
import { ReleaseMessage } from './messages';
import { GlobalContext } from './context';
import { log } from './log';

log('loading')

const client = new Discord.Client();

client.on('ready', () => {
  client.user?.setPresence({
    activity: {
      type: 'PLAYING',
      name: '!help'
    }
  })

  const testMode = process.env.TEST_MODE === "true"

  log('ready', { testMode })

  const engine = new Engine(new GlobalContext(client, { defaultSubmitDurationSec: 80, testMode }))
  engine.run()

  for (const [_, guild] of client.guilds.cache) {
    if (guild.name === 'wittybot') {
      for (const [_, channel] of guild.channels.cache) {
        if (channel instanceof Discord.TextChannel && channel.name === 'wittybot') {
          engine.interpret(Send(channel, new ReleaseMessage(testMode)))
        }
      }
    }
  }
})

client.login(process.env.BOT_TOKEN);