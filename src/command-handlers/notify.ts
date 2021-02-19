import { AddUserToRole, CompositeAction, RemoveUserFromRole, Send } from '../actions';
import { Notify } from '../commands';
import { GlobalCommandHandler } from '../commands/global-command-handler';
import { BasicMessage } from '../messages';

export const NotifyHandler = () => new GlobalCommandHandler(async command => {
  if (command.type === Notify.type) {
    const { role, member, notify } = command
    return CompositeAction(
      notify ? AddUserToRole(member, role) : RemoveUserFromRole(member, role),
      Send(member.user, new BasicMessage(`You have been ${notify ? 'added to' : 'removed from'} ${role.name} in ${role.guild.name}`))
    )
  }
})