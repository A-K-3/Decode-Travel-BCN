<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { MessageSquare, SlidersHorizontal, Loader2 } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import SearchFormInline from '@/components/search/SearchFormInline.vue'
import SearchFilters from '@/components/search/SearchFilters.vue'
import SearchResults from '@/components/search/SearchResults.vue'
import HotelCardSkeleton from '@/components/search/HotelCardSkeleton.vue'
import { useSearchStore } from '@/composables/useSearchStore'
import type { RoomResult, HotelSearchResponse } from '@/types'

const { searchMode, chatMessage, activeTab, generatedPrompt, setSearchData } = useSearchStore()

const hasSearched = ref(false)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const hotelResults = ref<RoomResult[]>([])
const plainTextResponse = ref<string | null>(null)
const sortBy = ref<string>('default')
const starFilters = ref<Record<number, boolean>>({
  1: true,
  2: true,
  3: true,
  4: true,
  5: true
})

// API endpoint
const API_BASE_URL = 'http://172.20.10.9:2000'
const SESSION_ID = '8128'

const fetchHotelResults = async (prompt: string): Promise<HotelSearchResponse | string> => {
  try {
    console.log('Sending request to API:', { prompt, sessionId: SESSION_ID })

    const response = await fetch(`${API_BASE_URL}/prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        sessionId: SESSION_ID
      })
    })

    console.log('API response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error response:', errorText)
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    // Read response as text first (can only read once)
    const text = await response.text()
    console.log('Raw response:', text)

    // Try to parse as JSON
    try {
      const data = JSON.parse(text)
      console.log('Parsed JSON data:', data)

      // Check if it's the new API response format with response.results
      if (data && typeof data === 'object' && data.response &&
          typeof data.response === 'object' &&
          'results' in data.response &&
          Array.isArray(data.response.results)) {
        return data
      }

      // Check if it's a valid HotelSearchResponse with rooms array (old format)
      if (data && typeof data === 'object' && 'rooms' in data && Array.isArray(data.rooms)) {
        return data
      }

      // If JSON but not expected format, try to extract text
      if (typeof data === 'string') {
        return data
      }

      // If object with message/text/response field
      if (data.message || data.text || data.response) {
        return data.message || data.text || data.response
      }

      // Return JSON as formatted string
      return JSON.stringify(data, null, 2)
    } catch (jsonError) {
      // Not valid JSON, return as plain text
      console.log('Response is not JSON, returning as plain text')
      return text
    }
  } catch (error) {
    console.error('Fetch error details:', error)
    throw error
  }
}

const sendPrompt = async (prompt: string): Promise<void> => {
  isLoading.value = true
  errorMessage.value = null
  plainTextResponse.value = null
  hasSearched.value = true
  hotelResults.value = []

  try {
    const response = await fetchHotelResults(prompt)

    // Check if response is a string (plain text)
    if (typeof response === 'string') {
      plainTextResponse.value = response
      hotelResults.value = []
      chatMessage.value = '' // Clear the input field
    } else {
      // It's a HotelSearchResponse object - check for new format with response.results
      if (response.response && Array.isArray(response.response.results)) {
        hotelResults.value = response.response.results
      } else if ('rooms' in response && Array.isArray(response.rooms)) {
        // Old format with rooms array
        hotelResults.value = response.rooms || []
      } else {
        hotelResults.value = []
      }
      plainTextResponse.value = null
      chatMessage.value = '' // Clear the input field
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    errorMessage.value = `Failed to load search results: ${message}`
    console.error('Search error:', error)
  } finally {
    isLoading.value = false
  }
}

const handleChatSubmit = (): void => {
  if (!chatMessage.value.trim()) return
  setSearchData({ generatedPrompt: chatMessage.value })
  sendPrompt(chatMessage.value)
}

const handleClassicSearch = (prompt: string): void => {
  sendPrompt(prompt)
}

onMounted(() => {
  if (generatedPrompt.value) {
    sendPrompt(generatedPrompt.value)
  }
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="w-full px-4 py-3 flex justify-center">
        <Tabs v-model="searchMode" class="w-full max-w-7xl">
          <div class="flex items-center justify-center gap-4">
            <TabsList>
              <TabsTrigger value="assistant" class="gap-2">
                <MessageSquare class="h-4 w-4" />
                Assistant
              </TabsTrigger>
              <TabsTrigger value="classic" class="gap-2">
                <SlidersHorizontal class="h-4 w-4" />
                Classic
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="assistant" class="mt-0 flex justify-center">
            <form @submit.prevent="handleChatSubmit" class="flex gap-2 max-w-2xl w-full">
              <Input
                v-model="chatMessage"
                type="text"
                placeholder="Ask me anything about your travel..."
                class="flex-1"
                :disabled="isLoading"
              />
              <Button type="submit" :disabled="isLoading">
                <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin mr-2" />
                Search
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="classic" class="mt-0">
            <SearchFormInline @search="handleClassicSearch" :disabled="isLoading" />
          </TabsContent>
        </Tabs>
      </div>
    </header>

    <main class="w-full px-8 py-6">
      <div class="flex gap-6 max-w-[1600px] mx-auto">
        <SearchFilters
          :search-type="activeTab"
          v-model:sort-by="sortBy"
          v-model:star-filters="starFilters"
          class="border-r pr-6"
        />

        <div class="flex-1">
          <!-- Loading State - Skeleton Cards -->
          <div v-if="isLoading" class="space-y-6">
            <div>
              <h2 class="text-lg font-semibold mb-4">Searching...</h2>
              <div class="space-y-3">
                <HotelCardSkeleton v-for="n in 5" :key="n" />
              </div>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="errorMessage" class="text-center py-12">
            <div class="bg-destructive/10 text-destructive rounded-lg p-6 max-w-md mx-auto">
              <p class="font-medium">Something went wrong</p>
              <p class="text-sm mt-2">{{ errorMessage }}</p>
              <Button
                variant="outline"
                size="sm"
                class="mt-4"
                @click="generatedPrompt ? sendPrompt(generatedPrompt) : null"
              >
                Try Again
              </Button>
            </div>
          </div>

          <!-- Results -->
          <SearchResults
            v-else-if="hasSearched"
            :search-type="activeTab"
            :hotels="hotelResults"
            :sort-by="sortBy"
            :star-filters="starFilters"
            :plain-text-response="plainTextResponse"
          />

          <!-- Initial State -->
          <div v-else class="text-center text-muted-foreground py-12">
            <p class="text-lg">Search results will appear here</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
