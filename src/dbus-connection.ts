const dbus = require('dbus-native')
const { exec } = require('child_process')

import {debounce} from 'debounce'

interface KRunnerArgs {
  path: string, 
  runFunction?: Function,
  matchFunction?: Function,
  actionsFunction?: Function
}

const sessionBus = dbus.sessionBus()
if (!sessionBus) throw new Error('Could not connect to session bus')

sessionBus.requestName('krunner.zeal', 0x04, (err: any, code: number) => {
  if (err) throw new Error(err)

  if (code === 3) throw new Error(`Anotherkde/krunner/plugin/zeal instance is already running`)
  if (code !== 1)
    throw new Error(
      `Received code ${code} while requesting service name 'net.krunner-zeal'`
    )
})

function createKRunnerInterface({
  path,
  runFunction,
  matchFunction,
  actionsFunction
}: KRunnerArgs) {
  const interfaceFunctions = {
    Actions: actionsFunction,
    Run: runFunction,
    Match: matchFunction
  }

  const interfaceDesc = {
    name: 'org.kde.krunner1',
    methods: {
      Actions: ['', 'a(sss)', [], ['matches']],
      Run: ['ss', '', ['matchId', 'actionId'], []],
      Match: ['s', 'a(sssida{sv})', ['query'], ['matches']]
    }
  }

  sessionBus.exportInterface(interfaceFunctions, path, interfaceDesc)
}

export function start (queryFunction: (query: string) => Promise<string[]>) {
  createKRunnerInterface({
    path: '/com/github/krunnerzeal/1',
    runFunction(matchID: string, actionID: string) {
      const zealQuery = matchID.replace(/ /g, '')

      exec(`zeal ${zealQuery}`)

      return [['KrunnerZeal', 'Hello There!', 'planetkde', 50, 1, {}]]
    },
    matchFunction: debounce(async (query: string) => {
      const res = await queryFunction(query)

      return res.map(result => [result, result, 'zeal', 100, 1, {}])
    }, 300, true)
  })
}
