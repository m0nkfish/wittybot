const Discord = require('discord.js');

const client = new Discord.Client();

client.on('ready', () => {
  console.log('ready!')
  
  const channel = client.channels.cache.find(ch => ch.name === 'wittybot');
  if (channel) {
    channel.send(`deployment successful`);
  }
});

client.on('message', message => {
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