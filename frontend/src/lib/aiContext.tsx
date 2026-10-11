import { createContext, useContext, useState, type ReactNode } from 'react'

interface AIContextType {
  isChatOpen: boolean
  openChat: () => void
  closeChat: () => void
  toggleChat: () => void
}

const AIContext = createContext<AIContextType>({
  isChatOpen: false,
  openChat: () => {},
  closeChat: () => {},
  toggleChat: () => {},
})

export function AIProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <AIContext.Provider
      value={{
        isChatOpen,
        openChat: () => setIsChatOpen(true),
        closeChat: () => setIsChatOpen(false),
        toggleChat: () => setIsChatOpen((prev) => !prev),
      }}
    >
      {children}
    </AIContext.Provider>
  )
}

export function useAI() {
  return useContext(AIContext)
}
