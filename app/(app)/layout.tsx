import { Header } from "@/components/app/Header"
import { CartSheet } from "@/components/sheets/CartSheet"
import { Toaster } from "@/components/ui/sonner"
import { CartStoreProvider } from "@/lib/store/cart-store-provider"
import { ChatStoreProvider } from "@/lib/store/chat-store-provider"
import { SanityLive } from "@/sanity/lib/live"
import { ClerkProvider } from "@clerk/nextjs"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <CartStoreProvider>
        <ChatStoreProvider>
          <Header />
          <main>{children}</main>
          <SanityLive />
          <CartSheet />
          <Toaster position="bottom-center" />
        </ChatStoreProvider>
      </CartStoreProvider>
    </ClerkProvider>
  )
}
