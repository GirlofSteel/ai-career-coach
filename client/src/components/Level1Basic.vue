<template>
  <div class="space-y-6">
    <!-- Search Trigger (if not searched yet) -->
    <div v-if="!store.level1Data" class="game-card text-center py-12">
      <div class="text-6xl mb-4">🔍</div>
      <h3 class="text-xl font-bold mb-2">准备搜索面试题目</h3>
      <p class="text-gray-500 mb-6">
        AI 将根据你的岗位 JD 搜索真实面经，整理分类面试题目
      </p>
      <button @click="searchQuestions" :disabled="searching" class="btn-primary text-lg px-10">
        <span v-if="!searching">🔎 开始搜索面经</span>
        <span v-else class="flex items-center gap-2">
          <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          搜索中，请稍候...
        </span>
      </button>
    </div>

    <!-- Results (after search) -->
    <template v-else>
      <!-- JD Analysis Summary -->
      <div class="game-card">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-bold text-lg text-gray-900">
              {{ store.level1Data.jdAnalysis?.company || '' }}
              <span class="text-gray-500 font-normal">-</span>
              {{ store.level1Data.jdAnalysis?.position || '技术岗位' }}
            </h3>
            <div class="flex flex-wrap gap-2 mt-2">
              <span v-for="skill in store.level1Data.jdAnalysis?.keySkills" :key="skill"
                class="badge bg-primary-50 text-primary-700 text-xs">
                {{ skill }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div class="text-2xl font-bold text-primary-700">{{ store.level1Data.stats?.projectCount || 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">项目类</div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div class="text-2xl font-bold text-primary-700">{{ store.level1Data.stats?.theoryCount || 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">八股类</div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div class="text-2xl font-bold text-primary-700">{{ store.level1Data.stats?.algorithmCount || 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">算法类</div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div class="text-2xl font-bold text-gray-600">{{ store.level1Data.stats?.totalQuestions || 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">总计</div>
        </div>
      </div>

      <!-- Controls: Category Filter + Display Mode -->
      <div class="flex flex-wrap items-center gap-3 justify-between">
        <div class="flex flex-wrap gap-2">
          <button v-for="cat in categories" :key="cat.value"
            @click="store.selectedCategory = cat.value; store.currentPage = 1"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            :class="store.selectedCategory === cat.value
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'">
            {{ cat.label }}
          </button>
        </div>
        <div class="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1 overflow-x-auto">
          <span class="text-xs text-gray-400 ml-2">答案显示：</span>
          <button v-for="mode in displayModes" :key="mode.value"
            @click="store.displayMode = mode.value"
            class="px-3 py-1.5 rounded text-xs font-medium transition-all"
            :class="store.displayMode === mode.value
              ? 'bg-gray-800 text-white'
              : 'text-gray-500 hover:bg-gray-100'">
            {{ mode.label }}
          </button>
        </div>
      </div>

      <!-- Question List -->
      <div class="space-y-3">
        <div v-for="q in store.paginatedQuestions" :key="q.id"
          class="game-card hover:border-gray-300 transition-colors">
          <!-- Question Header -->
          <div class="flex flex-col sm:flex-row sm:items-start gap-3">
            <span :class="categoryBadgeClass(q.category)" class="badge text-xs">
              {{ categoryLabel(q.category) }}
            </span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-gray-900">#{{ q.id }}</span>
                <span class="flex text-yellow-400" v-html="starHTML(q.frequency)"></span>
              </div>
              <p class="text-gray-800 font-medium mt-1">{{ q.question }}</p>
            </div>
            <button
              @click="toggleQuestionFavorite(q)"
              class="text-xs px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0 self-start"
              :class="store.isFavorite('level1', favoriteQuestionId(q))
                ? 'bg-slate-50 border-gray-200 text-slate-700 hover:bg-slate-100'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-200 hover:text-slate-600'"
            >
              {{ store.isFavorite('level1', favoriteQuestionId(q)) ? '★ 已收藏' : '☆ 收藏' }}
            </button>
          </div>

          <!-- Source info -->
          <div class="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <a v-if="q.sourceUrl" :href="q.sourceUrl" target="_blank"
              class="text-primary-700 hover:underline flex items-center gap-1">
              🔗 {{ q.source }}
            </a>
            <span>📅 {{ q.sourceDate }}</span>
          </div>

          <!-- Answer Area -->
          <div class="mt-3">
            <!-- Hidden Mode -->
            <div v-if="store.displayMode === 'hidden'" class="text-center py-3 text-gray-400 text-sm">
              🔒 答案已隐藏，点击上方切换显示模式
            </div>

            <!-- Keywords Only Mode -->
            <div v-else-if="store.displayMode === 'keywords'" class="bg-slate-50 rounded-lg p-3 border border-gray-200">
              <span class="text-xs text-slate-600 font-bold">关键词：</span>
              <span v-for="kw in q.keywords" :key="kw"
                class="keyword-highlight text-xs mx-0.5">{{ kw }}</span>
            </div>

            <!-- Full Display Mode -->
            <div v-else class="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p class="text-sm text-gray-700 whitespace-pre-line" v-html="highlightKeywords(q.answer, q.keywords)"></p>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="store.paginatedQuestions.length === 0" class="game-card text-center py-8 text-gray-400">
          当前分类下暂无题目
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="store.totalPages > 1" class="flex flex-wrap items-center justify-center gap-2">
        <button @click="store.currentPage = Math.max(1, store.currentPage - 1)"
          :disabled="store.currentPage === 1"
          class="btn-outline text-sm disabled:opacity-30">上一页</button>
        <span v-for="p in displayPages" :key="p"
          @click="store.currentPage = p"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-sm cursor-pointer transition-all"
          :class="p === store.currentPage
            ? 'bg-primary-600 text-white font-bold'
            : 'hover:bg-gray-100 text-gray-600'">
          {{ p }}
        </span>
        <button @click="store.currentPage = Math.min(store.totalPages, store.currentPage + 1)"
          :disabled="store.currentPage === store.totalPages"
          class="btn-outline text-sm disabled:opacity-30">下一页</button>
      </div>

      <!-- Search Sources -->
      <details class="game-card">
        <summary class="cursor-pointer text-sm text-gray-500 font-medium">
          📚 搜索来源 ({{ store.level1Data.searchSources?.length || 0 }} 条)
        </summary>
        <div class="mt-3 space-y-1">
          <div v-for="(src, i) in store.level1Data.searchSources" :key="i"
            class="flex items-center gap-2 text-sm py-1">
            <span class="text-gray-300">{{ i + 1 }}.</span>
            <a :href="src.url" target="_blank" class="text-primary-600 hover:underline truncate">{{ src.title }}</a>
            <span class="text-xs text-gray-400 flex-shrink-0">{{ src.date }}</span>
          </div>
        </div>
      </details>

    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '../store/game.js'
import { searchQuestions as apiSearchQuestions } from '../api/index.js'

const store = useGameStore()
const searching = ref(false)

const categories = [
  { label: '📋 全部', value: 'all' },
  { label: '📁 项目', value: 'project' },
  { label: '📖 八股', value: 'theory' },
  { label: '💻 算法', value: 'algorithm' },
]

const displayModes = [
  { label: '🔒 隐藏', value: 'hidden' },
  { label: '🔑 关键字', value: 'keywords' },
  { label: '📖 全显示', value: 'full' },
]

const displayPages = computed(() => {
  const pages = []
  const total = store.totalPages
  const current = store.currentPage
  let start = Math.max(1, current - 2)
  let end = Math.min(total, current + 2)
  if (end - start < 4) {
    if (start === 1) end = Math.min(total, start + 4)
    else start = Math.max(1, end - 4)
  }
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function categoryBadgeClass(cat) {
  return { project: 'badge-project', theory: 'badge-theory', algorithm: 'badge-algorithm' }[cat] || ''
}

function categoryLabel(cat) {
  return { project: '项目', theory: '八股', algorithm: '算法' }[cat] || cat
}

function starHTML(freq) {
  const s = Math.min(5, Math.max(0, freq || 0))
  return '⭐'.repeat(s) + '☆'.repeat(5 - s)
}

function highlightKeywords(text, keywords) {
  if (!text || !keywords?.length) return text
  let result = text
  keywords.forEach(kw => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(`(${escaped})`, 'gi'), '<span class="keyword-highlight">$1</span>')
  })
  return result
}

function favoriteQuestionId(q) {
  return `${q.id}-${q.question}`
}

function toggleQuestionFavorite(q) {
  store.toggleFavorite({
    source: 'level1',
    sourceId: favoriteQuestionId(q),
    question: q.question,
    answer: q.answer,
    category: categoryLabel(q.category),
  })
}

async function searchQuestions() {
  searching.value = true
  try {
    const result = await apiSearchQuestions(store.jdText, 'session_' + Date.now())
    if (result.success) {
      store.setLevel1Data(result.data)
      store.saveToHistory()
    }
  } catch (err) {
    store.setError('搜索失败: ' + (err.response?.data?.error || err.message))
  } finally {
    searching.value = false
  }
}

</script>
