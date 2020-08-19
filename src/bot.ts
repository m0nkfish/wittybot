import * as Discord from 'discord.js'
import { Engine } from './engine';
import { Send } from './actions';
import { ReleaseMessage } from './messages';
import { GlobalContext, GuildContext } from './context';

console.log('Loading...')

const client = new Discord.Client();

client.on('ready', () => {
  client.user?.setPresence({
    activity: {
      type: 'PLAYING',
      name: '!help'
    }
  })

  console.log('Ready')

  const testMode = process.env.TEST_MODE === "true"
  const globalCtx = new GlobalContext(client, { submitDurationSec: 60, testMode })

  const guild = client.guilds.cache.first()!
  const engine = new Engine(new GuildContext(globalCtx, guild))
  engine.run()

  for (const [_, guild] of client.guilds.cache) {
    for (const [_, channel] of guild.channels.cache) {
      if (channel instanceof Discord.TextChannel && channel.name === 'wittybot') {
        engine.interpret(Send(channel, new ReleaseMessage(testMode)))
      }
    }
  }
});


client.login(process.env.BOT_TOKEN);