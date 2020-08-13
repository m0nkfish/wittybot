import * as Discord from 'discord.js'
import { Engine } from './engine';
import { Scores } from './scores';
import { promptsCount } from './prompts';

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
  channel.send({ embed: new Discord.MessageEmbed()
    .setTitle('Bot restarted/redeployed')
    .setFooter(`This version has ${promptsCount} miscellaneous prompts, quotes, lyrics, headlines and proverbs`) })
});

client.on('messageDelete', async message => {
  if (message.author && message.author === client.user && message.guild && message.channel instanceof Discord.TextChannel) {
    const fetchedLogs = await message.guild.fetchAuditLogs({
      limit: 1,
      type: 'MESSAGE_DELETE',
    });
    // Since we only have 1 audit log entry in this collection, we can simply grab the first one
    const deletionLog = fetchedLogs.entries.first();

    // Let's perform a coherence check here and make sure we got *something*
    if (!deletionLog) {
      console.log(`A ${message.author.tag} message was deleted by a mystery user.`);
      return
    }

    // We now grab the user object of the person who deleted the message
    // Let us also grab the target of this action to double check things
    const { executor, target } = deletionLog;

    // And now we can update our output with a bit more information
    // We will also run a check to make sure the log we got was for the same author's message
    if (target instanceof Discord.User && target === message.author) {
      console.log(`A ${message.author.tag} message was deleted by <@${executor.id}>.`);
    } else {
      console.log(`A ${message.author.tag} message was deleted by a mystery user.`);
    }
  }
})

const engine = new Engine({ client, scores: Scores.empty(), users: [], config: { submitDurationSec: 60, autoRun: true, testMode: false } })
engine.run()

client.login(process.env.BOT_TOKEN);