import { Action } from './actions';
import { log } from './log';
import { logSource, logGuild, logChannel, getName, logMessage, logState } from './witty/loggable';

export function logAction(action: Action) {
  const event = `action:${action.type}`
  if (action.type === 'new-state') {
    const { newState } = action
    log(event, logGuild(newState.context.guild), { state: getName(newState) }, logState(newState))
  } else if (action.type === 'send-message') {
    const { message, destination } = action
    log(event, logSource(destination), { message: getName(message) }, logMessage(message))
  } else if (action.type === 'save-round') {
    log(event, logChannel(action.round.channel), { round: action.round.id })
  }
}
