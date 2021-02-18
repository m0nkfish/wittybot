import { Action, CompositeAction, Send } from "../../actions";
import { MafiaGameContext } from "../context";
import { NotifyRoleCountsMessage, NotifyRoleMessage } from "../messages";
import { Players } from "../model/Players";

export function notifyRoles(context: MafiaGameContext, statuses: Players): Action {
  const privateNotifications = statuses.players
    .map(p => Send(p.user, new NotifyRoleMessage(p.role, statuses.findPartners(p))))

  const publicMessage = Send(context.channel, new NotifyRoleCountsMessage(statuses))

  return CompositeAction(publicMessage, ...privateNotifications)
}