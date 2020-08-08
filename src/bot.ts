import * as Discord from 'discord.js'
import { createEntropy, MersenneTwister19937, pick, shuffle } from 'random-js'

const placeholder = '_____'
const prompts = [
  `a game of wittybot is sure to be ${placeholder}`,
  `i feel witty, oh so witty, i feel witty and pretty and ${placeholder}`
]
const seed = createEntropy()
const mt = MersenneTwister19937.seedWithArray(seed)
function choosePrompt() {
  return pick(mt, prompts)
}

type Prompt = string
type Submission = {
  text: string
  user: Discord.User
}
type Vote = {
  index: number
  user: Discord.User
}

type State =
| { type: 'inactive' }
| { type: 'prompting', prompt: Prompt, submissions: Submission[] }
| { type: 'voting', prompt: Prompt, submissions: Submission[], votes: Vote[] }
let state: State = { type: 'inactive' }

const isWittyChan = (ch: Discord.Channel) => ch instanceof Discord.TextChannel && ch.name === 'wittybot'

const client = new Discord.Client();

client.on('ready', () => {
  console.log('ready!')
  const channel = client.channels.cache.find(isWittyChan) as Discord.TextChannel | undefined
  if (!channel) {
    return
  }
  channel.send(`deployment successful`)
});

client.on('message', message => {
  if (message.author.bot) {
    return
  }

  if (message.content === 'ping') {
    console.log('received ping')
    message.reply('pong');
  }

  if (message.content === '!witty') {
    if (isWittyChan(message.channel)) {
      if (state.type !== 'inactive') {
        message.channel.send(`There is already a game active, fool`)
      } else {
        message.channel.send(`Prepare yourselves for witticisms galore! Send submissions by direct message in the next 30 seconds`)
        const prompt = choosePrompt()
        message.channel.send(`PROMPT: ${prompt}`)
        state = { type: 'prompting', prompt, submissions: [] }
        setTimeout(() => {
          if (state.type !== 'prompting') {
            console.log(`aborting game, incorrect state ${state.type} found`)
            state = { type: 'inactive' }
          } else {
            if (state.submissions.length < 1) {
              message.channel.send(`No submissions, cancelling game`)
              state = { type: 'inactive' }
            } else {
              const submissions = shuffle(mt, state.submissions)
              state = { type: 'voting', prompt, submissions, votes: [] }
              message.channel.send(`Time's up! Vote now from the options below by sending a direct message with the submission's number`)
              message.channel.send(`PROMPT: ${prompt}`)
              submissions.forEach((s, i) => {
                message.channel.send(`${i+1}: ${s.text}`)
              })

              setTimeout(() => {
                if (state.type !== 'voting') {
                  console.log(`aborting game, incorrect state ${state.type} found`)
                  state = { type: 'inactive' }
                } else {
                  message.channel.send(`Voting over! Scores:`)
                  message.channel.send(`PROMPT: ${prompt}`)
                  const withVotes = [...state.submissions.map(x => ({ ...x, votes: [] as Discord.User[]}))]
                  state.votes.forEach(v => withVotes[v.index - 1].votes.push(v.user))
                  withVotes.sort((a, b) => a.votes.length - b.votes.length)
                  withVotes.forEach(x => {
                    message.channel.send(`${x.text} (${x.votes.length} votes)`)
                  })
                  state = { type: 'inactive' }
                }
              }, 10000)
            }
          }
        }, 30000)
      }
    } else {
      message.channel.send(`wittybot only works in #wittybot`)
    }
  }

  if (message.channel instanceof Discord.DMChannel) {
    const user = message.author
    if (state.type === 'prompting') {
      const existing = state.submissions.find(x => x.user === user)
      if (existing) {
        message.reply(`Replacing existing submission for prompt '${state.prompt}`)
      } else {
        message.reply(`Submission received for prompt '${state.prompt}'`)
      }
      const submission = { user, text: message.content }
      state = { ...state, submissions: [...state.submissions.filter(x => x.user !== user), submission] }
    } else if (state.type === 'voting') {
      try {
        const index = Number.parseInt(message.content)
        if (1 <= index && index <= state.submissions.length) {
          const submission = state.submissions[index + 1]
          message.reply(`Vote counted for submission ${index}: ${submission.text}`)
          const vote = { index, user }
          state = {...state, votes: [...state.votes.filter(x => x.user !== user), vote]}
        }
      } catch {
        // ignore
      }
    }
  }
});

client.login(process.env.BOT_TOKEN);