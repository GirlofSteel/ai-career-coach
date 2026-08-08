import { Router } from 'express';
import { chatJSON } from '../services/deepseek.js';

const router = Router();

const SYSTEM_PROMPT_LEVEL2 = `你是一位资深的职业规划师和面试辅导专家。用户会提供：
1. 岗位JD
2. 个人简历内容
3. 该岗位相关的面经题目（来自第一关）

请完成以下分析：

1. **匹配度评估**：
   - overallScore: 整体匹配度百分比（0-100）
   - dimensions: 分维度评分，包括：
     - skillMatch: 技能匹配度（0-100）
     - experienceMatch: 经验匹配度（0-100）
     - educationMatch: 学历匹配度（0-100）
     - projectMatch: 项目匹配度（0-100）
   - analysis: 匹配度分析文字（100字以内）

2. **简历问题诊断**：
   - issues: 数组，每条包含 {title: 问题标题, detail: 具体描述, severity: "high"/"medium"/"low"}

3. **改进建议**：
   - suggestions: 数组，每条包含 {area: 改进方向, currentProblem: 现有问题, suggestion: 具体建议, example: 示例（可选）}

4. **个性化提问**（针对简历中的个人项目和技能）：
   - questions: 数组，每条包含 {
       id: 序号,
       category: "project"/"skill"/"behavior",
       question: 面试问题,
       context: 为什么问这个问题（关联简历哪部分）,
       answerHint: 回答思路（不是标准答案，而是思考框架）,
       keyPoints: ["要点1", "要点2"]
     }

请严格按照JSON格式输出，不要添加其他内容。`;

/**
 * POST /api/level2/analyze
 * Analyze resume against JD and generate personalized questions
 */
router.post('/analyze', async (req, res) => {
  try {
    const { jdText, resumeText, level1Questions } = req.body;

    if (!jdText || !resumeText) {
      return res.status(400).json({ error: '请提供岗位JD和个人简历' });
    }

    // Build level1 context (just the question titles to keep context manageable)
    const questionContext = level1Questions
      ? level1Questions.slice(0, 10).map(q => `- [${q.category}] ${q.question}`).join('\n')
      : '无';

    const userPrompt = `## 岗位JD：
${jdText}

## 个人简历：
${resumeText}

## 该岗位常见面试题（来自面经）：
${questionContext}

请对候选人进行全面分析，输出匹配度、简历问题、改进建议和个性化提问。`;

    const result = await chatJSON(SYSTEM_PROMPT_LEVEL2, userPrompt);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Level 2 Error:', error);
    res.status(500).json({ error: `简历分析失败: ${error.message}` });
  }
});

export default router;
