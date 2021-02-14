import { CommandHandler } from '../../commands';
import { Notify } from '../commands';
import { AddUserToRole, CompositeAction, Send } from '../../actions'
import { BasicMessage } from '../../messages';
import { getNotifyRole } from '../notify';

export const NotifyHandler = () => CommandHandler.build.command(Notify).async(async (state, command) => {
  const role = await getNotifyRole(command.member.guild)
  if (role) {
    return CompositeAction(
      AddUserToRole(command.member, role),
      Send(command.member.user, new BasicMessage(`Wittybot will alert you when a new game is begun. **!unnotify** to remove`))
    )
  }
})