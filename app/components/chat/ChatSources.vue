<template>
    <details v-if="sources.length" class="mt-4 rounded-xl border border-slate-200 bg-slate-50">
        <summary
            class="cursor-pointer select-none px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Sources ({{ sources.length }})
        </summary>

        <div class="space-y-2 border-t border-slate-200 p-3">
            <details v-for="source in sources" :key="source.chunkId"
                class="rounded-xl border border-slate-200 bg-white">
                <summary class="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5">
                    <p class="text-xs font-medium text-slate-700">
                        Chunk {{ source.index }}
                    </p>

                    <span class="text-xs text-slate-400">
                        {{ source.score.toFixed(3) }}
                    </span>
                </summary>

                <div dir="auto" class="border-t border-slate-200 px-3 py-3 text-xs leading-5 text-slate-600">
                    {{ source.content }}
                </div>
            </details>
        </div>
    </details>
</template>

<script setup lang="ts">
export interface ChatSource {
    chunkId: string
    documentId: string
    content: string
    score: number
    index: number
}

defineProps<{
    sources: ChatSource[]
}>()
</script>