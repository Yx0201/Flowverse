/**
 * 解析AI回复内容，区分思考内容和正式回答内容
 * @param content AI回复的完整内容
 * @returns 包含思考内容和正式回答的对象
 */
export interface ParsedContent {
  think: string;
  val: string;
}

export function parseAIContent(content: string): ParsedContent {
  // 查找思考过程标记
  const thinkProcessIndex = content.indexOf('**思考过程：**');

  if (thinkProcessIndex === -1) {
    // 没有思考内容，全部作为正式回答
    return {
      think: '',
      val: content.trim()
    };
  }

  // 查找回答标记
  const answerIndex = content.indexOf('**回答：**', thinkProcessIndex);

  if (answerIndex === -1) {
    // 只有思考过程，没有回答部分
    const thinkContent = content.substring(thinkProcessIndex + '**思考过程：**'.length).trim();
    return {
      think: thinkContent,
      val: ''
    };
  }

  // 提取思考内容
  const thinkContent = content.substring(
    thinkProcessIndex + '**思考过程：**'.length,
    answerIndex
  ).trim();

  // 提取正式回答内容（回答标记之后的内容）
  const valContent = content.substring(answerIndex + '**回答：**'.length).trim();

  return {
    think: thinkContent,
    val: valContent
  };
}