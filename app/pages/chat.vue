<template>
    <main class="h-screen bg-slate-50">
        <div class="mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="h-full py-4 sm:py-6">
                <section class="h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <ChatWindow />
                </section>
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
useHead({
    title: 'Chat · Context-IQ',
})
</script>