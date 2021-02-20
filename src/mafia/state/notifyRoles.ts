import { Action, Send, toAction } from '../../actions';
import { MafiaGameContext } from "../context";
import { NotifyRoleCountsMessage, NotifyRoleMessage } from "../messages";
import { Players } from "../model";

export function notifyRoles(context: MafiaGameContext, statuses: Players): Action {
  return toAction(function* () {
    yield Send(context.channel, new NotifyRoleCountsMessage(statuses))
    yield* statuses.players.map(p => Send(p.user, new NotifyRoleMessage(p.role, statuses.findPartners(p))))
  })
}