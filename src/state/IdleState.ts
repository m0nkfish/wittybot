import * as Discord from 'discord.js'
import { Command, Begin } from '../commands';
import { Action, CompositeAction, NewState, DelayedAction, FromStateAction, Send, PromiseAction, OptionalAction } from '../actions';
import { choosePrompt } from '../prompts';
import { GuildContext, GameContext } from '../context';
import { getNotifyRole } from '../notify';
import { NewRoundMessage, GameStartedMessage } from '../messages';
import { GameState } from './GameState';
import { WaitingState } from './WaitingState';
import { SubmissionState } from './SubmissionState'
import { tryParseInt } from '../util';

/** Default state, no active game */
export class IdleState implements GameState<GuildContext> {
  constructor(readonly context: GuildContext) { }

  readonly interpreter = (message: Discord.Message) =>{
    if (message.channel instanceof Discord.TextChannel) {
      const parsed = /^!witty(?: (\d+))?$/.exec(message.content)
      if (parsed) {
        const timeout = tryParseInt(parsed[1]) ?? this.context.config.defaultSubmitDurationSec
        return Begin(message.author, message.channel, timeout)
      }
    }
}
  receive(command: Command): Action | undefined {
    if (command.type === 'begin') {
      const notifyRole = getNotifyRole(command.channel.guild)
      const initiator = command.user
      const start = IdleState.newRound(this.context.newGame(command.channel, initiator, command.timeoutSec), true)

      return PromiseAction(notifyRole.then(role =>
        CompositeAction(
          OptionalAction(role && !this.context.inTestMode && Send(command.channel, new GameStartedMessage(role, command.user))),
          start
        )
      ))
    }
  }

  static newRound = (context: GameContext, firstRound = false) => {
    const roundCtx = context.newRound()

    const prompt = choosePrompt(roundCtx)

    return CompositeAction(
      NewState(new WaitingState(context)),
      PromiseAction(prompt.then(prompt =>
        CompositeAction(
          NewState(SubmissionState.begin(roundCtx, prompt)),
          DelayedAction(context.timeoutSec * 1000, FromStateAction(context.guild, state => OptionalAction(state instanceof SubmissionState && state.context.sameRound(roundCtx) && state.finish()))),
          Send(context.channel, new NewRoundMessage(roundCtx.roundId, prompt, roundCtx.botUser, context.timeoutSec))
        )))
    )
  }
}
