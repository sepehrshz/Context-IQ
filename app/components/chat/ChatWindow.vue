<template>
    <div class="flex h-full min-h-0 flex-col">
        <!-- Header -->
        <div class="border-b border-slate-200 px-6 py-5">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-slate-950">
                        Context-IQ
                    </p>

                    <p class="mt-1 text-xs text-slate-500">
                        Ask questions about your documents
                    </p>
                </div>

                <button v-if="messages.length" type="button"
                    class="text-sm font-medium text-slate-500 transition hover:text-slate-950" @click="clearChat">
                    New chat
                </button>
            </div>
        </div>

        <!-- Messages -->
        <div ref="messagesContainer" class="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <!-- Empty state -->
            <div v-if="!messages.length" class="flex h-full items-center justify-center">
                <div class="max-w-md text-center">
                    <p class="text-2xl font-semibold tracking-tight text-slate-950">
                        Ask your documents anything.
                    </p>

                    <p class="mt-3 text-sm leading-6 text-slate-500">
                        Context-IQ searches your documents and uses the
                        relevant content to generate an answer.
                    </p>
                </div>
            </div>

            <!-- Messages -->
            <div v-else class="mx-auto max-w-3xl space-y-6">
                <div v-for="(message, index) in messages" :key="index">
                    <ChatMessage :role="message.role" :content="message.content" />

                    <div v-if="message.role === 'assistant' && message.sources?.length" class="ml-0 mt-2">
                        <ChatSources :sources="message.sources" />
                    </div>
                </div>

                <!-- Loading -->
                <div v-if="loading" class="flex justify-start">
                    <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <div class="flex items-center gap-2">
                            <span class="text-sm text-slate-500">
                                Thinking
                            </span>

                            <span class="flex gap-1">
                                <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                                <span
                                    class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                                <span
                                    class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Error -->
                <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {{ error }}
                </div>
            </div>
        </div>

        <!-- Input -->
        <div class="border-t border-slate-200 px-6 py-4">
            <div class="mx-auto max-w-3xl">
                <ChatInput :loading="loading" @send="sendMessage" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ChatSource } from './ChatSources.vue'

interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    sources?: ChatSource[]
}

interface ChatResponse {
    query: string
    answer: string
    sources: ChatSource[]
}

const messages = ref<ChatMessage[]>([])

const loading = ref(false)
const error = ref('')

const messagesContainer = ref<HTMLElement | null>(null)

async function sendMessage(query: string) {
    error.value = ''

    messages.value.push({
        role: 'user',
        content: query,
    })

    loading.value = true

    await nextTick()
    scrollToBottom()

    try {
        const response = await $fetch<ChatResponse>('/api/chat', {
            method: 'POST',
            body: {
                query,
            },
        })

        messages.value.push({
            role: 'assistant',
            content: response.answer,
            sources: response.sources,
        })

        await nextTick()
        scrollToBottom()
    } catch (err) {
        console.error(err)

        error.value = 'Something went wrong while generating the answer.'
    } finally {
        loading.value = false
    }
}

function clearChat() {
    messages.value = []
    error.value = ''
}

function scrollToBottom() {
    const element = messagesContainer.value

    if (!element) {
        return
    }

    element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth',
    })
}
</script>