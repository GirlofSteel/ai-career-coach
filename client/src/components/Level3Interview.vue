<template>
  <div class="space-y-6">
    <!-- Start Interview (if not started) -->
    <div v-if="!store.interviewId && !starting" class="game-card text-center py-12">
      <div class="text-6xl mb-4">💬</div>
      <h3 class="text-xl font-bold mb-2">模拟面试</h3>
      <p class="text-gray-500 mb-6">
        AI 面试官将根据你的简历进行深度追问，模拟真实面试场景
      </p>
      <div class="text-sm text-gray-400 mb-4 space-y-1">
        <p>• AI 会根据你的回答质量决定追问方向</p>
        <p>• 共约 8-10 轮对话，覆盖项目、基础、设计</p>
        <p>• 面试结束后生成详细报告</p>
      </div>
      <button @click="doStartInterview" :disabled="starting" class="btn-primary text-base sm:text-lg px-7 sm:px-10">
        {{ starting ? '面试官准备中...' : '🎤 开始面试' }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="starting" class="game-card text-center py-16">
      <div class="text-6xl mb-4 animate-pulse">🤝</div>
      <p class="text-gray-600">面试官正在路上...</p>
    </div>

    <!-- Active Interview -->
    <template v-if="store.interviewId && !store.isInterviewFinished">
      <!-- Interview Progress -->
      <div class="game-card">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div class="flex items-center gap-3">
            <button
              @click="restartInterview"
              :disabled="starting || submitting || summarizing"
              class="btn-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              重新面试
            </button>
            <span class="text-sm text-gray-500">面试进度</span>
          </div>
          <span class="text-sm font-bold text-gray-700">第 {{ store.interviewRounds.length }} 轮</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-slate-500 h-2 rounded-full transition-all"
            :style="{ width: Math.min(100, store.interviewRounds.length * 10) + '%' }"></div>
        </div>
      </div>

      <!-- Conversation History -->
      <div class="space-y-4 max-h-[60vh] sm:max-h-[50vh] overflow-y-auto pr-1 sm:pr-2" ref="chatContainer">
        <div v-for="(round, i) in store.interviewRounds" :key="i">
          <!-- AI Question -->
          <div class="flex items-start gap-2 sm:gap-3 mb-3">
            <div class="w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 rounded-xl flex items-center justify-center text-base sm:text-lg flex-shrink-0">
              🤖
            </div>
            <div class="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 sm:px-4 py-3 max-w-[calc(100%-44px)] sm:max-w-[80%] shadow-sm">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-1">
                <div class="text-xs text-gray-400">
                  AI 面试官 · {{ categoryLabel(round.category) }}
                </div>
                <button
                  @click="toggleRoundFavorite(round, i)"
                  :disabled="!round.userAnswer"
                  class="text-xs px-2 py-1 rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  :title="round.userAnswer ? '' : '回答后可收藏'"
                  :class="store.isFavorite('level3', favoriteRoundId(round, i))
                    ? 'bg-slate-50 border-gray-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-200 hover:text-slate-600'"
                >
                  {{ store.isFavorite('level3', favoriteRoundId(round, i)) ? '★ 已收藏' : '☆ 收藏' }}
                </button>
              </div>
              <p class="text-gray-800">{{ round.question }}</p>
            </div>
          </div>

          <!-- User Answer + Feedback -->
          <div v-if="round.userAnswer" class="space-y-2 sm:ml-13">
            <div class="flex items-start gap-2 sm:gap-3 justify-end">
              <div class="bg-primary-50 border border-primary-200 rounded-2xl rounded-tr-sm px-3 sm:px-4 py-3 max-w-[calc(100%-44px)] sm:max-w-[80%]">
                <div class="text-xs text-primary-400 mb-1">你的回答</div>
                <p class="text-gray-700">{{ round.userAnswer }}</p>
              </div>
              <div class="w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 rounded-xl flex items-center justify-center text-base sm:text-lg flex-shrink-0">
                👤
              </div>
            </div>

            <!-- AI Feedback -->
            <div v-if="round.feedback && i < store.interviewRounds.length - 1" class="sm:ml-13">
              <div class="bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-sm">
                <span class="text-slate-600 font-medium">📝 评价：</span>
                <span class="text-gray-600">{{ round.feedback }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Current Feedback -->
      <div v-if="currentFeedback" class="bg-slate-50 border border-gray-200 rounded-xl p-3 text-sm">
        <span class="text-slate-600 font-medium">📝 {{ currentFeedback }}</span>
      </div>

      <!-- Answer Input -->
      <div class="game-card">
        <div v-if="currentHint" class="text-xs text-gray-400 mb-2">
          💡 提示：{{ currentHint }}
        </div>
        <div class="flex gap-3">
          <textarea
            v-model="userAnswer"
            @keydown.ctrl.enter="doSubmitAnswer"
            placeholder="在此输入你的回答... (Ctrl+Enter 发送)"
            rows="3"
            class="flex-1 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none resize-none"
          ></textarea>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
          <span class="text-xs text-gray-400">Ctrl + Enter 发送</span>
          <div class="flex gap-2">
            <button @click="doSubmitAnswer"
              :disabled="!userAnswer.trim() || submitting"
              class="btn-primary disabled:opacity-50">
              {{ submitting ? '发送中...' : '📤 回答' }}
            </button>
          </div>
        </div>
      </div>

      <!-- End Interview -->
      <div class="text-center">
        <button @click="getSummary" :disabled="summarizing"
          class="text-sm text-gray-400 hover:text-slate-500 transition-colors">
          {{ summarizing ? '生成中...' : '⏹️ 结束面试并查看报告' }}
        </button>
      </div>
    </template>

    <!-- Interview Summary -->
    <template v-if="store.isInterviewFinished && store.interviewSummary">
      <div class="game-card">
        <h3 class="text-xl font-bold text-gray-900 mb-6 text-center">📋 面试总结报告</h3>

        <!-- Overall Score -->
        <div class="flex items-center justify-center gap-6 mb-8">
          <div class="text-center">
            <div class="text-5xl font-bold text-primary-600">{{ store.interviewSummary.overallScore }}</div>
            <div class="text-sm text-gray-400 mt-1">综合评分</div>
          </div>
        </div>

        <p class="text-gray-600 text-center mb-6">{{ store.interviewSummary.summary }}</p>

        <!-- Strengths & Weaknesses -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div class="bg-slate-50 rounded-xl p-4 border border-gray-200">
            <h4 class="font-bold text-primary-700 mb-2">✅ 优势</h4>
            <ul class="space-y-1">
              <li v-for="s in store.interviewSummary.strengths" :key="s"
                class="text-sm text-slate-700">• {{ s }}</li>
            </ul>
          </div>
          <div class="bg-slate-50 rounded-xl p-4 border border-gray-200">
            <h4 class="font-bold text-primary-700 mb-2">⚠️ 薄弱环节</h4>
            <ul class="space-y-1">
              <li v-for="w in store.interviewSummary.weaknesses" :key="w"
                class="text-sm text-slate-700">• {{ w }}</li>
            </ul>
          </div>
        </div>

        <!-- Dimension Scores -->
        <div class="space-y-3 mb-6">
          <h4 class="font-bold text-gray-800">各维度评分</h4>
          <div v-for="(dim, key) in store.interviewSummary.dimensions" :key="key"
            class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-gray-50 rounded-xl">
            <span class="text-sm font-medium text-gray-700 sm:w-24">{{ dimLabel(key) }}</span>
            <div class="flex-1 bg-gray-200 rounded-full h-2">
              <div class="h-2 rounded-full bg-primary-600" :style="{ width: dim.score + '%' }"></div>
            </div>
            <span class="text-sm font-bold text-gray-800 w-8">{{ dim.score }}</span>
            <span class="text-xs text-gray-400 sm:flex-1">{{ dim.comment }}</span>
          </div>
        </div>

        <!-- Improvement Plan -->
        <div class="mb-4">
          <h4 class="font-bold text-gray-800 mb-2">📈 改进计划</h4>
          <div class="space-y-1">
            <div v-for="(plan, i) in store.interviewSummary.improvementPlan" :key="i"
              class="flex items-center gap-2 text-sm text-gray-600 p-2">
              <span class="text-primary-700 font-bold">{{ i + 1 }}.</span>
              {{ plan }}
            </div>
          </div>
        </div>

        <!-- Resources -->
        <div>
          <h4 class="font-bold text-gray-800 mb-2">📚 推荐学习资源</h4>
          <div class="space-y-1">
            <div v-for="(res, i) in store.interviewSummary.recommendedResources" :key="i"
              class="text-sm text-primary-600 p-1">🔗 {{ res }}</div>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useGameStore } from '../store/game.js'
import { startInterview as apiStartInterview, submitAnswer as apiSubmitAnswer, getInterviewSummary as apiGetSummary } from '../api/index.js'

const store = useGameStore()
const starting = ref(false)
const submitting = ref(false)
const summarizing = ref(false)
const userAnswer = ref('')
const currentFeedback = ref('')
const currentHint = ref('')
const chatContainer = ref(null)

function categoryLabel(cat) {
  return { project: '项目深挖', theory: '基础考察', design: '系统设计', behavior: '行为面试' }[cat] || cat
}

function dimLabel(key) {
  return {
    projectDepth: '项目深度',
    foundation: '基础功底',
    systemDesign: '系统设计',
    communication: '沟通表达',
  }[key] || key
}

function favoriteRoundId(round, index) {
  return `${round.round ?? index}-${round.question}`
}

function toggleRoundFavorite(round, index) {
  if (!round.userAnswer) {
    store.setError('回答后可收藏该面试问题')
    return
  }
  store.toggleFavorite({
    source: 'level3',
    sourceId: favoriteRoundId(round, index),
    question: round.question,
    answer: round.userAnswer,
    category: categoryLabel(round.category),
  })
}

function restartInterview() {
  store.resetInterview()
  userAnswer.value = ''
  currentFeedback.value = ''
  currentHint.value = ''
}

async function doStartInterview() {
  starting.value = true
  try {
    const result = await apiStartInterview(store.jdText, store.resumeText, 'session_' + Date.now())
    if (result.success) {
      store.interviewId = result.interviewId
      store.addInterviewRound({
        round: 0,
        question: result.question,
        userAnswer: '',
        feedback: result.feedback,
        category: result.category,
      })
      currentFeedback.value = result.feedback
      currentHint.value = result.hint
    }
  } catch (err) {
    store.setError('启动面试失败: ' + (err.response?.data?.error || err.message))
  } finally {
    starting.value = false
  }
}

async function doSubmitAnswer() {
  if (!userAnswer.value.trim() || submitting.value) return

  const answer = userAnswer.value.trim()
  submitting.value = true
  currentFeedback.value = ''
  currentHint.value = ''

  // Update current round with answer
  const currentRound = store.interviewRounds[store.interviewRounds.length - 1]
  currentRound.userAnswer = answer

  try {
    const result = await apiSubmitAnswer(store.interviewId, answer)
    if (result.success) {
      if (!result.isFinished) {
        store.addInterviewRound({
          round: store.interviewRounds.length,
          question: result.question,
          userAnswer: '',
          feedback: result.feedback,
          category: result.category,
        })
      }
      currentFeedback.value = result.feedback
      currentHint.value = result.hint || ''
      userAnswer.value = ''

      // Auto-scroll
      await nextTick()
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
      }
    }
  } catch (err) {
    store.setError('提交失败: ' + (err.response?.data?.error || err.message))
  } finally {
    submitting.value = false
  }
}

async function getSummary() {
  if (summarizing.value || !store.interviewId) return
  summarizing.value = true
  try {
    const result = await apiGetSummary(store.interviewId)
    if (result.success) {
      store.setInterviewSummary(result.data)
    }
  } catch (err) {
    store.setError('生成总结失败: ' + (err.response?.data?.error || err.message))
  } finally {
    summarizing.value = false
  }
}

</script>
