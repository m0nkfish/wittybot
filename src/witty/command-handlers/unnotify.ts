import { CommandHandler } from '../../commands';
import { Unnotify } from '../commands';
import { CompositeAction, RemoveUserFromRole, Send } from '../../actions'
import { BasicMessage } from '../../messages';
import { getNotifyRole } from '../notify';

export const UnnotifyHandler = CommandHandler.build.command(Unnotify).async(async (state, command) => {
  const role = await getNotifyRole(command.member.guild)
  if (role) {
    return CompositeAction(
      RemoveUserFromRole(command.member, role),
      Send(command.member.user, new BasicMessage(`Wittybot will no longer alert you when a new game is begun`))
    )
  }
})