import * as Discord from 'discord.js'
import { Engine } from './engine';
import { Send } from './actions';
import { BasicMessage } from './messages';
import { log } from './log';
import { GlobalContext } from './context';
import { Duration } from './duration';
import { IdleState } from './state';

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

  const engine = new Engine(new GlobalContext(client, { defaultSubmitDuration: Duration.seconds(80), testMode }))
  engine.run()

  process.on('SIGTERM', () => {
    log.error('sigterm')
    engine.guilds.all.forEach(([_, state]) => {
      if (!(state instanceof IdleState) && state.context.channel instanceof Discord.Channel) {
        engine.executor.execute(Send(state.context.channel, new BasicMessage(`Sorry! The bot has to shut down, it should be back momentarily but you will have to restart the game`)))
      }
    })
  })

})

client.login(process.env.BOT_TOKEN);
