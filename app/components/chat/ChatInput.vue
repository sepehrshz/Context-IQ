<template>
    <form class="flex items-end gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
        @submit.prevent="submit">
        <textarea v-model="message" rows="1" placeholder="Ask something about your documents..."
            class="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            :disabled="loading" @keydown.enter.exact.prevent="submit" />

        <button type="submit" :disabled="loading || !message.trim()"
            class="shrink-0 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">
            {{ loading ? 'Thinking...' : 'Send' }}
        </button>
    </form>
</template>

<script setup lang="ts">
const props = defineProps<{
    loading?: boolean
}>()

const emit = defineEmits<{
    (event: 'send', message: string): void
}>()

const message = ref('')

function submit() {
    const value = message.value.trim()

    if (!value || props.loading) {
        return
    }

    emit('send', value)

    message.value = ''
}
</script>