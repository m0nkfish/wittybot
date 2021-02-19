import { Action } from '../actions';
import { CaseFactory, isCase } from '../case';
import { log } from '../log';
import { AnyGameState } from '../state';
import { Constructor, isAny, isEither, isType } from '../util';
import { ScopedCommand } from './command';

export class CommandHandler {
  constructor(public handle: (state: AnyGameState, command: ScopedCommand) => Promise<Action | undefined>) { }

  orElse = (other: CommandHandler) =>
    new CommandHandler(async (state, command) => (await this.handle(state, command)) ?? other.handle(state, command))

  static sync = (handle: (state: AnyGameState, command: ScopedCommand) => Action | undefined) =>
    new CommandHandler(async (s, c) => handle(s, c))

  static get build() { return new CommandHandlerBuilder(isAny, null, isAny) }
}

export class CommandHandlerBuilder<State extends AnyGameState, Cmd extends ScopedCommand> {
  constructor(
    private readonly checkState: (state: AnyGameState) => state is State,
    private readonly stateName: string | null,
    private readonly checkCommand: (command: ScopedCommand) => command is Cmd) {}

  sync = (handle: (state: State, command: Cmd) => Action | undefined) =>
    this.async(async (s, h) => handle(s, h))

  async = (handle: (state: State, command: Cmd) => Promise<Action | undefined>) => new CommandHandler(async (state, command) => {
    if (this.checkState(state) && this.checkCommand(command)) {
      log('handle-command', { state: this.stateName, command: command.type })
      return handle(state, command)
    }
  })

  command = <Cmd extends ScopedCommand>(commandType: CaseFactory<Cmd>) =>
    new CommandHandlerBuilder<State, Cmd>(this.checkState, this.stateName, isCase(commandType))

  orCommand = <Cmd2 extends ScopedCommand>(commandType: CaseFactory<Cmd2>) =>
    new CommandHandlerBuilder<State, Cmd | Cmd2>(this.checkState, this.stateName, isEither(this.checkCommand, isCase(commandType)))

  state = <State extends AnyGameState>(state: Constructor<State>) =>
    new CommandHandlerBuilder<State, Cmd>(isType(state), state.name, this.checkCommand)
}
