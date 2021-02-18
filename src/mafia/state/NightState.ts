import { Action, CompositeAction, DelayedAction, FromStateAction, NewState, OptionalAction, Send } from '../../actions';
import { BasicMessage, mention } from '../../messages';
import { GameState, IdleState } from "../../state";
import { isNonNull, Timer } from '../../util';
import { MafiaRoleCommandFactory } from '../commands';
import { NightDuration } from '../constants';
import { MafiaGameContext } from '../context';
import { Emojis, NightBeginsPublicMessage, NightRoleMessage, roleText } from '../messages';
import { WinnersMessage } from '../messages/WinnersMessage';
import { Player } from '../model/Player';
import { PlayerFate, PlayerIntentions } from '../model/PlayerIntentions';
import { Players } from "../model/Players";
import { Role } from '../model/Role';
import { DayState } from './DayState';

export class NightState implements GameState<MafiaGameContext> {
  
  constructor(
    readonly context: MafiaGameContext,
    readonly players: Players,
    readonly intentions: PlayerIntentions,
    readonly round: number,
    readonly timer: Timer,
  ) {}

  remaining = () => NightDuration.subtract(this.timer.duration())

  withIntention = (player: Player, action: MafiaRoleCommandFactory, target: Player) =>
    new NightState(this.context, this.players, this.intentions.withIntention(player, action, target), this.round, this.timer)

  sunrise = () => {
    const fates = this.intentions.resolve()

    const messages = fates.map(f => {
      switch (f.type) {
        case PlayerFate.Distracted.type:
          return Send(f.target.user, new BasicMessage(`${Emojis.kiss} You were... somewhat distracted last night, and could not perform your action`))
        case PlayerFate.TargetProtected.type:
          return Send(f.killer.user, new BasicMessage(`${Emojis.shield} Your target was protected; you were unable to kill them`))
        case PlayerFate.Killed.type:
          const flavour = f.role === Role.Werewolf
            ? `${Emojis.wolf} In a flurry of gnashing teeth and razor sharp claws, you met a grizzly end...`
            : `${Emojis.dagger} "Say hello to my little friend..." - You met a quick, sharp end.`
          return Send(f.target.user, new BasicMessage(flavour + `\nYou are now **dead**, please refrain from talking until the game is over`))
        case PlayerFate.Tracked.type:
          return Send(f.player.user, new BasicMessage(`You tracked ${mention(f.target.user)} and discovered their role: **${roleText.get(f.target.role)!.name}**`))
      }
    })

    const deaths = fates.map(f => f.type === PlayerFate.Killed.type ? f.target : undefined)
      .filter(isNonNull)

    const newStatus = this.players.kill(deaths)

    const winners = newStatus.checkWinners()

    const nextState = winners
      ? CompositeAction(
          NewState(new IdleState(this.context.guildCtx)),
          Send(this.context.channel, new WinnersMessage(winners, newStatus)))
      : DayState.enter(this.context, deaths.map(x => x.user), newStatus, this.round + 1)

    return CompositeAction(
      ...messages,
      nextState,
    )
  }

  static enter(context: MafiaGameContext, statuses: Players, round: number): Action {
    const nightRolePMs = statuses
      .alive()
      .map(({ user, role }) => {
        const command = role.commands.night
        if (command) {
          return Send(user, new NightRoleMessage(context, role, command, statuses, round))
        }
      })
      .filter(isNonNull)

    const onTimeout =
      FromStateAction(context.channel.guild, state =>
        OptionalAction(state instanceof NightState && state.context.sameGame(context) && state.sunrise())
      )

    return CompositeAction(
      NewState(new NightState(context, statuses, new PlayerIntentions([]), round, Timer.begin())),
      ...nightRolePMs,
      Send(context.channel, new NightBeginsPublicMessage(context, round)),
      DelayedAction(NightDuration, onTimeout)
    )
  }
}