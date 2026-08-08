<template>
    <div>
        <div v-if="!files.length"
            class="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
            <p class="text-sm font-medium text-slate-950">No files queued</p>
            <p class="mt-2 text-sm leading-6 text-slate-500">
                Use the dropzone to add documents before you connect ingestion.
            </p>
        </div>

        <ul v-else class="max-h-[70vh] space-y-3 overflow-y-auto pr-2">
            <li v-for="(file, index) in files" :key="file.id">
                <div class="min-w-0">
                    <p>{{ file.status }}</p>
                    <p class="truncate text-sm font-medium text-slate-950">
                        {{ file.originalName }}
                    </p>
                    <p class="mt-1 text-xs text-slate-500">
                        {{ fileTypeLabel(file) }} · {{ formatBytes(file.size) }}
                    </p>
                </div>

                <button type="button"
                    class="cursor-pointer shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700"
                    @click="emit('remove', index)">
                    Remove
                </button>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import type { DocumentFile } from '~~/server/types/document';


defineProps<{
    files: DocumentFile[]
}>()

const emit = defineEmits<{
    (event: 'remove', index: number): void
}>()

function fileTypeLabel(file: DocumentFile) {
    if (file.mimeType) {
        return file.mimeType
    }

    const extension = file.originalName.split('.').pop()?.toUpperCase()
    return extension ? extension : 'Unknown type'
}

function formatBytes(bytes: number) {
    if (!bytes) {
        return '0 B'
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
    const value = bytes / 1024 ** unitIndex

    return `${value >= 10 || unitIndex === 0 ? value.toFixed(unitIndex === 0 ? 0 : 1) : value.toFixed(1)} ${units[unitIndex]}`
}
</script>