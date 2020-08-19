import * as Discord from 'discord.js'
import { Engine } from './engine';
import { Send } from './actions';
import { ReleaseMessage } from './messages';
import { Context } from './context';

const client = new Discord.Client();

client.on('ready', () => {
  client.user?.setPresence({
    activity: {
      type: 'PLAYING',
      name: '!help'
    }
  })
  console.log('ready!')
  for (const [_, guild] of client.guilds.cache) {
    for (const [_, channel] of guild.channels.cache) {
      if (channel instanceof Discord.TextChannel && channel.name === 'wittybot') {
        engine.interpret(Send(channel, new ReleaseMessage(testMode)))
      }
    }
  }
});

const testMode = process.env.TEST_MODE === "true"

const engine = new Engine(new Context(client, { submitDurationSec: 60, testMode }, []))
engine.run()

client.login(process.env.BOT_TOKEN);