/**
 * ChatFab · 悬浮对话按钮
 * 固定在右下角的圆形 FAB，点击跳转 /chat。
 * - 有未读消息（chatStore.unreadCount > 0）时显示红点
 * - 当前已在 /chat 路由时不显示
 * - hover 时微微放大
 */
import { defineComponent, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat.js'

export const ChatFab = defineComponent({
  name: 'ChatFab',
  setup() {
    const router = useRouter()
    const chatStore = useChatStore()

    const unread = computed(() => (chatStore.unreadCount || 0) > 0)
    const onChatRoute = computed(() => router.currentRoute.value.path === '/chat')

    const go = () => {
      chatStore.markRead && chatStore.markRead()
      router.push('/chat')
    }

    return () => {
      if (onChatRoute.value) return null
      return (
        <button class="chat-fab" onClick={go} aria-label="打开 AI 对话">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          {unread.value && <span class="chat-fab__dot" aria-label="有未读消息" />}
        </button>
      )
    }
  }
})

export default ChatFab
