<template>
  <div class="max-w-3xl mx-auto space-y-6 sm:space-y-8 py-4 sm:py-8">
    <!-- Welcome -->
    <!-- <div class="text-center space-y-3">
      <div class="text-6xl">🎯</div>
      <h2 class="text-3xl font-bold text-gray-900">欢迎使用 AI 求职助手</h2>
      <p class="text-gray-500 text-lg">
        三关闯关模式，帮你从面经复习到模拟面试，全方位备战目标岗位
      </p>
    </div> -->

    <!-- Game Flow Preview -->
    <!-- <div class="game-card">
      <div class="flex items-center justify-between gap-4">
        <div v-for="(step, i) in steps" :key="i" class="flex-1 text-center">
          <div class="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-2xl"
            :class="i === 0 ? 'bg-indigo-100' : i === 1 ? 'bg-cyan-100' : 'bg-red-100'">
            {{ step.emoji }}
          </div>
          <div class="mt-2 font-semibold text-sm text-gray-700">{{ step.title }}</div>
          <div class="text-xs text-gray-400 mt-1">{{ step.desc }}</div>
        </div>
        <div v-for="i in 2" :key="'arrow'+i" class="text-gray-300 text-2xl">→</div>
      </div>
    </div> -->

    <!-- Step 1: Upload JD -->
    <div class="game-card">
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <span class="w-8 h-8 bg-slate-100 text-primary-700 rounded-lg flex items-center justify-center font-bold text-sm">
          1
        </span>
        <h3 class="text-lg font-bold text-gray-900">输入岗位 JD（职位描述）</h3>
        <span class="badge bg-slate-50 text-slate-600">必填</span>
      </div>
      <p class="text-sm text-gray-500 mb-4">
        请粘贴目标岗位的完整 JD 文字内容，包含岗位名称、公司、技能要求、工作职责等
      </p>
      <textarea
        v-model="jdInput"
        placeholder="示例：&#10;字节跳动 - 后端开发工程师&#10;&#10;岗位职责：&#10;1. 负责公司核心业务系统的后端开发与维护&#10;2. 参与系统架构设计，保证系统的高可用性和可扩展性&#10;...&#10;&#10;任职要求：&#10;1. 熟练掌握 Java/Go 其中一门语言&#10;2. 熟悉 MySQL、Redis、消息队列等中间件&#10;..."
        rows="8"
        class="w-full border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none resize-none"
        :class="{ 'border-slate-400': jdError }"
      ></textarea>
      <p v-if="jdError" class="text-slate-500 text-sm mt-1">{{ jdError }}</p>
    </div>

    <!-- Step 2: Upload Resume -->
    <div class="game-card">
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <span class="w-8 h-8 bg-slate-100 text-primary-700 rounded-lg flex items-center justify-center font-bold text-sm">
          2
        </span>
        <h3 class="text-lg font-bold text-gray-900">上传个人简历</h3>
        <span class="badge bg-slate-50 text-slate-600">推荐</span>
      </div>
      <p class="text-sm text-gray-500 mb-4">
        支持 PDF 或 Word 格式，上传后将自动解析文字内容
      </p>

      <!-- Drop Zone -->
      <div
        @click="triggerUpload"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        class="border-2 border-dashed rounded-xl p-5 sm:p-8 text-center cursor-pointer transition-all"
        :class="isDragging ? 'border-gray-200 bg-primary-50' : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'"
      >
        <input ref="fileInput" type="file" accept=".pdf,.doc,.docx" @change="handleFile" class="hidden" />

        <template v-if="!resumeFilename && !uploading">
          <div class="text-4xl mb-3">📄</div>
          <p class="text-gray-600 font-medium">点击上传或拖拽文件到此处</p>
          <p class="text-xs text-gray-400 mt-1">支持 PDF、Word (.docx/.doc) 格式，最大 10MB</p>
        </template>

        <template v-else-if="uploading">
          <div class="text-4xl mb-3 animate-bounce">⏳</div>
          <p class="text-gray-600">正在解析简历...</p>
        </template>

        <template v-else>
          <div class="text-4xl mb-3">✅</div>
          <p class="text-primary-600 font-medium">{{ resumeFilename }}</p>
          <p class="text-xs text-gray-400 mt-1">已解析 {{ resumeCharCount }} 个字符</p>
          <button @click.stop="clearResume" class="text-xs text-slate-500 hover:underline mt-2">重新上传</button>
        </template>
      </div>
    </div>

    <!-- Start Button -->
    <div class="text-center">
      <button
        @click="startGame"
        :disabled="!canStart"
        class="btn-primary w-full sm:w-auto text-base sm:text-lg px-7 sm:px-12 py-4"
      >
        确认
      </button>
      <p v-if="!jdInput.trim()" class="text-sm text-gray-400 mt-2">
        请先输入岗位 JD 再开始
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useGameStore } from '../store/game.js'
import { uploadResume, uploadJD } from '../api/index.js'

const store = useGameStore()
const emit = defineEmits(['start'])

const jdInput = ref(store.jdText)
const jdError = ref('')
const resumeFilename = ref(store.resumeFilename)
const resumeCharCount = ref(store.resumeText.length)
const uploading = ref(false)
const isDragging = ref(false)
const fileInput = ref(null)

const canStart = computed(() => jdInput.value.trim().length >= 10)

watch(jdInput, (value) => {
  if (value !== store.jdText) {
    store.setJD(value)
  }
})

watch(() => store.jdText, (value) => {
  if (value !== jdInput.value) {
    jdInput.value = value
  }
})

watch(() => store.resumeFilename, (value) => {
  resumeFilename.value = value
})

watch(() => store.resumeText, (value) => {
  resumeCharCount.value = value.length
})

function triggerUpload() {
  fileInput.value?.click()
}

function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

function handleFile(e) {
  const file = e.target?.files?.[0]
  if (file) processFile(file)
}

async function processFile(file) {
  const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
  if (!allowed.includes(file.type)) {
    jdError.value = '仅支持 PDF 和 Word 文件'
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    jdError.value = '文件大小不能超过 10MB'
    return
  }

  uploading.value = true
  jdError.value = ''
  try {
    const result = await uploadResume(file)
    store.setResume(result.text, result.filename)
    resumeFilename.value = result.filename
    resumeCharCount.value = result.wordCount
  } catch (err) {
    jdError.value = err.response?.data?.error || '文件上传失败'
  } finally {
    uploading.value = false
  }
}

function clearResume() {
  store.setResume('', '')
  resumeFilename.value = ''
  resumeCharCount.value = 0
}

async function startGame() {
  if (!canStart.value) return
  jdError.value = ''
  store.isLoading = true
  try {
    await uploadJD(jdInput.value)
    store.setJD(jdInput.value)
    store.activeTab = 'level1'
  } catch (err) {
    store.setError('启动失败: ' + (err.response?.data?.error || err.message))
  } finally {
    store.isLoading = false
  }
}
</script>
