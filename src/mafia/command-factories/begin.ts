import * as Discord from 'discord.js';
import { CommandFactory } from '../../commands';
import { MessageReceived } from '../../discord-events';
import { Duration } from '../../duration';
import { IdleState } from '../../state/IdleState';
import { Begin } from '../commands';
import { MafiaSettings } from '../context';

export const BeginFactory = () => CommandFactory.build.state(IdleState).event(MessageReceived).process(((_, { message }) => {
  if (message.channel instanceof Discord.TextChannel && /^!mafia\b/.test(message.content)) {
    const settings: MafiaSettings = {
      nightDuration: Duration.seconds(60),
      dayDuration: Duration.seconds(60),
      reveals:  (/\breveals (on|off)\b/.exec(message.content)?.[1] ?? "on") === "on"
    }
    return Begin(message.author, message.channel, settings)
  }
}))
