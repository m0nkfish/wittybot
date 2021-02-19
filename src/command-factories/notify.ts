import { GlobalCommandFactory, Notify } from '../commands';
import { ReactionAdded } from '../discord-events';
import { RoleMentionNotifyMessage } from '../messages/RoleMentionNotifyMessage';

export const NotifyFactory = () => new GlobalCommandFactory(event => {
  if (event.type === ReactionAdded.type) {
    const {user, reaction, message} = event
    if (message instanceof RoleMentionNotifyMessage) {
      const member = message.role.guild.member(user)
      if (!member) {
        return
      }

      if (reaction.emoji.name === message.notify) {
        return Notify(member, message.role, true)
      } else if (reaction.emoji.name === message.unnotify) {
        return Notify(member, message.role, false)
      }
    }
  }
})
