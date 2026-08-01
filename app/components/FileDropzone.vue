<template>
    <div class="group relative overflow-hidden rounded-3xl border border-dashed p-6 transition"
        :class="isDragging ? 'border-cyan-400 bg-cyan-50/80' : 'border-slate-200 bg-slate-50/70 hover:border-cyan-300 hover:bg-cyan-50/50'"
        @dragenter.prevent="handleDragEnter" @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop">
        <div class="pointer-events-none absolute inset-0 bg-linear-to-br from-white via-transparent to-cyan-50/60
        opacity-70">
        </div>

        <div class="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div class="space-y-2">
                <p class="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                    File dropzone
                </p>
                <h2 class="text-xl font-semibold text-slate-950">
                    Drop your documents here.
                </h2>
                <p class="max-w-xl text-sm leading-6 text-slate-600">
                    Supports multiple files at once. Keep source files small and clean before indexing.
                </p>
            </div>

            <div class="flex flex-col gap-3 sm:items-end">
                <button type="button"
                    class="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                    @click="triggerPicker">
                    Browse files
                </button>
                <p class="text-xs text-slate-500">
                    PDF, DOCX, TXT, CSV, MD
                </p>
            </div>
        </div>

        <input ref="inputRef" class="sr-only" type="file" :accept="accept" :multiple="multiple" @change="handleChange">
    </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    accept?: string
    multiple?: boolean
}>(), {
    accept: '.pdf,.doc,.docx,.txt,.csv,.md,.html,.json',
    multiple: true,
})

const emit = defineEmits<{
    (event: 'files-selected', files: File[]): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

function triggerPicker() {
    inputRef.value?.click()
}

function handleChange(event: Event) {
    const target = event.target as HTMLInputElement
    emit('files-selected', target.files ? Array.from(target.files) : [])
    target.value = ''
}

function handleDragEnter() {
    isDragging.value = true
}

function handleDragOver() {
    isDragging.value = true
}

function handleDragLeave(event: DragEvent) {
    if (!event.currentTarget || event.currentTarget === event.target) {
        isDragging.value = false
    }
}

function handleDrop(event: DragEvent) {
    isDragging.value = false

    const droppedFiles = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : []
    if (!droppedFiles.length) {
        return
    }

    emit('files-selected', droppedFiles)
}
</script>