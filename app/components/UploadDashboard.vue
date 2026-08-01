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
                <div class="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <p class="text-sm font-medium text-slate-950">Ingestion profile</p>
                            <p class="mt-1 text-sm leading-6 text-slate-600">
                                Minimal defaults for a document RAG pipeline.
                            </p>
                        </div>
                        <span class="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-800">
                            Ready
                        </span>
                    </div>

                    <dl class="mt-5 grid gap-4 sm:grid-cols-2">
                        <div class="rounded-2xl border border-white bg-white p-4 shadow-sm">
                            <dt class="text-xs uppercase tracking-[0.2em] text-slate-500">Accepted</dt>
                            <dd class="mt-2 text-sm font-medium text-slate-950">PDF, TXT, DOCX, CSV, MD</dd>
                        </div>
                        <div class="rounded-2xl border border-white bg-white p-4 shadow-sm">
                            <dt class="text-xs uppercase tracking-[0.2em] text-slate-500">Chunking</dt>
                            <dd class="mt-2 text-sm font-medium text-slate-950">1,000 tokens / 150 overlap</dd>
                        </div>
                        <div class="rounded-2xl border border-white bg-white p-4 shadow-sm">
                            <dt class="text-xs uppercase tracking-[0.2em] text-slate-500">Embedding</dt>
                            <dd class="mt-2 text-sm font-medium text-slate-950">Queued for vectorization</dd>
                        </div>
                        <div class="rounded-2xl border border-white bg-white p-4 shadow-sm">
                            <dt class="text-xs uppercase tracking-[0.2em] text-slate-500">Index</dt>
                            <dd class="mt-2 text-sm font-medium text-slate-950">Qdrant collection</dd>
                        </div>
                    </dl>
                </div>

                <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="flex items-center justify-between gap-4">
                        <div>
                            <p class="text-sm font-medium text-slate-950">Queue</p>
                            <p class="mt-1 text-sm text-slate-600">{{ queueSubtitle }}</p>
                        </div>
                        <button v-if="files.length" type="button"
                            class="text-sm font-medium text-slate-500 transition hover:text-cyan-700"
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
const files = ref<File[]>([])
const uploadState = ref<'idle' | 'ready'>('idle')

const fileCount = computed(() => files.value.length)
const totalBytes = computed(() => files.value.reduce((sum, file) => sum + file.size, 0))

const totalSizeLabel = computed(() => formatBytes(totalBytes.value))
const uploadStateLabel = computed(() => (uploadState.value === 'ready' ? 'Ready' : 'Idle'))
const queueSubtitle = computed(() => {
    if (!fileCount.value) {
        return 'No files selected yet.'
    }

    return `${fileCount.value} file${fileCount.value === 1 ? '' : 's'} staged for ingestion.`
})

function addFiles(incomingFiles: File[]) {
    const existingKeys = new Set(files.value.map(getFileKey))
    const nextFiles = [...files.value]

    for (const file of incomingFiles) {
        const key = getFileKey(file)
        if (existingKeys.has(key)) {
            continue
        }

        existingKeys.add(key)
        nextFiles.push(file)
    }

    files.value = nextFiles
    uploadState.value = nextFiles.length ? 'ready' : 'idle'
}

function removeFile(index: number) {
    files.value = files.value.filter((_, currentIndex) => currentIndex !== index)
    uploadState.value = files.value.length ? 'ready' : 'idle'
}

function clearFiles() {
    files.value = []
    uploadState.value = 'idle'
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