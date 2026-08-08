import { Router } from 'express';
import { chat, chatJSON } from '../services/deepseek.js';

const router = Router();

// Store active interviews in memory (in production, use Redis or DB)
const activeInterviews = new Map();

const SYSTEM_PROMPT_INTERVIEWER = `你是一位专业且严厉的技术面试官。你正在面试一位候选人。

面试规则：
1. 根据候选人的简历和岗位JD，逐步深入提问
2. 每次用户回答后，你需要：
   - 简短评价回答质量（1-2句话，指出亮点和不足）
   - 基于回答内容，提出1个延伸追问 或 切换到新话题
3. 提问维度轮流覆盖：项目深挖 → 技术基础 → 系统设计 → 行为面试
4. 追问时保持自然对话感，不要机械切换
5. 如果回答太差，可以提示方向后再给一次机会
6. 回答格式要求（严格遵守JSON）：
{
  "feedback": "对上一轮回答的评价（简短）",
  "nextQuestion": "下一个问题",
  "category": "project|theory|design|behavior",
  "hint": "如果候选人卡住，给的提示（可选）"
}

开始面试时，请先简要介绍面试流程（2句话），然后提出第一个问题。第一个问题从候选人的项目经历开始。`;

const SYSTEM_PROMPT_SUMMARY = `请根据以下面试记录，生成面试总结报告。JSON格式：
{
  "overallScore": 75,
  "summary": "整体评价（150字以内）",
  "strengths": ["优点1", "优点2"],
  "weaknesses": ["薄弱环节1", "薄弱环节2"],
  "dimensions": {
    "projectDepth": {"score": 70, "comment": "项目理解深度评价"},
    "foundation": {"score": 75, "comment": "基础功底评价"},
    "systemDesign": {"score": 65, "comment": "系统设计能力评价"},
    "communication": {"score": 80, "comment": "沟通表达评价"}
  },
  "improvementPlan": ["改进建议1", "改进建议2", "改进建议3"],
  "recommendedResources": ["推荐学习资源1", "推荐学习资源2"]
}`;

/**
 * POST /api/level3/start
 * Start a new mock interview session
 */
router.post('/start', async (req, res) => {
  try {
    const { jdText, resumeText, sessionId } = req.body;

    if (!resumeText) {
      return res.status(400).json({ error: '请提供个人简历' });
    }

    const interviewId = `interview_${Date.now()}`;

    const startPrompt = `## 岗位JD：
${jdText || '未提供'}

## 候选人简历：
${resumeText}

请作为面试官，开始面试。先简短介绍面试流程，然后提出第一个问题（从候选人项目经历开始）。严格按JSON格式回复。`;

    const response = await chat([
      { role: 'system', content: SYSTEM_PROMPT_INTERVIEWER },
      { role: 'user', content: startPrompt },
    ], { temperature: 0.8 });

    // Parse the initial question
    let interviewData;
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                        response.match(/\{[\s\S]*\}/);
      interviewData = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response);
    } catch {
      interviewData = {
        feedback: '面试即将开始',
        nextQuestion: response,
        category: 'project',
      };
    }

    // Store interview state
    const rounds = [{
      round: 0,
      question: interviewData.nextQuestion,
      userAnswer: '',
      feedback: interviewData.feedback,
      category: interviewData.category,
    }];

    const state = {
      interviewId,
      jdText,
      resumeText,
      rounds,
      currentRound: 0,
      createdAt: new Date().toISOString(),
    };

    activeInterviews.set(interviewId, state);

    res.json({
      success: true,
      interviewId,
      feedback: interviewData.feedback,
      question: interviewData.nextQuestion,
      category: interviewData.category,
      hint: interviewData.hint || '',
    });
  } catch (error) {
    console.error('Level 3 Start Error:', error);
    res.status(500).json({ error: `面试启动失败: ${error.message}` });
  }
});

/**
 * POST /api/level3/answer
 * Submit an answer and get AI response
 */
router.post('/answer', async (req, res) => {
  try {
    const { interviewId, answer } = req.body;

    if (!interviewId || !answer) {
      return res.status(400).json({ error: '请提供面试ID和回答内容' });
    }

    const state = activeInterviews.get(interviewId);
    if (!state) {
      return res.status(404).json({ error: '面试会话不存在或已过期' });
    }

    // Update current round with user answer
    const currentRound = state.rounds[state.currentRound];
    currentRound.userAnswer = answer;

    // Build conversation history
    const history = state.rounds.map(r =>
      `面试官：${r.question}\n候选人：${r.userAnswer || '(未回答)'}\n评价：${r.feedback || ''}`
    ).join('\n\n');

    const userPrompt = `## 面试历史：
${history}

## 候选人刚才的回答（第${state.currentRound + 1}轮）：
${answer}

请作为面试官：评价这个回答，然后提出下一个问题（追问或切换话题）。
如果已经问了8轮以上，可以选择结束面试并提出"让我们总结一下这次面试"。
严格按JSON格式回复。`;

    const response = await chat([
      { role: 'system', content: SYSTEM_PROMPT_INTERVIEWER },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.8 });

    let interviewData;
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                        response.match(/\{[\s\S]*\}/);
      interviewData = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response);
    } catch {
      interviewData = {
        feedback: '收到你的回答',
        nextQuestion: response,
        category: currentRound.category,
      };
    }

    // Add new round
    const newRound = {
      round: state.currentRound + 1,
      question: interviewData.nextQuestion,
      userAnswer: '',
      feedback: interviewData.feedback,
      category: interviewData.category,
    };
    state.rounds.push(newRound);
    state.currentRound += 1;

    res.json({
      success: true,
      feedback: interviewData.feedback,
      question: interviewData.nextQuestion,
      category: interviewData.category,
      hint: interviewData.hint || '',
      round: state.currentRound,
      isFinished: state.currentRound >= 10, // Auto-finish after 10 rounds
    });
  } catch (error) {
    console.error('Level 3 Answer Error:', error);
    res.status(500).json({ error: `处理回答失败: ${error.message}` });
  }
});

/**
 * POST /api/level3/summary
 * Generate interview summary
 */
router.post('/summary', async (req, res) => {
  try {
    const { interviewId } = req.body;

    const state = activeInterviews.get(interviewId);
    if (!state) {
      return res.status(404).json({ error: '面试会话不存在或已过期' });
    }

    const history = state.rounds
      .filter(r => r.userAnswer)
      .map(r => `[${r.category}] 问：${r.question}\n答：${r.userAnswer}\n评：${r.feedback || ''}`)
      .join('\n\n---\n\n');

    const userPrompt = `## 岗位JD：
${state.jdText || '未提供'}

## 候选人简历：
${state.resumeText}

## 面试记录：
${history}

请生成面试总结报告。`;

    const summary = await chatJSON(SYSTEM_PROMPT_SUMMARY, userPrompt);

    // Clean up interview state
    activeInterviews.delete(interviewId);

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Level 3 Summary Error:', error);
    res.status(500).json({ error: `生成总结失败: ${error.message}` });
  }
});

export default router;
