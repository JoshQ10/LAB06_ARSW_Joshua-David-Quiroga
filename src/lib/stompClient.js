import { Client } from '@stomp/stompjs'

export const topicOf = (author, name) => `/topic/blueprints.${author}.${name}`

// STOMP viaja sobre WebSocket nativo: http(s)://host -> ws(s)://host/ws-blueprints
export const brokerUrlOf = (baseUrl) =>
  `${baseUrl.replace(/\/$/, '').replace(/^http/, 'ws')}/ws-blueprints`

export function createStompClient(baseUrl) {
  return new Client({
    brokerURL: brokerUrlOf(baseUrl),
    reconnectDelay: 1000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  })
}

export function subscribeBlueprint(client, author, name, onMsg) {
  return client.subscribe(topicOf(author, name), (m) => {
    onMsg(JSON.parse(m.body))
  })
}
