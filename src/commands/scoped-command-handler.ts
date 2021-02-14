import { Case } from '../case';
import { log } from '../log';
import { AnyGameState } from '../state';
import { Action } from '../actions';
import { ScopedCommand } from './command';

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

  command = <Key extends string, Cmd extends ScopedCommand>(commandType: CommandType<Key, Cmd>) =>
    new CommandHandlerBuilder<State, Cmd>(this.checkState, this.stateName, isCommand(commandType), commandType.type)

  state = <State extends AnyGameState>(state: Constructor<State>) =>
    new CommandHandlerBuilder<State, Cmd>(isType(state), state.name, this.checkCommand, this.commandName)
}

type Constructor<T> = { new(...args: any[]): T }
function isType<T>(ctor: Constructor<T>) {
  return function (item: any): item is T {
    return item instanceof ctor
  }
}

type CommandType<Key extends string, Cmd extends ScopedCommand> = ((...args: any) => Case<Key, Cmd>) & { type: Key }
function isCommand<Key extends string, Cmd extends ScopedCommand>(type: CommandType<Key, Cmd>) {
  return function (command: ScopedCommand): command is Cmd {
    return command.type === type.type
  }
}

function isAny<T>(x: T): x is T {
  return true
}

