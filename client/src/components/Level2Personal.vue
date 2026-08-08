<template>
  <div class="space-y-6">
    <!-- Trigger analysis -->
    <div v-if="!store.level2Data && !analyzing" class="game-card text-center py-12">
      <div class="text-6xl mb-4">🔍</div>
      <h3 class="text-xl font-bold mb-2">个性化分析</h3>
      <p class="text-gray-500 mb-2">
        AI 将对比你的简历和岗位 JD，分析匹配度
      </p>
      <p class="text-sm text-gray-400 mb-6">
        {{ store.resumeText ? '✅ 已上传简历: ' + store.resumeFilename : '⚠️ 尚未上传简历，分析将仅基于 JD' }}
      </p>
      <button @click="startAnalysis" :disabled="analyzing" class="btn-primary text-base sm:text-lg px-7 sm:px-10">
        {{ analyzing ? '分析中...' : '🔬 开始分析' }}
      </button>
      <button @click="store.activeTab = 'upload'" class="block mx-auto mt-3 text-sm text-gray-400 hover:text-primary-700">
        📤 返回上传简历
      </button>
    </div>

    <!-- Loading -->
    <div v-if="analyzing" class="game-card text-center py-16">
      <div class="text-6xl mb-4 animate-bounce">🤔</div>
      <h3 class="text-xl font-bold text-gray-700">AI 正在深入分析您的简历...</h3>
      <p class="text-gray-400 text-sm mt-2">这可能需要 30 秒左右</p>
      <div class="mt-6 w-64 mx-auto bg-gray-200 rounded-full h-2 overflow-hidden">
        <div class="bg-primary-600 h-full rounded-full animate-pulse w-3/4"></div>
      </div>
    </div>

    <template v-if="store.level2Data">
      <!-- Match Score Card -->
      <div class="game-card">
        <h3 class="text-lg font-bold text-gray-900 mb-4">📊 匹配度评估</h3>

        <!-- Overall Score -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
          <div class="relative w-28 h-28 flex-shrink-0">
            <svg class="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="48" fill="none" stroke="#e5e7eb" stroke-width="10"/>
              <circle cx="56" cy="56" r="48" fill="none" :stroke="scoreColor"
                stroke-width="10" stroke-linecap="round"
                :stroke-dasharray="2 * Math.PI * 48"
                :stroke-dashoffset="2 * Math.PI * 48 * (1 - store.level2Data.overallScore / 100)"/>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <span class="text-3xl font-bold" :class="scoreTextColor">{{ store.level2Data.overallScore }}</span>
                <span class="text-sm text-gray-400">%</span>
              </div>
            </div>
          </div>
          <div class="text-sm text-gray-600 leading-relaxed">
            {{ store.level2Data.analysis }}
          </div>
        </div>

        <!-- Dimension Scores -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div v-for="(dim, key) in store.level2Data.dimensions" :key="key"
            class="bg-gray-50 rounded-xl p-3">
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs text-gray-600">{{ dimensionLabel(key) }}</span>
              <span class="text-sm font-bold" :class="dimScoreColor(dim)">{{ dim }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-1.5">
              <div class="h-1.5 rounded-full transition-all duration-1000"
                :class="dimBarColor(dim)"
                :style="{ width: dim + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Resume Issues -->
      <div class="game-card">
        <h3 class="text-lg font-bold text-gray-900 mb-3">⚠️ 简历问题诊断</h3>
        <div class="space-y-2">
          <div v-for="(issue, i) in store.level2Data.issues" :key="i"
            class="flex items-start gap-3 p-3 rounded-lg"
            :class="issueSeverityBg(issue.severity)">
            <span class="text-lg flex-shrink-0">{{ issueSeverityIcon(issue.severity) }}</span>
            <div>
              <div class="font-medium text-sm text-gray-800">{{ issue.title }}</div>
              <div class="text-xs text-gray-500 mt-0.5">{{ issue.detail }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Improvement Suggestions -->
      <div class="game-card">
        <h3 class="text-lg font-bold text-gray-900 mb-3">💡 改进建议</h3>
        <div class="space-y-3">
          <div v-for="(sug, i) in store.level2Data.suggestions" :key="i"
            class="border border-gray-100 rounded-xl p-4 hover:border-primary-200 transition-colors">
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <span class="badge bg-primary-50 text-primary-700">{{ sug.area }}</span>
              <span class="text-xs text-gray-400">{{ sug.currentProblem }}</span>
            </div>
            <p class="text-sm text-gray-700">{{ sug.suggestion }}</p>
            <div v-if="sug.example" class="mt-2 bg-slate-50 text-primary-700 text-xs p-2 rounded-lg">
              💬 示例: {{ sug.example }}
            </div>
          </div>
        </div>
      </div>

      <!-- Personalized Questions -->
      <div class="game-card">
        <h3 class="text-lg font-bold text-gray-900 mb-4">🎯 个性化提问 (基于你的简历)</h3>
        <div class="space-y-4">
          <div v-for="q in store.level2Data.questions" :key="q.id"
            class="border-l-4 border-gray-200 pl-4 py-2">
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-1">
              <div class="flex flex-wrap items-center gap-2 min-w-0">
                <span class="badge flex-shrink-0" :class="categoryBadge(q.category)">{{ categoryLabel(q.category) }}</span>
                <span class="text-xs text-gray-400 truncate">关联: {{ q.context }}</span>
              </div>
              <button
                @click="toggleQuestionFavorite(q)"
                class="text-xs px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0"
                :class="store.isFavorite('level2', favoriteQuestionId(q))
                  ? 'bg-slate-50 border-gray-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-200 hover:text-slate-600'"
              >
                {{ store.isFavorite('level2', favoriteQuestionId(q)) ? '★ 已收藏' : '☆ 收藏' }}
              </button>
            </div>
            <p class="text-gray-800 font-medium">{{ q.question }}</p>
            <details class="mt-2">
              <summary class="text-sm text-primary-600 cursor-pointer hover:underline">
                💭 查看回答思路
              </summary>
              <div class="mt-2 bg-slate-50 rounded-lg p-3 text-sm">
                <p class="text-gray-700">{{ q.answerHint }}</p>
                <div class="flex flex-wrap gap-1 mt-2">
                  <span v-for="kp in q.keyPoints" :key="kp"
                    class="text-xs bg-white text-slate-700 px-2 py-0.5 rounded border border-gray-200">
                    {{ kp }}
                  </span>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
        <button @click="store.activeTab = 'level1'" class="btn-outline">
          ◀️ 返回基础知识排查
        </button>
        <button @click="store.activeTab = 'level3'" class="btn-primary text-base sm:text-lg px-7 sm:px-10">
          🎮 进入第三关：模拟面试
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../store/game.js'
import { analyzeResume } from '../api/index.js'

const store = useGameStore()
const analyzing = ref(false)

const scoreColor = computed(() => {
  const s = store.level2Data?.overallScore || 0
  if (s >= 80) return '#22c55e'
  if (s >= 60) return '#f59e0b'
  return '#ef4444'
})

const scoreTextColor = computed(() => {
  const s = store.level2Data?.overallScore || 0
  if (s >= 80) return 'text-primary-600'
  if (s >= 60) return 'text-slate-600'
  return 'text-slate-600'
})

function dimensionLabel(key) {
  const labels = {
    skillMatch: '技能匹配',
    experienceMatch: '经验匹配',
    educationMatch: '学历匹配',
    projectMatch: '项目匹配',
  }
  return labels[key] || key
}

function dimScoreColor(dim) {
  if (dim >= 80) return 'text-primary-600'
  if (dim >= 60) return 'text-slate-600'
  return 'text-slate-600'
}

function dimBarColor(dim) {
  if (dim >= 80) return 'bg-slate-500'
  if (dim >= 60) return 'bg-slate-500'
  return 'bg-slate-500'
}

function issueSeverityBg(severity) {
  return severity === 'high' ? 'bg-slate-50' : severity === 'medium' ? 'bg-slate-50' : 'bg-slate-50'
}

function issueSeverityIcon(severity) {
  return severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : '🔵'
}

function categoryBadge(cat) {
  return cat === 'project' ? 'badge-project' : cat === 'skill' ? 'badge-theory' : 'badge-algorithm'
}

function categoryLabel(cat) {
  return cat === 'project' ? '项目深挖' : cat === 'skill' ? '技能考察' : '行为面试'
}

function favoriteQuestionId(q) {
  return `${q.id}-${q.question}`
}

function toggleQuestionFavorite(q) {
  const keyPoints = q.keyPoints?.length ? `\n\n关键点：${q.keyPoints.join('、')}` : ''
  store.toggleFavorite({
    source: 'level2',
    sourceId: favoriteQuestionId(q),
    question: q.question,
    answer: `${q.answerHint || '暂无回答思路'}${keyPoints}`,
    category: categoryLabel(q.category),
  })
}

async function startAnalysis() {
  analyzing.value = true
  try {
    const level1Questions = store.level1Data?.questions || []
    const result = await analyzeResume(store.jdText, store.resumeText, level1Questions)
    if (result.success) {
      store.setLevel2Data(result.data)
      store.saveToHistory()
    }
  } catch (err) {
    store.setError('分析失败: ' + (err.response?.data?.error || err.message))
  } finally {
    analyzing.value = false
  }
}
</script>
