import { Action, CompositeAction, Send } from "../../actions";
import { PlayerStatuses } from "../model/PlayerStatuses";
import { NotifyRoleMessage, NotifyRoleCountsMessage} from "../messages";
import { MafiaGameContext } from "../context";

export function notifyRoles(context: MafiaGameContext, statuses: PlayerStatuses): Action {
  const privateNotifications = statuses.players
    .map(({ player, role }) => Send(player, new NotifyRoleMessage(role, statuses.findPartner(player))))

  const publicMessage = Send(context.channel, new NotifyRoleCountsMessage(statuses))

  return CompositeAction(publicMessage, ...privateNotifications)
}