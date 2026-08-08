import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGameStore = defineStore('game', () => {
  // ====== Game State ======
  const activeTab = ref('upload') // 'upload' | 'level1' | 'level2' | 'level3' | 'favorites'
  const isLoading = ref(false)
  const error = ref(null)

  // ====== Input Data ======
  const jdText = ref('')
  const resumeText = ref('')
  const resumeFilename = ref('')
  const jobTitle = ref('')

  // ====== Level 1 Data ======
  const level1Data = ref(null) // { jdAnalysis, questions[], stats, searchSources }
  const displayMode = ref('full') // 'full' | 'keywords' | 'hidden'
  const selectedCategory = ref('all') // 'all' | 'project' | 'theory' | 'algorithm'
  const currentPage = ref(1)
  const pageSize = ref(8)

  // ====== Level 2 Data ======
  const level2Data = ref(null) // { overallScore, dimensions, issues, suggestions, questions }

  // ====== Level 3 Data ======
  const interviewId = ref('')
  const interviewRounds = ref([])
  const currentQuestion = ref('')
  const currentFeedback = ref('')
  const interviewSummary = ref(null)
  const isInterviewFinished = ref(false)

  // ====== History (saved to localStorage) ======
  const jobHistory = ref(JSON.parse(localStorage.getItem('jobHistory') || '[]'))

  // ====== Favorites (saved to localStorage) ======
  const favoriteQuestions = ref(JSON.parse(localStorage.getItem('favoriteQuestions') || '[]'))

  // ====== Computed ======
  const filteredQuestions = computed(() => {
    if (!level1Data.value?.questions) return []
    let qs = level1Data.value.questions
    if (selectedCategory.value !== 'all') {
      qs = qs.filter(q => q.category === selectedCategory.value)
    }
    return qs
  })

  const paginatedQuestions = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredQuestions.value.slice(start, start + pageSize.value)
  })

  const totalPages = computed(() => {
    return Math.ceil(filteredQuestions.value.length / pageSize.value)
  })

  const level1Progress = computed(() => {
    if (!level1Data.value) return 0
    const total = level1Data.value.stats?.totalQuestions || 0
    const answered = level1Data.value.questions?.filter(q => q.userReviewed)?.length || 0
    return total > 0 ? Math.round((answered / total) * 100) : 0
  })

  // ====== Actions ======
  function setError(err) {
    error.value = err
    setTimeout(() => { error.value = null }, 5000)
  }

  function setJD(text) {
    jdText.value = text
    // Extract job title
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length > 0) {
      jobTitle.value = lines[0].substring(0, 50)
    }
  }

  function setResume(text, filename) {
    resumeText.value = text
    resumeFilename.value = filename
  }

  function setLevel1Data(data) {
    level1Data.value = data
    currentPage.value = 1
    selectedCategory.value = 'all'
  }

  function setLevel2Data(data) {
    level2Data.value = data
  }

  function addInterviewRound(round) {
    interviewRounds.value.push(round)
  }

  function setInterviewSummary(data) {
    interviewSummary.value = data
    isInterviewFinished.value = true
  }

  function switchTab(tab) {
    activeTab.value = tab
    error.value = null
  }

  function favoriteKey(source, sourceId) {
    return `${source}:${sourceId}`
  }

  function persistFavorites() {
    localStorage.setItem('favoriteQuestions', JSON.stringify(favoriteQuestions.value))
  }

  function isFavorite(source, sourceId) {
    const key = favoriteKey(source, sourceId)
    return favoriteQuestions.value.some(item => item.key === key)
  }

  function addFavorite(payload) {
    const key = favoriteKey(payload.source, payload.sourceId)
    if (favoriteQuestions.value.some(item => item.key === key)) return
    favoriteQuestions.value.unshift({
      id: `${key}:${Date.now()}`,
      key,
      source: payload.source,
      sourceId: payload.sourceId,
      question: payload.question || '',
      answer: payload.answer || '',
      category: payload.category || '',
      createdAt: new Date().toISOString(),
    })
    persistFavorites()
  }

  function removeFavorite(source, sourceId) {
    const key = favoriteKey(source, sourceId)
    favoriteQuestions.value = favoriteQuestions.value.filter(item => item.key !== key)
    persistFavorites()
  }

  function toggleFavorite(payload) {
    if (isFavorite(payload.source, payload.sourceId)) {
      removeFavorite(payload.source, payload.sourceId)
    } else {
      addFavorite(payload)
    }
  }

  function deleteFavorites(ids) {
    const idSet = new Set(ids)
    favoriteQuestions.value = favoriteQuestions.value.filter(item => !idSet.has(item.id))
    persistFavorites()
  }

  function saveToHistory() {
    if (!jobTitle.value || !level1Data.value) return
    const existing = jobHistory.value.findIndex(h => h.title === jobTitle.value)
    const entry = {
      title: jobTitle.value,
      jdText: jdText.value,
      resumeText: resumeText.value,
      resumeFilename: resumeFilename.value,
      level1Data: level1Data.value,
      level2Data: level2Data.value,
      displayMode: displayMode.value,
      selectedCategory: selectedCategory.value,
      currentPage: currentPage.value,
      savedAt: new Date().toISOString(),
    }
    if (existing >= 0) {
      jobHistory.value[existing] = entry
    } else {
      jobHistory.value.unshift(entry)
    }
    // Keep max 20 entries
    if (jobHistory.value.length > 20) {
      jobHistory.value = jobHistory.value.slice(0, 20)
    }
    localStorage.setItem('jobHistory', JSON.stringify(jobHistory.value))
  }

  function loadFromHistory(entry) {
    jdText.value = entry.jdText
    resumeText.value = entry.resumeText
    resumeFilename.value = entry.resumeFilename
    jobTitle.value = entry.title
    level1Data.value = entry.level1Data
    level2Data.value = entry.level2Data
    displayMode.value = entry.displayMode || 'full'
    selectedCategory.value = entry.selectedCategory || 'all'
    currentPage.value = entry.currentPage || 1
    activeTab.value = 'level1'
  }

  function deleteHistory(title) {
    jobHistory.value = jobHistory.value.filter(h => h.title !== title)
    localStorage.setItem('jobHistory', JSON.stringify(jobHistory.value))
  }

  function resetGame() {
    activeTab.value = 'upload'
    jdText.value = ''
    resumeText.value = ''
    resumeFilename.value = ''
    jobTitle.value = ''
    level1Data.value = null
    level2Data.value = null
    interviewId.value = ''
    interviewRounds.value = []
    currentQuestion.value = ''
    currentFeedback.value = ''
    interviewSummary.value = null
    isInterviewFinished.value = false
    selectedCategory.value = 'all'
    currentPage.value = 1
    displayMode.value = 'full'
  }

  return {
    // State
    activeTab, isLoading, error,
    jdText, resumeText, resumeFilename, jobTitle,
    level1Data, displayMode, selectedCategory, currentPage, pageSize,
    level2Data,
    interviewId, interviewRounds, currentQuestion, currentFeedback,
    interviewSummary, isInterviewFinished,
    jobHistory, favoriteQuestions,
    // Computed
    filteredQuestions, paginatedQuestions, totalPages, level1Progress,
    // Actions
    setError, setJD, setResume,
    setLevel1Data, setLevel2Data,
    addInterviewRound, setInterviewSummary,
    switchTab, saveToHistory, loadFromHistory, deleteHistory, resetGame,
    isFavorite, addFavorite, removeFavorite, toggleFavorite, deleteFavorites,
  }
})
