import { CaseFactory, isCase } from '../case';
import { DiscordEvent } from '../discord-events';
import { AnyGameState } from '../state/GameState';
import { Constructor, isAny, isType } from '../util';
import { ScopedCommand } from './command';

export class CommandFactory<C extends ScopedCommand> {
  constructor(public readonly process: (state: AnyGameState, event: DiscordEvent) => C | undefined) {}

  combine = <C2 extends ScopedCommand>(other: CommandFactory<C2>): CommandFactory<C | C2> => 
    new CommandFactory<C | C2>(
      (state, event) => {
        const c1 = this.process(state, event)
        return c1 !== undefined ? c1 : other.process(state, event)
      }
    )
  
  static get build() { return new CommandFactoryBuilder<AnyGameState, DiscordEvent>(isAny, null, isAny, null) }
}

export class CommandFactoryBuilder<State extends AnyGameState, E extends DiscordEvent> {
  constructor(
    private readonly checkState: (state: AnyGameState) => state is State,
    private readonly stateName: string | null,
    private readonly checkEvent: (event: DiscordEvent) => event is E,
    private readonly eventName: string | null) { }

  event = <E extends DiscordEvent>(eventType: CaseFactory<E>) =>
    new CommandFactoryBuilder<State, E>(this.checkState, this.stateName, isCase(eventType), eventType.type)

  state = <State extends AnyGameState>(state: Constructor<State>) =>
    new CommandFactoryBuilder<State, E>(isType(state), state.name, this.checkEvent, this.eventName)

  process = <C extends ScopedCommand>(process: (state: State, event: E) => C | undefined) =>
    new CommandFactory<C>((state, event) => {
      if (this.checkState(state) && this.checkEvent(event)) {
        return process(state, event)
      }
    })
}
