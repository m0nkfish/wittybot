import * as Discord from 'discord.js'
import { Engine } from './engine';
import { Send } from './actions';
import { ReleaseMessage } from './messages';
import { GlobalContext, GameContext, RoundContext } from './context';
import { log } from './log';
import { BasicMessage } from './messages/BasicMessage';

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

  process.on('SIGTERM', () => {
    engine.states.forEach(state => {
      if (state.context instanceof RoundContext || state.context instanceof GameContext) {
        engine.interpret(Send(state.context.channel, new BasicMessage(`Sorry! The bot has to shut down, it should be back momentarily but you will have to restart the game`)))
      }
    })
  })

})

client.login(process.env.BOT_TOKEN);
