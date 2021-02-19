import { Action, CompositeAction, DelayedAction, FromStateAction, NewState, OptionalAction, Send } from '../../actions';
import { BasicMessage, mention } from '../../messages';
import { GameState, IdleState } from "../../state";
import { isNonNull, Timer } from '../../util';
import { MafiaRoleCommandFactory } from '../commands';
import { MafiaGameContext, MafiaRoundContext } from '../context';
import { Emojis, NightBeginsPublicMessage, NightRoleMessage, roleText, WinnersMessage } from '../messages';
import { NightEndsPublicMessage } from '../messages/NightEndsPublicMessage';
import { Intentions, NightFate, Player, Players, Role } from '../model';
import { DayState } from './DayState';

export class NightState implements GameState<MafiaGameContext> {
  
  constructor(
    readonly context: MafiaRoundContext,
    readonly players: Players,
    readonly intentions: Intentions,
    readonly timer: Timer,
  ) {}

  remaining = () => this.context.settings.nightDuration.subtract(this.timer.duration())

  withIntention = (player: Player, action: MafiaRoleCommandFactory, target: Player) =>
    new NightState(this.context, this.players, this.intentions.with(player, action, target), this.timer)

  cancelIntention = (player: Player) =>
    new NightState(this.context, this.players, this.intentions.cancel(player), this.timer)

  findPartnerIntentions = (player: Player) =>
    (this.players.findPartners(player) ?? []).map(this.intentions.get).filter(isNonNull)

  canTakeAction = (player: Player) =>
    !!player.role.commands.night && !this.intentions.get(player) && this.findPartnerIntentions(player).length === 0

  allDone = () =>
    !this.players.alive().some(this.canTakeAction)

  sunrise = () => {
    const fates = this.intentions.resolve()

    const nightEndMessages = fates.map(f => {
      switch (f.type) {
        case NightFate.Distracted.type:
          return Send(f.target.user, new BasicMessage(`${Emojis.kiss} You were... somewhat distracted last night, and could not perform your action`))
        case NightFate.TargetProtected.type:
          return Send(f.killer.user, new BasicMessage(`${Emojis.shield} Your target was protected; you were unable to kill them`))
        case NightFate.Killed.type:
          const flavour = f.killer.role === Role.Werewolf
            ? `${Emojis.wolf} In a flurry of gnashing teeth and razor sharp claws, you met a grizzly end...`
            : `${Emojis.dagger} "Say hello to my little friend..." - You met a quick, sharp end.`
          return Send(f.target.user, new BasicMessage(flavour + `\nYou are now **dead**, please refrain from talking until the game is over`))
        case NightFate.Tracked.type:
          return Send(f.player.user, new BasicMessage(`You tracked ${mention(f.target.user)} and discovered their role: **${roleText.get(f.target.role)!.name}**`))
      }
    })

    const kills = fates
      .filter(x => x.type === NightFate.Killed.type)
      .map(x => x as ReturnType<typeof NightFate.Killed>)

    const newStatus = this.players.kill(kills, this.context.round)

    const winners = newStatus.checkWinners()

    const nextState = winners
      ? CompositeAction(
          NewState(new IdleState(this.context.guildCtx)),
          Send(this.context.channel, new WinnersMessage(winners, newStatus)))
      : DayState.enter(this.context.nextRound(), newStatus)

    return CompositeAction(
      ...nightEndMessages,
      Send(this.context.channel, new NightEndsPublicMessage(this.context, kills.map(x => x.target))),
      nextState,
    )
  }

  static enter(context: MafiaRoundContext, players: Players): Action {
    const nightState = new NightState(context, players, new Intentions([]), Timer.begin())

    const nightRolePMs = players
      .alive()
      .map(player => {
        const command = player.role.commands.night
        if (command) {
          return Send(player.user, new NightRoleMessage(nightState, player, command))
        }
      })
      .filter(isNonNull)

    const onTimeout =
      FromStateAction(context.channel.guild, state =>
        OptionalAction(state instanceof NightState && state.context.sameGame(context) && state.sunrise())
      )

    return CompositeAction(
      NewState(nightState),
      ...nightRolePMs,
      Send(context.channel, new NightBeginsPublicMessage(context)),
      DelayedAction(context.settings.nightDuration, onTimeout)
    )
  }
}