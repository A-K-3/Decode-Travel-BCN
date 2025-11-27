<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import ChatInput from '@/components/search/ChatInput.vue'
import SearchForm from '@/components/search/SearchForm.vue'
import { useSearchStore } from '@/composables/useSearchStore'

const router = useRouter()
const { chatMessage, setSearchData } = useSearchStore()

const handleChatSubmit = (): void => {
  if (!chatMessage.value.trim()) return
  setSearchData({ searchMode: 'assistant', generatedPrompt: chatMessage.value })
  router.push('/search-results')
}
</script>

<template>
  <div class="min-h-screen bg-background p-4">
    <div class="max-w-2xl mx-auto">
      <ChatInput
        v-model="chatMessage"
        @submit="handleChatSubmit"
      />

      <div class="flex items-center gap-4 my-6">
        <Separator class="flex-1" />
        <span class="text-muted-foreground font-medium">or</span>
        <Separator class="flex-1" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle class="text-center">Classic Booking</CardTitle>
        </CardHeader>
        <CardContent>
          <SearchForm />
        </CardContent>
      </Card>
    </div>
  </div>
</template>
