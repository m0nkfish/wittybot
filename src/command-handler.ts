import { Case } from './case';
import { AnyGameState } from './state';
import { Action } from './witty/actions';
import { Command } from './witty/commands';

export class CommandHandler {
  constructor(public handle: (state: AnyGameState, command: Command) => Promise<Action | undefined>) { }

  orElse = (other: CommandHandler) =>
    new CommandHandler(async (state, command) => {
      return await this.handle(state, command) ?? await other.handle(state, command)
    })

  static sync = (handle: (state: AnyGameState, command: Command) => Action | undefined) =>
    new CommandHandler(async (s, c) => handle(s, c))

  static get build() { return new CommandHandlerBuilder(isAnyGameState, isAnyCommand) }
}

export class CommandHandlerBuilder<State extends AnyGameState, Cmd extends Command> {
  constructor(
    private readonly checkState: (state: AnyGameState) => state is State,
    private readonly checkCommand: (command: Command) => command is Cmd) {}

  sync = (handle: (state: State, command: Cmd) => Action | undefined) =>
    this.async(async (s, h) => handle(s, h))

  async = (handle: (state: State, command: Cmd) => Promise<Action | undefined>) => new CommandHandler(async (state, command) => {
    if (this.checkState(state) && this.checkCommand(command)) {
      return handle(state, command)
    }
  })

  command = <Key extends string, Cmd extends Command>(commandType: CommandType<Key, Cmd>) =>
    new CommandHandlerBuilder<State, Cmd>(this.checkState, isCommand(commandType))

  state = <State extends AnyGameState>(state: Constructor<State>) =>
    new CommandHandlerBuilder<State, Cmd>(isType(state), this.checkCommand)
}

type Constructor<T> = { new(...args: any[]): T }
function isType<T>(ctor: Constructor<T>) {
  return function (item: any): item is T {
    return item instanceof ctor
  }
}

function isAnyGameState(state: AnyGameState): state is AnyGameState {
  return true
}

function isCommand<Key extends string, Cmd extends Command>(type: CommandType<Key, Cmd>) {
  return function (command: Command): command is Cmd {
    return command.type === type.type
  }
}

function isAnyCommand(command: Command): command is Command {
  return true
}

type CommandType<Key extends string, Cmd extends Command> = ((...args: any) => Case<Key, Cmd>) & { type: Key }
