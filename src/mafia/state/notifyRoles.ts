import { Action, CompositeAction, Send } from "../../actions";
import { PlayerStatuses } from "../PlayerStatuses";
import wu from 'wu';
import { NotifyRoleMessage, NotifyRoleCountsMessage} from "../messages";
import { MafiaGameContext } from "../context";

export function notifyRoles(context: MafiaGameContext, statuses: PlayerStatuses): Action {
  const privateNotifications = wu(statuses.players.entries())
    .map(([u, { role }]) => Send(u, new NotifyRoleMessage(role, statuses.findPartner(u))))
    .toArray()

  const publicMessage = Send(context.channel, new NotifyRoleCountsMessage(statuses))

  return CompositeAction(publicMessage, ...privateNotifications)
}