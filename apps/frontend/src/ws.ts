import { io, type Socket } from 'socket.io-client'

export type ChatMessage = {
  id: number
  type: 'chat'
  sender: string
  text: string
  time: number
}

type ServerToClientEvents = {
  'room-notice': (username: string) => void
  'chat-message': (message: ChatMessage) => void
  typing: (username: string) => void
  'stop-typing': (username: string) => void
}

type ClientToServerEvents = {
  'join-room': (username: string) => void
  'chat-message': (message: ChatMessage) => void
  typing: (username: string) => void
  'stop-typing': (username: string) => void
}

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export function connectWS(): ChatSocket {
  const url =
    import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:8000'

  return io(url, {
    transports: ['websocket'],
  })
}
