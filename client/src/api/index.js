import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 minutes for AI calls
})

/**
 * Upload JD text
 */
export async function uploadJD(jdText) {
  const { data } = await api.post('/upload/jd', { jdText })
  return data
}

/**
 * Upload resume file (PDF/Word)
 */
export async function uploadResume(file) {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/upload/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/**
 * Level 1: Search interview questions
 */
export async function searchQuestions(jdText, sessionId) {
  const { data } = await api.post('/level1/search', { jdText, sessionId })
  return data
}

/**
 * Level 2: Analyze resume and generate personalized questions
 */
export async function analyzeResume(jdText, resumeText, level1Questions) {
  const { data } = await api.post('/level2/analyze', { jdText, resumeText, level1Questions })
  return data
}

/**
 * Level 3: Start mock interview
 */
export async function startInterview(jdText, resumeText, sessionId) {
  const { data } = await api.post('/level3/start', { jdText, resumeText, sessionId })
  return data
}

/**
 * Level 3: Submit answer
 */
export async function submitAnswer(interviewId, answer) {
  const { data } = await api.post('/level3/answer', { interviewId, answer })
  return data
}

/**
 * Level 3: Get interview summary
 */
export async function getInterviewSummary(interviewId) {
  const { data } = await api.post('/level3/summary', { interviewId })
  return data
}

/**
 * Health check
 */
export async function healthCheck() {
  const { data } = await api.get('/health')
  return data
}

export default api
