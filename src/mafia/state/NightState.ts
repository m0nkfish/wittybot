import { Action, CompositeAction, Send, NewState, DelayedAction, FromStateAction, OptionalAction } from '../../actions';
import { GameState, IdleState } from "../../state";
import { Timer, isNonNull } from '../../util';
import { NightDuration, DayDuration } from '../constants';
import { MafiaGameContext } from '../context';
import { PlayerStatuses } from "../model/PlayerStatuses";
import { Role } from '../model/Role';
import { Emojis, NightBeginsPublicMessage, NightRoleMessage } from '../messages';
import { PlayerIntentions, PlayerFate } from '../model/PlayerIntentions';
import * as Discord from 'discord.js';
import { MafiaRoleCommandFactory } from '../commands';
import { BasicMessage, mention } from '../../messages';
import { DayState } from './DayState';
import { WinnersMessage } from '../messages/WinnersMessage';

export class NightState implements GameState<MafiaGameContext> {
  
  constructor(
    readonly context: MafiaGameContext,
    readonly players: PlayerStatuses,
    readonly intentions: PlayerIntentions,
    readonly round: number,
    readonly timer: Timer,
  ) {}

  remaining = () => NightDuration.subtract(this.timer.duration())

  withIntention = (player: Discord.User, role: Role, action: MafiaRoleCommandFactory, target: Discord.User) =>
    new NightState(this.context, this.players, this.intentions.withIntention(player, role, action, target), this.round, this.timer)

  sunrise = () => {
    const fates = this.intentions.resolve()

    const messages = fates.map(f => {
      switch (f.type) {
        case PlayerFate.Distracted.type:
          return Send(f.target, new BasicMessage(`${Emojis.kiss} You were... somewhat distracted last night, and could not perform your action`))
        case PlayerFate.TargetProtected.type:
          return Send(f.killer, new BasicMessage(`${Emojis.shield} Your target was protected; you were unable to kill them`))
        case PlayerFate.Killed.type:
          const flavour = f.role === Role.Werewolf
            ? `${Emojis.wolf} In a flurry of gnashing teeth and razor sharp claws, you met a grizzly end...`
            : `${Emojis.dagger} "Say hello to my little friend..." - You met a quick, sharp end.`
          return Send(f.target, new BasicMessage(flavour + `\nYou are now **dead**, please refrain from talking until the game is over`))
        case PlayerFate.Tracked.type:
          return Send(f.player, new BasicMessage(`You tracked ${mention(f.target)} and discovered their role: **${this.players.role(f.target).type}**`))
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
      : DayState.enter(this.context, deaths, newStatus, this.round + 1)


    return CompositeAction(
      ...messages,
      nextState,
    )
  }

  static enter(context: MafiaGameContext, statuses: PlayerStatuses, round: number): Action {
    const nightRolePMs = statuses
      .alive()
      .map(({ player, role }) => {
        const command = role.commands.night
        if (command) {
          return Send(player, new NightRoleMessage(context, role, command, statuses, round))
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