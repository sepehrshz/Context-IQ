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
            <li v-for="(file, index) in files" :key="file.id" class="rounded-2xl border border-slate-200 bg-white p-4">
                <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0">
                        <div class="flex items-center gap-2">
                            <p class="truncate text-sm font-medium text-slate-950">
                                {{ file.originalName }}
                            </p>

                            <span class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium"
                                :class="statusClasses(file.status)">
                                {{ statusLabel(file.status) }}
                            </span>
                        </div>

                        <p class="mt-1 text-xs text-slate-500">
                            {{ fileTypeLabel(file) }} · {{ formatBytes(file.size) }}
                        </p>
                    </div>

                    <button type="button"
                        class="shrink-0 cursor-pointer rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700"
                        @click="emit('remove', index)">
                        Remove
                    </button>
                </div>

                <!-- Processing steps -->
                <div class="mt-4 flex items-center gap-1.5">
                    <template v-for="(step, stepIndex) in pipelineSteps" :key="step.status">
                        <div class="flex items-center gap-1.5">
                            <div class="h-2 w-2 rounded-full" :class="stepClasses(file.status, step.status)" />

                            <span class="text-[11px]" :class="stepTextClasses(file.status, step.status)">
                                {{ step.label }}
                            </span>
                        </div>

                        <div v-if="stepIndex < pipelineSteps.length - 1" class="h-px w-4 bg-slate-200" />
                    </template>
                </div>

                <!-- Error -->
                <p v-if="file.status === 'FAILED'" class="mt-3 text-xs font-medium text-red-600">
                    Processing failed. Please try again.
                </p>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import type { DocumentFile } from '~~/server/types/document'

defineProps<{
    files: DocumentFile[]
}>()

const emit = defineEmits<{
    (event: 'remove', index: number): void
}>()

const pipelineSteps = [
    {
        status: 'UPLOADED',
        label: 'Upload',
    },
    {
        status: 'PARSED',
        label: 'Parse',
    },
    {
        status: 'CHUNKED',
        label: 'Chunk',
    },
    {
        status: 'EMBEDDING',
        label: 'Embed',
    },
    {
        status: 'COMPLETED',
        label: 'Complete',
    },
]

function statusLabel(status: DocumentFile['status']) {
    const labels: Record<string, string> = {
        UPLOADED: 'Uploaded',
        PARSING: 'Parsing',
        PARSED: 'Parsed',
        CHUNKING: 'Chunking',
        CHUNKED: 'Chunked',
        EMBEDDING: 'Embedding',
        COMPLETED: 'Completed',
        FAILED: 'Failed',
    }

    return labels[status] ?? status
}

function statusClasses(status: DocumentFile['status']) {
    const classes: Record<string, string> = {
        UPLOADED: 'bg-slate-100 text-slate-600',
        PARSING: 'bg-amber-50 text-amber-700',
        PARSED: 'bg-cyan-50 text-cyan-700',
        CHUNKING: 'bg-amber-50 text-amber-700',
        CHUNKED: 'bg-cyan-50 text-cyan-700',
        EMBEDDING: 'bg-amber-50 text-amber-700',
        COMPLETED: 'bg-emerald-50 text-emerald-700',
        FAILED: 'bg-red-50 text-red-700',
    }

    return classes[status] ?? 'bg-slate-100 text-slate-600'
}

function stepClasses(
    currentStatus: DocumentFile['status'],
    stepStatus: string,
) {
    if (currentStatus === 'FAILED') {
        return 'bg-red-400'
    }

    const currentIndex = pipelineSteps.findIndex(
        (step) =>
            step.status === currentStatus ||
            (
                currentStatus === 'PARSING' &&
                step.status === 'UPLOADED'
            ) ||
            (
                currentStatus === 'CHUNKING' &&
                step.status === 'PARSED'
            ),
    )

    const stepIndex = pipelineSteps.findIndex(
        (step) => step.status === stepStatus,
    )

    if (stepIndex < currentIndex) {
        return 'bg-emerald-500'
    }

    if (stepIndex === currentIndex) {
        return 'bg-amber-400 animate-pulse'
    }

    return 'bg-slate-200'
}

function stepTextClasses(
    currentStatus: DocumentFile['status'],
    stepStatus: string,
) {
    if (currentStatus === 'FAILED') {
        return 'text-red-500'
    }

    const currentIndex = pipelineSteps.findIndex(
        (step) =>
            step.status === currentStatus ||
            (
                currentStatus === 'PARSING' &&
                step.status === 'UPLOADED'
            ) ||
            (
                currentStatus === 'CHUNKING' &&
                step.status === 'PARSED'
            ),
    )

    const stepIndex = pipelineSteps.findIndex(
        (step) => step.status === stepStatus,
    )

    if (stepIndex < currentIndex) {
        return 'text-emerald-600'
    }

    if (stepIndex === currentIndex) {
        return 'text-amber-600 font-medium'
    }

    return 'text-slate-400'
}

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

    const unitIndex = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1,
    )

    const value = bytes / 1024 ** unitIndex

    return `${value >= 10 || unitIndex === 0
            ? value.toFixed(unitIndex === 0 ? 0 : 1)
            : value.toFixed(1)
        } ${units[unitIndex]}`
}
</script>