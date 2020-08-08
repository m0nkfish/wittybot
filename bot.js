const Discord = require('discord.js');

const client = new Discord.Client();

client.on('ready', () => {
  console.log('ready!')
});

client.on('message', message => {
  if (message.content === 'ping') {
    console.log('received ping')
    message.reply('pong');
  }
});

client.login(process.env.BOT_TOKEN);