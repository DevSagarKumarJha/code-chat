import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import './App.css'
import { connectWS, type ChatMessage, type ChatSocket } from './ws'

type SystemMessage = {
  id: number
  type: 'system'
  text: string
  time: number
}

type Message = ChatMessage | SystemMessage

function App() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const socket = useRef<ChatSocket | null>(null)
  const [showNamePopup, setShowNamePopUp] = useState(true)
  const [inputName, setInputName] = useState('')
  const [username, setUsername] = useState('')
  const [typers, setTypers] = useState<string[]>([])
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    socket.current = connectWS()

    socket.current.on('room-notice', (roomUser) => {
      const notice: SystemMessage = {
        id: Date.now() + Math.random(),
        type: 'system',
        text: `${roomUser} joined the group`,
        time: Date.now(),
      }

      setMessages((prev) => [...prev, notice])
    })

    socket.current.on('chat-message', (msg) => {
      setMessages((prev) => [...prev, msg])
    })

    socket.current.on('typing', (typingUser) => {
      setTypers((prev) => {
        const exists = prev.includes(typingUser)
        if (exists) {
          return prev
        }

        return [...prev, typingUser]
      })
    })

    socket.current.on('stop-typing', (typingUser) => {
      setTypers((prev) => prev.filter((typer) => typer !== typingUser))
    })

    return () => {
      socket.current?.off('room-notice')
      socket.current?.off('chat-message')
      socket.current?.off('typing')
      socket.current?.off('stop-typing')
    }
  }, [])

  useEffect(() => {
    if (!socket.current) {
      return
    }

    if (text) {
      socket.current.emit('typing', username)
      if (timer.current) {
        clearTimeout(timer.current)
      }
    }

    timer.current = setTimeout(() => {
      socket.current?.emit('stop-typing', username)
    }, 1000)

    return () => {
      if (timer.current) {
        clearTimeout(timer.current)
      }
    }
  }, [text, username])

  const formatTimeStamp = (time: number): string => {
    const date = new Date(time)
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')

    return `${hh}:${mm}`
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const name = inputName.trim()
    if (!name) {
      return
    }

    setUsername(name)
    socket.current?.emit('join-room', name)
    setShowNamePopUp(false)
  }

  const sendMessage = () => {
    const trimmed = text.trim()
    if (!trimmed) {
      return
    }

    const userMsg: ChatMessage = {
      id: Date.now(),
      type: 'chat',
      sender: username,
      text: trimmed,
      time: Date.now(),
    }

    setMessages((current) => [...current, userMsg])
    socket.current?.emit('chat-message', userMsg)
    setText('')
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center z-40">
      {showNamePopup && (
        <div className="fixed inset-0 flex items-center justify-center z-40">
          <div className="bg-gray-900 rounded-xl shadow-lg max-w-md p-6">
            <h1 className="text-xl font-semibold text-white">Enter Your name</h1>
            <p className="text-sm font-medium text-gray-400">
              Enter your name to start chatting. This will be used to identify
            </p>

            <form onSubmit={handleSubmit} className="mt-4 flex gap-4 rounded-md">
              <input
                type="text"
                autoFocus
                value={inputName}
                onChange={(event) => setInputName(event.target.value)}
                className="w-full border border-gray-400 rounded-md px-3 py-2 outline-green-900 text-gray-200 placeholder-gray-400"
                placeholder="Your name (e.g. John Doe)"
              />
              <button
                type="submit"
                className="cursor-pointer bg-green-900 text-white block w-fit rounded-md p-2 font-medium"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {!showNamePopup && (
        <div className="w-full max-w-2xl h-[90vh] bg-gray-900 rounded-xl shadow-md flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-10 w-10 rounded-br-2xl rounded-tl-2xl bg-white flex items-center justify-center text-green-800 font-bold">
              R
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-400">Realtime Group Chat</div>
              {typers.length ? (
                <p className="text-xs text-gray-500">{typers.join(', ')} is typing...</p>
              ) : (
                ''
              )}
            </div>
            <div className="text-sm text-gray-500">
              Signed in as <span className="font-medium  text-gray-400">{username}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950 flex flex-col">
            {messages.map((message) => {
              if (message.type === 'system') {
                return (
                  <div key={message.id} className="flex justify-center">
                    <div className="text-xs text-gray-500 italic">
                      {message.text} • {formatTimeStamp(message.time)}
                    </div>
                  </div>
                )
              }

              const mine = message.sender === username
              return (
                <div
                  key={message.id}
                  className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[78%] p-3 my-2 rounded-2xl text-sm leading-5 shadow-sm ${
                      mine
                        ? 'bg-green-900 text-gray-400 rounded-br-md'
                        : 'bg-gray-900 text-gray-400 rounded-bl-md'
                    }`}
                  >
                    <div className="flex justify-between items-center mt-1 gap-16">
                      <div className="text-[10px] font-bold">{message.sender}</div>
                      <div className="text-[10px] text-gray-500 font-bold">
                        {formatTimeStamp(message.time)}
                      </div>
                    </div>
                    <div className="wrap-break-word text-white whitespace-pre-wrap">
                      {message.text}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-4 py-3 border-t border-gray-800 bg-black">
            <div className="flex items-center justify-between gap-4 border border-gray-800 rounded">
              <textarea
                rows={1}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="w-full resize-none px-4 py-4 text-sm text-gray-200 outline-none"
              />

              <button
                onClick={sendMessage}
                className="bg-green-800 text-white px-4 py-2 mr-2 rounded-md text-sm font-medium cursor-pointer"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
