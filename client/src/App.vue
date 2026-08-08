<template>
  <div class="min-h-screen bg-white flex flex-col lg:flex-row">
    <!-- ========== Sidebar ========== -->
    <aside class="w-full lg:w-60 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col lg:h-screen sticky top-0 z-40 flex-shrink-0">
      <!-- Logo -->
      <div class="px-4 sm:px-5 py-3 sm:py-5 border-b border-gray-100">
        <div class="flex items-center gap-2.5">
          <span class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <img :src="coachIcon" alt="" class="w-6 h-6" />
          </span>
          <div>
            <h1 class="text-base font-bold text-[#080D1C]">AI 求职助手</h1>
            <p class="text-xs text-slate-500">面试准备一站式工具</p>
          </div>
        </div>
      </div>

      <!-- Nav Tabs -->
      <nav class="flex-1 px-3 py-3 lg:py-4 lg:space-y-1 overflow-hidden lg:overflow-y-auto">
        <div class="text-xs text-gray-400 uppercase tracking-wider px-2 mb-2 hidden lg:block">功能导航</div>

        <div class="flex lg:block gap-2 min-w-max lg:min-w-0 overflow-x-auto lg:overflow-x-visible">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="switchTab(tab.id)"
            :disabled="!tab.enabled"
            class="w-auto lg:w-full flex items-center gap-2 lg:gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors duration-200 text-left flex-shrink-0"
            :class="tabClass(tab)"
          >
            <span class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="store.activeTab === tab.id ? 'bg-white/10' : 'bg-slate-100'">
              <img
                :src="tab.icon"
                alt=""
                class="w-5 h-5 transition-[filter] duration-200"
                :class="store.activeTab === tab.id ? 'brightness-0 invert' : ''"
              />
            </span>
            <div class="min-w-0">
              <div class="truncate">{{ tab.label }}</div>
              <div v-if="!tab.enabled" class="text-xs text-gray-300 truncate hidden sm:block">{{ tab.hint }}</div>
            </div>
            <span v-if="tab.enabled && tab.badge" class="ml-auto w-1.5 h-1.5 rounded-full bg-[#111827] flex-shrink-0"></span>
            <span v-if="!tab.enabled" class="ml-auto text-gray-300 flex-shrink-0 hidden lg:inline">🔒</span>
          </button>
        </div>

        <!-- Divider -->
        <div class="border-t border-gray-100 my-3 hidden lg:block"></div>

        <!-- Current Status -->
        <div class="px-2 py-2 flex items-center gap-4 lg:block">
          <div class="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1.5 lg:mb-2">
            <span>当前状态</span>
            <span
              class="inline-flex"
              @mouseenter="showStatusTooltip"
              @mouseleave="hideStatusTooltip"
              ref="statusHelpRef"
            >
              <span class="w-4 h-4 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px] leading-none cursor-help">
                i
              </span>
            </span>
          </div>
          <div class="flex flex-wrap lg:block gap-x-4 gap-y-1 lg:space-y-1.5">
            <div class="flex items-center gap-2 text-xs">
              <span :class="store.jdText ? 'text-[#111827]' : 'text-gray-300'">●</span>
              <span :class="store.jdText ? 'text-gray-600' : 'text-gray-400'">岗位 JD</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span :class="store.resumeText ? 'text-[#111827]' : 'text-gray-300'">●</span>
              <span :class="store.resumeText ? 'text-gray-600' : 'text-gray-400'">个人简历</span>
            </div>
          </div>
        </div>
      </nav>

      <!-- Footer -->
      <div class="px-4 sm:px-5 py-3 border-t border-gray-100">
        <button
          @click="store.resetGame()"
          class="w-full text-xs text-slate-500 hover:text-[#111827] transition-colors py-1.5 flex items-center justify-center gap-2"
        >
          <img :src="restartIcon" alt="" class="w-4 h-4" />
          <span>重新开始</span>
        </button>
        <p class="text-xs text-gray-300 text-center mt-1 hidden lg:block">Powered by DeepSeek + Tavily</p>
      </div>
    </aside>

    <!-- ========== Main Content ========== -->
    <main class="flex-1 min-w-0">
      <!-- Top Bar -->
      <header class="bg-white border-b border-gray-200 min-h-16 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 px-4 sm:px-8 py-4 lg:sticky lg:top-0 z-30">
        <h2 class="text-lg sm:text-xl font-bold text-[#080D1C]">{{ currentTabLabel }}</h2>
        <span class="text-xs sm:text-sm text-slate-500 sm:ml-0">{{ currentTabDesc }}</span>
      </header>

      <!-- Error Toast -->
      <div
        v-if="store.error"
        class="fixed top-4 left-4 right-4 sm:left-auto z-50 bg-white border border-gray-200 text-[#080D1C] px-4 py-3 rounded-2xl shadow-sm sm:max-w-sm"
      >
        {{ store.error }}
        <button @click="store.error = null" class="ml-3 font-bold">✕</button>
      </div>

      <!-- Content Area -->
      <div class="p-4 sm:p-6 lg:p-8">
        <UploadPanel v-if="store.activeTab === 'upload'" />
        <Level1Basic v-if="store.activeTab === 'level1'" />
        <Level2Personal v-if="store.activeTab === 'level2'" />
        <Level3Interview v-if="store.activeTab === 'level3'" />
        <QuestionFavorites v-if="store.activeTab === 'favorites'" />
      </div>
    </main>

    <div
      v-if="statusTooltipVisible"
      class="pointer-events-none fixed z-[9999] w-72 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-normal leading-relaxed tracking-normal text-slate-600 shadow-sm"
      :style="statusTooltipStyle"
    >
      完成岗位 JD 上传并确认后，可解锁「基础知识排查」模块；继续上传个人简历并确认后，可解锁「个性化问题」和「模拟面试」模块。
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from './store/game.js'
import UploadPanel from './components/UploadPanel.vue'
import Level1Basic from './components/Level1Basic.vue'
import Level2Personal from './components/Level2Personal.vue'
import Level3Interview from './components/Level3Interview.vue'
import QuestionFavorites from './components/QuestionFavorites.vue'
import coachIcon from './assets/icons/coach-icon.svg'
import uploadIcon from './assets/icons/upload.svg'
import basicIcon from './assets/icons/basic.svg'
import personalIcon from './assets/icons/personal.svg'
import interviewIcon from './assets/icons/interview.svg'
import favoritesIcon from './assets/icons/favorites.svg'
import restartIcon from './assets/icons/restart.svg'

const store = useGameStore()
const statusHelpRef = ref(null)
const statusTooltipVisible = ref(false)
const statusTooltipStyle = ref({})

const tabs = computed(() => [
  {
    id: 'upload',
    label: '数据上传',
    icon: uploadIcon,
    hint: '请先上传',
    enabled: true,
    badge: false,
  },
  {
    id: 'level1',
    label: '基础知识排查',
    icon: basicIcon,
    hint: '需确认岗位JD',
    enabled: store.uploadConfirmed && !!store.jdText,
    badge: !!store.level1Data,
  },
  {
    id: 'level2',
    label: '个性化问题',
    icon: personalIcon,
    hint: '需确认JD + 简历',
    enabled: store.uploadConfirmed && !!(store.jdText && store.resumeText),
    badge: !!store.level2Data,
  },
  {
    id: 'level3',
    label: '模拟面试',
    icon: interviewIcon,
    hint: '需确认JD + 简历',
    enabled: store.uploadConfirmed && !!(store.jdText && store.resumeText),
    badge: store.isInterviewFinished,
  },
  {
    id: 'favorites',
    label: '问题收藏',
    icon: favoritesIcon,
    hint: '',
    enabled: true,
    badge: store.favoriteQuestions.length > 0,
  },
])

const currentTabLabel = computed(() => {
  const tab = tabs.value.find(t => t.id === store.activeTab)
  return tab?.label || ''
})

const currentTabDesc = computed(() => {
  const descs = {
    upload: '上传岗位JD与个人简历',
    level1: 'AI搜索面经，分类整理面试题目',
    level2: '匹配度评估，简历诊断，个性化提问',
    level3: 'AI面试官深度追问，实时反馈',
    favorites: '集中查看和管理收藏的问题与答案',
  }
  return descs[store.activeTab] || ''
})

function tabClass(tab) {
  if (!tab.enabled) {
    return 'text-gray-300 cursor-not-allowed bg-transparent'
  }
  if (store.activeTab === tab.id) {
    return 'text-white bg-[#111827]'
  }
  return 'text-slate-600 hover:bg-slate-100 hover:text-[#080D1C]'
}

function switchTab(tabId) {
  const tab = tabs.value.find(t => t.id === tabId)
  if (tab?.enabled) {
    store.activeTab = tabId
  }
}

function showStatusTooltip() {
  const el = statusHelpRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const tooltipWidth = 288
  const viewportPadding = 12
  const left = Math.min(
    window.innerWidth - tooltipWidth - viewportPadding,
    Math.max(viewportPadding, rect.left + rect.width / 2 - tooltipWidth / 2)
  )
  statusTooltipStyle.value = {
    left: `${left}px`,
    top: `${rect.bottom + 8}px`,
  }
  statusTooltipVisible.value = true
}

function hideStatusTooltip() {
  statusTooltipVisible.value = false
}
</script>
