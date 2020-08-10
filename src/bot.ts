import * as Discord from 'discord.js'
import { Engine } from './engine';
import { Scores } from './scores';

const client = new Discord.Client();

client.on('ready', () => {
  client.user?.setPresence({
    activity: {
      type: 'PLAYING',
      name: '!help'
    }
  })
  console.log('ready!')
  const channel = client.channels.cache.find(ch => ch instanceof Discord.TextChannel && ch.name === 'wittybot') as Discord.TextChannel | undefined
  if (!channel) {
    return
  }
  channel.send(`Bot restarted/redeployed`)
});

client.on('messageDelete', msg => {
  if (msg.author === client.user && msg.channel instanceof Discord.TextChannel) {
    msg.channel.send('Someone deleted a wittybot message from this channel...!')
  }
})

const engine = new Engine({ client, scores: Scores.empty(), users: [], config: { submitDurationSec: 60, autoRun: true } })
engine.run()

client.login(process.env.BOT_TOKEN);