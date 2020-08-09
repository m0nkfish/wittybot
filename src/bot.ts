import * as Discord from 'discord.js'
import { GameState, IdleState } from './state';
import { Action } from './actions';

const client = new Discord.Client();

let state: GameState = new IdleState({ client, config: { submitDurationSec: 60, voteDurationSec: 30 } })

function interpret(action: Action) {
  if (action.type === 'composite-action') {
    action.actions.forEach(interpret);
  } else if (action.type === 'delayed-action') {
    setTimeout(() => interpret(action.action), action.delayMs)
  } else if (action.type === 'from-state-action') {
    interpret(action.getAction(state))
  } else if (action.type === 'new-state') {
    state = action.newState
  } else if (action.type === 'post-message') {
    action.channel.send(action.message)
  } else if (action.type === 'embed-message') {
    action.channel.send({ embed: action.embed.setColor('#A4218A') })
  }
}

client.on('ready', () => {
  console.log('ready!')
  const channel = client.channels.cache.find(ch => ch instanceof Discord.TextChannel && ch.name === 'wittybot') as Discord.TextChannel | undefined
  if (!channel) {
    return
  }
  channel.send(`deployment successful`)
});

client.on('message', message => {
  if (message.author.bot) {
    return
  }

  if (message.content === 'ping') {
    console.log('received ping')
    message.reply('pong');
  }

  const command = state.interpreter(message)
  if (!command) {
    return
  }
  const action = state.receive(command)
  if (!action) {
    return
  }

  interpret(action)
});

client.login(process.env.BOT_TOKEN);