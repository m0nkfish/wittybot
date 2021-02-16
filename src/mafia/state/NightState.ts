import { Action, CompositeAction, Send, NewState, DelayedAction, FromStateAction, OptionalAction } from '../../actions';
import { GameState } from "../../state";
import { Timer, isNonNull } from '../../util';
import { NightDuration } from '../constants';
import { MafiaGameContext } from '../context';
import { PlayerStatuses } from "../PlayerStatuses";
import { Role, roleCommands } from '../role';
import { Emojis, NightBeginsPublicMessage, NightRoleMessage } from '../messages';
import { PlayerIntentions, PlayerFate } from '../PlayerIntentions';
import * as Discord from 'discord.js';
import { MafiaRoleCommandFactory } from '../commands';
import { BasicMessage, mention } from '../../messages';

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
            : `${Emojis.dagger} You met a slick and business-like end: "Say hello to my little friend..."`
          return Send(f.target, new BasicMessage(flavour + `\nYou are now **dead**, please refrain from talking until the game is over`))
        case PlayerFate.Tracked.type:
          return Send(f.player, new BasicMessage(`You tracked ${mention(f.target)} and discovered their role: **${this.players.role(f.target)}**`))
      }
    })

    const deaths = fates.map(f => f.type === PlayerFate.Killed.type ? f.target : undefined)
      .filter(isNonNull)

    const newState = this.players.kill(deaths)

    return CompositeAction(
      ...messages
    )
  }

  static enter(context: MafiaGameContext, statuses: PlayerStatuses, round: number): Action {
    const nightRolePMs = statuses
      .alive()
      .map(({ player, role }) => {
        const command = roleCommands.get(role)?.night
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
      ...nightRolePMs,
      Send(context.channel, new NightBeginsPublicMessage(context, round)),
      NewState(new NightState(context, statuses, new PlayerIntentions([]), round, Timer.begin())),
      DelayedAction(NightDuration, onTimeout)
    )
  }
}