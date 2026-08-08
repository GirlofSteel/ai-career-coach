<template>
  <div class="bg-white rounded-2xl  border border-gray-100 p-5 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
    <h3 class="font-bold text-gray-900 mb-1 flex items-center gap-2">
      📋 历史岗位
    </h3>
    <p class="text-xs text-gray-400 mb-4">保存的面试准备记录</p>

    <!-- Current Session -->
    <div v-if="store.jobTitle && store.currentLevel >= 1" class="mb-4">
      <div class="text-xs text-gray-400 uppercase tracking-wide mb-2">当前岗位</div>
      <div class="bg-primary-50 border border-primary-200 rounded-xl p-3">
        <div class="font-medium text-sm text-primary-800 truncate">{{ store.jobTitle }}</div>
        <div class="flex items-center gap-2 mt-1">
          <span class="text-xs text-primary-600">
            第 {{ store.currentLevel }} 关
          </span>
          <span class="text-xs text-primary-400">
            {{ store.level1Data ? '✅' : '⬜' }} 面经
            {{ store.level2Data ? '✅' : '⬜' }} 分析
          </span>
        </div>
        <button @click="store.saveToHistory()"
          class="mt-2 text-xs text-primary-600 hover:text-primary-800 underline">
          💾 保存进度
        </button>
      </div>
    </div>

    <!-- History List -->
    <div class="text-xs text-gray-400 uppercase tracking-wide mb-2">历史记录</div>

    <div v-if="store.jobHistory.length === 0" class="text-center py-6 text-gray-300 text-sm">
      <div class="text-3xl mb-2">📭</div>
      暂无历史记录
      <br>完成第一关后自动保存
    </div>

    <div v-else class="space-y-2">
      <div v-for="entry in store.jobHistory" :key="entry.title"
        class="border border-gray-100 rounded-xl p-3 hover:border-primary-200 hover:shadow-sm transition-all group">
        <div class="font-medium text-sm text-gray-800 truncate">{{ entry.title }}</div>
        <div class="flex items-center gap-2 mt-1 text-xs text-gray-400">
          <span>{{ formatDate(entry.savedAt) }}</span>
          <span v-if="entry.level2Data">· 已完成分析</span>
          <span v-else>· 仅面经</span>
        </div>
        <div class="flex items-center gap-2 mt-2">
          <button @click="store.loadFromHistory(entry)"
            class="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded hover:bg-primary-100 transition-colors">
            📂 继续
          </button>
          <button @click="store.deleteHistory(entry.title)"
            class="text-xs bg-slate-50 text-slate-500 px-2 py-1 rounded hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100">
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-300 text-center">
      AI 求职助手 v1.0
      <br>Powered by DeepSeek + Tavily
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '../store/game.js'

const store = useGameStore()

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
</script>
