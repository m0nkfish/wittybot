import { CaseFactory, isCase } from '../case';
import { log } from '../log';
import { AnyGameState } from '../state';
import { Action } from '../actions';
import { ScopedCommand } from './command';
import { Constructor, isAny, isType } from '../util';

export class CommandHandler {
  constructor(public handle: (state: AnyGameState, command: ScopedCommand) => Promise<Action | undefined>) { }

  orElse = (other: CommandHandler) =>
    new CommandHandler(async (state, command) => (await this.handle(state, command)) ?? other.handle(state, command))

  static sync = (handle: (state: AnyGameState, command: ScopedCommand) => Action | undefined) =>
    new CommandHandler(async (s, c) => handle(s, c))

  static get build() { return new CommandHandlerBuilder(isAny, null, isAny, null) }
}

export class CommandHandlerBuilder<State extends AnyGameState, Cmd extends ScopedCommand> {
  constructor(
    private readonly checkState: (state: AnyGameState) => state is State,
    private readonly stateName: string | null,
    private readonly checkCommand: (command: ScopedCommand) => command is Cmd,
    private readonly commandName: string | null) {}

  sync = (handle: (state: State, command: Cmd) => Action | undefined) =>
    this.async(async (s, h) => handle(s, h))

  async = (handle: (state: State, command: Cmd) => Promise<Action | undefined>) => new CommandHandler(async (state, command) => {
    if (this.checkState(state) && this.checkCommand(command)) {
      log('handling_command', { state: this.stateName, command: this.commandName })
      return handle(state, command)
    }
  })

  command = <Key extends string, Cmd extends ScopedCommand>(commandType: CaseFactory<Key, Cmd>) =>
    new CommandHandlerBuilder<State, Cmd>(this.checkState, this.stateName, isCase(commandType), commandType.type)

  state = <State extends AnyGameState>(state: Constructor<State>) =>
    new CommandHandlerBuilder<State, Cmd>(isType(state), state.name, this.checkCommand, this.commandName)
}
