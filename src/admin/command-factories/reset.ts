import { CommandFactory } from '../../commands';
import { MessageReceived } from '../../discord-events';
import { Reset } from '../commands/reset';

export const ResetFactory = () => CommandFactory.build.event(MessageReceived)
  .process((state, {message}) => {
    if (message.content !== '!reset' || !message.member) {
      return
    }

    if (!message.member.hasPermission("ADMINISTRATOR")) {
      message.reply(`Only administrators can reset the bot`)
      return
    }

    return Reset(message.member)
  })