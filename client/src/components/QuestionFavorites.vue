<template>
  <div class="space-y-6">
    <div class="game-card">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-lg font-bold text-gray-900">问题收藏</h3>
          <p class="text-sm text-gray-400 mt-1">
            已收藏 {{ store.favoriteQuestions.length }} 道题
          </p>
        </div>
        <div v-if="store.favoriteQuestions.length" class="flex w-full sm:w-auto items-center gap-2">
          <button @click="toggleSelectAll" class="btn-outline text-sm flex-1 sm:flex-none">
            {{ isAllSelected ? '取消全选' : '全选' }}
          </button>
          <button
            @click="deleteSelected"
            :disabled="selectedIds.length === 0"
            class="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-1 sm:flex-none"
          >
            删除选中
          </button>
        </div>
      </div>
    </div>

    <div v-if="store.favoriteQuestions.length === 0" class="game-card text-center py-16">
      <div class="text-5xl mb-4">☆</div>
      <h3 class="text-lg font-bold text-gray-700">暂无收藏问题</h3>
      <p class="text-sm text-gray-400 mt-2">在题目或模拟面试中点击收藏后，会集中显示在这里</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="item in store.favoriteQuestions"
        :key="item.id"
        class="game-card hover:border-gray-300 transition-colors"
      >
        <div class="flex items-start gap-3">
          <input
            v-model="selectedIds"
            :value="item.id"
            type="checkbox"
            class="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
          />
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <span class="badge bg-primary-50 text-primary-700">{{ sourceLabel(item.source) }}</span>
              <span v-if="item.category" class="badge bg-gray-100 text-gray-600">{{ item.category }}</span>
              <span class="text-xs text-gray-400">{{ formatDate(item.createdAt) }}</span>
            </div>
            <p class="text-gray-900 font-medium">{{ item.question }}</p>
            <div class="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p class="text-sm text-gray-700 whitespace-pre-line">{{ item.answer || '暂无答案' }}</p>
            </div>
          </div>
          <button
            @click="store.deleteFavorites([item.id])"
            class="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-slate-500 hover:bg-slate-50 transition-colors flex-shrink-0 self-start"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '../store/game.js'

const store = useGameStore()
const selectedIds = ref([])

const isAllSelected = computed(() => {
  return store.favoriteQuestions.length > 0 && selectedIds.value.length === store.favoriteQuestions.length
})

function toggleSelectAll() {
  selectedIds.value = isAllSelected.value ? [] : store.favoriteQuestions.map(item => item.id)
}

function deleteSelected() {
  store.deleteFavorites(selectedIds.value)
  selectedIds.value = []
}

function sourceLabel(source) {
  return {
    level1: '基础知识',
    level2: '个性化问题',
    level3: '模拟面试',
  }[source] || source
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
