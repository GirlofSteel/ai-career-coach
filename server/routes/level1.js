import { Router } from 'express';
import { chatJSON } from '../services/deepseek.js';
import { searchInterview } from '../services/tavily.js';

const router = Router();

const SYSTEM_PROMPT_LEVEL1 = `你是一位资深的面试辅导专家。用户会提供一份岗位JD，以及我们搜索到的面试经验资料。
你需要做以下工作：

1. **分析岗位JD**：提取关键技能要求、技术栈、岗位职责
2. **整合面经**：结合搜索到的面经资料，整理出该岗位常见的面试题目
3. **分类整理**：将题目分为三大类：
   - "project"（个人项目）: 项目深挖、架构设计、难点解决等
   - "theory"（八股文）: 计算机基础理论、框架原理、语言特性等
   - "algorithm"（手撕算法）: 算法题、数据结构题、代码实现
4. **标注频率**：根据面经中出现的次数，用1-5星标注提问频率
5. **标注来源**：每道题附带来源URL和时间

请严格按照以下JSON格式输出，不要添加任何解释文字：
{
  "jdAnalysis": {
    "company": "公司名称",
    "position": "岗位名称",
    "keySkills": ["技能1", "技能2"],
    "techStack": ["技术1", "技术2"],
    "responsibilities": ["职责1", "职责2"]
  },
  "questions": [
    {
      "id": 1,
      "category": "project",
      "question": "题目内容",
      "answer": "详细答案",
      "keywords": ["关键词1", "关键词2"],
      "frequency": 5,
      "source": "来源网站名",
      "sourceUrl": "https://...",
      "sourceDate": "2025-06-15"
    }
  ],
  "stats": {
    "totalQuestions": 20,
    "projectCount": 5,
    "theoryCount": 10,
    "algorithmCount": 5
  }
}`;

/**
 * POST /api/level1/search
 * Search and generate interview questions based on JD
 */
router.post('/search', async (req, res) => {
  try {
    const { jdText, sessionId } = req.body;

    if (!jdText) {
      return res.status(400).json({ error: '请提供岗位JD' });
    }

    // Step 1: Extract company and position from JD using AI
    const extractPrompt = `从以下JD中提取公司名称和岗位名称，以JSON格式输出：{"company": "公司名", "position": "岗位名"}`;
    let companyInfo;
    try {
      companyInfo = await chatJSON(extractPrompt, jdText);
    } catch {
      companyInfo = { company: '未知公司', position: '技术岗位' };
    }

    // Step 2: Search interview experiences via Tavily
    const searchQuery = `${companyInfo.company} ${companyInfo.position}`;
    let searchResults;
    try {
      searchResults = await searchInterview(searchQuery, {
        deep: true,
        maxResults: 10,
      });
    } catch {
      searchResults = [];
    }

    // Step 3: Generate structured questions with AI
    const searchContext = searchResults
      .map((r, i) => `[来源${i + 1}] ${r.title}\nURL: ${r.url}\n日期: ${r.publishedDate}\n内容: ${r.content}`)
      .join('\n\n---\n\n');

    const userPrompt = `岗位JD：
${jdText}

搜索到的面试经验资料：
${searchContext || '（未搜索到相关面经资料，请根据你的知识库补充常见面试题）'}

请根据以上信息，整理出该岗位的面试题目，分类并标注频率和来源。`;

    const result = await chatJSON(SYSTEM_PROMPT_LEVEL1, userPrompt);

    // Add search sources metadata
    result.searchSources = searchResults.map(r => ({
      title: r.title,
      url: r.url,
      date: r.publishedDate,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Level 1 Error:', error);
    res.status(500).json({ error: `面试题目生成失败: ${error.message}` });
  }
});

export default router;
