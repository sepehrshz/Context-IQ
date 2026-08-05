<template>
    <section
        class="overflow-hidden rounded-4xl border border-slate-200/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm">
        <div class="grid gap-0 xl:grid-cols-[1.3fr_0.9fr]">
            <div class="border-b border-slate-200/80 p-6 sm:p-8 xl:border-b-0 xl:border-r">
                <div class="flex flex-col gap-6">
                    <div class="flex flex-wrap items-center gap-3">
                        <span
                            class="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium tracking-wide text-cyan-700">
                            RAG ingest workspace
                        </span>
                        <span
                            class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                            Local upload queue
                        </span>
                    </div>

                    <div class="space-y-3">
                        <p class="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
                            Upload dashboard
                        </p>
                        <h1
                            class="max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                            Stage documents for parsing, chunking, and vector indexing.
                        </h1>
                        <p class="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                            Drop files in one place, review the queue, and keep the ingestion flow clean for your
                            retrieval pipeline.
                        </p>
                    </div>

                    <div class="grid gap-3 sm:grid-cols-3">
                        <div class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                            <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Files</p>
                            <p class="mt-2 text-2xl font-semibold text-slate-950">{{ fileCount }}</p>
                            <p class="text-sm text-slate-500">Ready to ingest</p>
                        </div>
                        <div class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                            <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Size</p>
                            <p class="mt-2 text-2xl font-semibold text-slate-950">{{ totalSizeLabel }}</p>
                            <p class="text-sm text-slate-500">Across the queue</p>
                        </div>
                        <div class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                            <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
                            <p class="mt-2 text-2xl font-semibold text-slate-950">{{ uploadStateLabel }}</p>
                            <p class="text-sm text-slate-500">Upload pipeline</p>
                        </div>
                    </div>

                    <FileDropzone @files-selected="addFiles" />
                </div>
            </div>

            <aside class="space-y-6 p-6 sm:p-8">
                <div class="rounded-3xl max-h-full border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="flex items-center justify-between gap-4">
                        <div>
                            <p class="text-sm font-medium text-slate-950">Queue</p>
                            <p class="mt-1 text-sm text-slate-600">{{ queueSubtitle }}</p>
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
    </section>
</template>

<script setup lang="ts">
import type { DocumentFile } from '~~/server/types/document'
const files = ref<DocumentFile[]>([])
const diskFiles = ref<File[]>([])

onMounted(async () => {
    files.value = await $fetch<DocumentFile[]>('/api/documents', { method: 'GET' })
})

const uploadState = ref<'idle' | 'ready' | 'uploading'>('idle')

const fileCount = computed(() => files.value.length)
const totalBytes = computed(() => files.value.reduce((sum, file) => sum + file.size, 0))

const totalSizeLabel = computed(() => formatBytes(totalBytes.value))
const uploadStateLabel = computed(() => {
    if (uploadState.value === 'uploading') {
        return 'Uploading'
    }

    return uploadState.value === 'ready' ? 'Ready' : 'Idle'
})
const queueSubtitle = computed(() => {
    if (!fileCount.value) {
        return 'No files selected yet.'
    }

    return `${fileCount.value} file${fileCount.value === 1 ? '' : 's'} staged for ingestion.`
})

async function addFiles(incomingFiles: File[]) {
    const existingKeys = new Set(diskFiles.value.map(getFileKey))
    const nextFiles = [...diskFiles.value]
    const filesToUpload: File[] = []

    for (const file of incomingFiles) {
        const key = getFileKey(file)
        if (existingKeys.has(key)) {
            continue
        }

        existingKeys.add(key)
        nextFiles.push(file)
        filesToUpload.push(file)
    }

    diskFiles.value = nextFiles
    uploadState.value = nextFiles.length ? 'ready' : 'idle'

    if (!filesToUpload.length) {
        return
    }

    uploadState.value = 'uploading'

    try {
        const uploadedFiles = await saveFilesToServer(filesToUpload)

        files.value.push(...uploadedFiles)

        diskFiles.value = []
    } finally {
        uploadState.value = 'ready'
    }
}

async function removeFile(index: number) {
    const file = files.value[index]

    if (!file) {
        return
    }

    await $fetch(`/api/documents/${file.id}`, {
        method: 'DELETE',
    })

    files.value.splice(index, 1)
}

function clearFiles() {
    // files.value = files.value.filter((_, currentIndex) => currentIndex !== index)
    // uploadState.value = files.value.length ? 'ready' : 'idle'    diskFiles.value = []
    // uploadState.value = 'idle'
}

async function saveFilesToServer(filesToUpload: File[]) {
    const formData = new FormData()

    for (const file of filesToUpload) {
        formData.append('files', file, file.name)
    }

    return await $fetch<DocumentFile[]>('/api/documents', {
        method: 'POST',
        body: formData,
    })
}

function getFileKey(file: File) {
    return `${file.name}-${file.size}-${file.lastModified}`
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