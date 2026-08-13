<template>
    <div class="flex w-full" :class="role === 'user' ? 'justify-end' : 'justify-start'">
        <div class="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7" :class="role === 'user'
            ? 'bg-slate-950 text-white'
            : 'border border-slate-200 bg-white text-slate-800'
            ">
            <p v-html="renderMarkdown(content)" dir="auto"
                :class="isPersian(content) ? 'text-right float-right' : 'text-left float-left'"
                class="whitespace-pre-wrap">
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'

function renderMarkdown(content: string) {
    return marked.parse(content)
}

defineProps<{
    role: 'user' | 'assistant'
    content: string
}>()

function isPersian(text: string) {
    return /[\u0600-\u06FF]/.test(text)
}
</script>