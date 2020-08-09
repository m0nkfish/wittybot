import * as Discord from 'discord.js'
import { Engine } from './engine';

const client = new Discord.Client();

client.on('ready', () => {
  console.log('ready!')
  const channel = client.channels.cache.find(ch => ch instanceof Discord.TextChannel && ch.name === 'wittybot') as Discord.TextChannel | undefined
  if (!channel) {
    return
  }
  channel.send(`deployment successful`)
});

const engine = new Engine({ client, config: { submitDurationSec: 60, voteDurationSec: 30, testMode: true } })
engine.run()

client.login(process.env.BOT_TOKEN);