"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contentParser_1 = require("./contentParser");
// 测试用例
const testCases = [
    {
        name: '包含完整思考过程的内容',
        input: '这是正式回答的开始宗时会包含一个这是AI的思考过程和这是正式回答的结束部分',
        expected: {
            think: '这是AI的思考过程',
            val: '这是正式回答的结束部分'
        }
    },
    {
        name: '没有思考标记的内容',
        input: '这是普通的回答内容',
        expected: {
            think: '',
            val: '这是普通的回答内容'
        }
    },
    {
        name: '只有开始标记没有结束标记',
        input: '内容开始宗时会包含一个这只是思考过程',
        expected: {
            think: '这只是思考过程',
            val: ''
        }
    },
    {
        name: '多个思考标记（取第一个）',
        input: '开始宗时会包含一个思考1和回答1宗时会包含一个思考2和回答2',
        expected: {
            think: '思考1',
            val: '回答1宗时会包含一个思考2和回答2'
        }
    },
    {
        name: '空内容',
        input: '',
        expected: {
            think: '',
            val: ''
        }
    }
];
// 运行测试
testCases.forEach(testCase => {
    console.log(`测试: ${testCase.name}`);
    const result = (0, contentParser_1.parseAIContent)(testCase.input);
    const thinkMatch = result.think === testCase.expected.think;
    const valMatch = result.val === testCase.expected.val;
    console.log(`输入: "${testCase.input}"`);
    console.log(`期望: { think: "${testCase.expected.think}", val: "${testCase.expected.val}" }`);
    console.log(`结果: { think: "${result.think}", val: "${result.val}" }`);
    console.log(`思考内容匹配: ${thinkMatch ? '✓' : '✗'}`);
    console.log(`正式回答匹配: ${valMatch ? '✓' : '✗'}`);
    console.log(`总体结果: ${thinkMatch && valMatch ? '✓ 通过' : '✗ 失败'}`);
    console.log('---');
});
