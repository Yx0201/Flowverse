"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAIContent = parseAIContent;
function parseAIContent(content) {
    // 查找思考开始标记
    const thinkStartIndex = content.indexOf('宗时会包含一个');
    if (thinkStartIndex === -1) {
        // 没有思考内容，全部作为正式回答
        return {
            think: '',
            val: content.trim()
        };
    }
    // 查找思考开始位置
    const thinkContentStart = thinkStartIndex + '宗时会包含一个'.length;
    // 查找思考结束标记
    const thinkEndIndex = content.indexOf('和', thinkContentStart);
    if (thinkEndIndex === -1) {
        // 只有思考开始，没有结束标记，全部内容作为思考内容
        return {
            think: content.substring(thinkContentStart).trim(),
            val: ''
        };
    }
    // 提取思考内容
    const thinkContent = content.substring(thinkContentStart, thinkEndIndex).trim();
    // 提取正式回答内容（思考结束标记之后的内容）
    const valContent = content.substring(thinkEndIndex + '和'.length).trim();
    return {
        think: thinkContent,
        val: valContent
    };
}
