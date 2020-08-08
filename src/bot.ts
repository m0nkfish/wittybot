import * as Discord from 'discord.js'

const client = new Discord.Client();

client.on('ready', () => {
  console.log('ready!')
});

client.on('message', (message: any) => {
  if (message.content === 'ping') {
    console.log('received ping')
    message.reply('pong');
  }

  if (message.content === '!witty') {
    if (message.channel.name === 'wittybot') {
      message.channel.send('prepare yourselves for witticisms galore')
    } else {
      message.channel.send('wittybot only works in #wittybot')
    }
  }
});

client.login(process.env.BOT_TOKEN);