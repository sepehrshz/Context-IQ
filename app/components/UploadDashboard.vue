<template>
    <section class="py-8 sm:py-10">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div
                class="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[1.4fr_1fr]">
                <div class="p-6 sm:p-8">
                    <div class="space-y-8">
                        <!-- Header -->
                        <div class="space-y-3">
                            <p class="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
                                Upload dashboard
                            </p>

                            <h1
                                class="max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                                Upload documents and let the pipeline handle the rest.
                            </h1>

                            <p class="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                                Upload your documents and the ingestion pipeline will
                                automatically parse, chunk, embed, and index them for
                                retrieval.
                            </p>
                        </div>

                        <!-- Stats -->
                        <div class="grid gap-3 sm:grid-cols-3">
                            <div class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
                                    Files
                                </p>

                                <p class="mt-2 text-2xl font-semibold text-slate-950">
                                    {{ fileCount }}
                                </p>

                                <p class="text-sm text-slate-500">
                                    In the queue
                                </p>
                            </div>

                            <div class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
                                    Size
                                </p>

                                <p class="mt-2 text-2xl font-semibold text-slate-950">
                                    {{ totalSizeLabel }}
                                </p>

                                <p class="text-sm text-slate-500">
                                    Across the queue
                                </p>
                            </div>

                            <div class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
                                    Status
                                </p>

                                <p class="mt-2 text-2xl font-semibold text-slate-950">
                                    {{ uploadStateLabel }}
                                </p>

                                <p class="text-sm text-slate-500">
                                    Ingestion pipeline
                                </p>
                            </div>
                        </div>

                        <!-- Dropzone -->
                        <FileDropzone @files-selected="addFiles" />
                    </div>
                </div>

                <!-- Queue -->
                <aside class="space-y-6 p-6 sm:p-8">
                    <div class="max-h-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div class="flex items-center justify-between gap-4">
                            <div>
                                <p class="text-sm font-medium text-slate-950">
                                    Queue
                                </p>

                                <p class="mt-1 text-sm text-slate-600">
                                    {{ queueSubtitle }}
                                </p>
                            </div>

                            <button v-if="files.length" type="button"
                                class="cursor-pointer text-sm font-medium text-slate-500 transition hover:text-cyan-700"
                                @click="clearFiles">
                                Clear all
                            </button>
                        </div>

                        <div class="mt-5">
                            <FileQueue :files="files" @remove="removeFile" />
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { DocumentFile } from '~~/server/types/document'

const files = ref<DocumentFile[]>([])

const fileCount = computed(() => files.value.length)

const totalSizeLabel = computed(() => {
    const total = files.value.reduce(
        (sum, file) => sum + file.size,
        0,
    )

    return formatBytes(total)
})

const uploadStateLabel = computed(() => {
    if (!files.value.length) {
        return 'Idle'
    }

    if (files.value.some((file) => file.status === 'FAILED')) {
        return 'Failed'
    }

    if (files.value.some((file) => file.status !== 'COMPLETED')) {
        return 'Processing'
    }

    return 'Completed'
})

const queueSubtitle = computed(() => {
    if (!files.value.length) {
        return 'No documents uploaded yet'
    }

    if (files.value.length === 1) {
        return '1 document in the queue'
    }

    return `${files.value.length} documents in the queue`
})

async function addFiles(selectedFiles: File[]) {
    if (!selectedFiles.length) {
        return
    }

    const formData = new FormData()

    for (const file of selectedFiles) {
        formData.append('files', file)
    }

    try {
        const response = await $fetch('/api/documents', {
            method: 'POST',
            body: formData,
        })

        if (response) {
            for (const resFile of response) {
                await $fetch(`/api/documents/${resFile.id}/document-processing`, {
                    method: 'POST',
                })
            }
            files.value.push(...response)
            startPolling()
        }
    } catch (error) {
        console.error('Failed to upload files:', error)
    }
}

let pollingTimer: ReturnType<typeof setInterval> | null = null

const isProcessing = computed(() => {
    return files.value.some(
        file =>
            file.status !== 'COMPLETED' &&
            file.status !== 'FAILED'
    )
})

async function refreshDocuments() {
    try {
        const documents = await $fetch('/api/documents')

        files.value = documents
    } catch (error) {
        console.error('Failed to refresh documents:', error)
    }
}

function startPolling() {
    if (pollingTimer) {
        return
    }

    pollingTimer = setInterval(async () => {
        await refreshDocuments()

        if (!isProcessing.value) {
            stopPolling()
        }
    }, 2000)
}

function stopPolling() {
    if (!pollingTimer) {
        return
    }

    clearInterval(pollingTimer)
    pollingTimer = null
}

async function removeFile(index: number) {
    const file = files.value[index]

    if (!file) {
        return
    }

    try {
        await $fetch(`/api/documents/${file.id}`, {
            method: 'DELETE',
        })

        files.value.splice(index, 1)
    } catch (error) {
        console.error('Failed to delete document:', error)
    }
}

function clearFiles() {
    files.value = []
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

onMounted(async () => {
    await refreshDocuments()

    if (isProcessing.value) {
        startPolling()
    }
})

onUnmounted(() => {
    stopPolling()
})
</script>
