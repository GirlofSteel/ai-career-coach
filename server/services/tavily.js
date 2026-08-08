/**
 * Tavily Search API service
 * Documentation: https://docs.tavily.com/
 */

const TAVILY_API_URL = 'https://api.tavily.com/search';

/**
 * Search interview experiences via Tavily
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Search results
 */
export async function searchInterview(query, options = {}) {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey || apiKey === 'your_tavily_api_key_here') {
    console.warn('Tavily API key not configured, using mock data');
    return getMockResults(query);
  }

  try {
    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: `${query} 面试 面经`,
        search_depth: options.deep ? 'advanced' : 'basic',
        max_results: options.maxResults || 10,
        include_domains: options.includeDomains || [],
        exclude_domains: options.excludeDomains || [],
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.results || []).map(r => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
      publishedDate: r.published_date || '未知',
    }));
  } catch (error) {
    console.error('Tavily Search Error:', error.message);
    return getMockResults(query);
  }
}

/**
 * Mock search results for development without API key
 */
function getMockResults(query) {
  const company = query.match(/(\S+)/)?.[1] || '某公司';
  return [
    {
      title: `${company}后端开发工程师面经 - 牛客网`,
      url: `https://www.nowcoder.com/discuss/example1`,
      content: `${company}后端面试经验分享，包含项目经验和算法题...`,
      score: 0.95,
      publishedDate: '2025-06-15',
    },
    {
      title: `${company}技术岗面试真题汇总 - 力扣`,
      url: `https://leetcode.cn/circle/discuss/example2`,
      content: `涵盖数据结构与算法、操作系统、计算机网络等基础问题...`,
      score: 0.88,
      publishedDate: '2025-05-20',
    },
    {
      title: `2025年${company}面试总结 - 掘金`,
      url: `https://juejin.cn/post/example3`,
      content: `详细记录面试流程：技术面、主管面、HR面...`,
      score: 0.82,
      publishedDate: '2025-04-10',
    },
    {
      title: `${company}校招面试经验 - CSDN`,
      url: `https://blog.csdn.net/example4`,
      content: `面试中遇到的算法题和数据库问题汇总...`,
      score: 0.78,
      publishedDate: '2025-03-22',
    },
  ];
}

export default { searchInterview };
