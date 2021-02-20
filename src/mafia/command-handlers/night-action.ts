import { NewState, Send, toAction } from '../../actions'
import { CommandHandler } from "../../commands"
import { BasicMessage, mention } from "../../messages"
import { Distract, Idle, Kill, Protect, Track } from "../commands"
import { commandText, getCommandText } from "../messages"
import { NightState } from "../state"

export const NightActionHandler = () => CommandHandler.build.state(NightState)
  .command(Idle).orCommand(Kill).orCommand(Distract).orCommand(Protect).orCommand(Track)
  .sync((state, command) => toAction(function* () {
    const { user, target } = command
    if (!user.canPerform(command)) {
      return
    }

    const existingIntention = state.intentions.get(user)
    if (existingIntention) {
      return Send(user.user, new BasicMessage(`You have already chosen to ${getCommandText(existingIntention)}`))
    }

    const partners = state.players.findPartners(user) ?? []
    for (const partner of partners) {
      const existingIntention = state.intentions.get(partner)
      if (existingIntention) {
        return Send(user.user, new BasicMessage(`Your partner, ${mention(partner.user)}, has already chosen to ${getCommandText(existingIntention)}`))
      }
    }

    if (target && partners.includes(target)) {
      return Send(user.user, new BasicMessage(`You cannot ${commandText(command).verb} a partner`))
    }

    if (user === target) {
      return Send(user.user, new BasicMessage(`You cannot ${commandText(command).verb} yourself`))
    }

    const newState = state.withIntention(command)

    yield NewState(newState)
    if (newState.allDone()) {
      return newState.sunrise()
    }
  }))