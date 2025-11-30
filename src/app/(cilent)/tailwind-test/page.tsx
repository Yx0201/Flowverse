'use client'

export default function TailwindTest() {
  return (
    <div className="min-h-screen bg-red-500 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          Tailwind CSS 测试页面
        </h1>

        <div className="bg-blue-500 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            蓝色盒子测试
          </h2>
          <p className="text-white">
            如果你看到这个盒子有蓝色背景和白色文字，说明 Tailwind CSS 正常工作。
          </p>
        </div>

        <div className="bg-green-500 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            绿色盒子测试
          </h2>
          <p className="text-white">
            这是另一个测试块，用来验证不同的 Tailwind 类。
          </p>
        </div>

        <div className="bg-yellow-400 p-6 rounded-lg border-4 border-black">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            黄色盒子测试
          </h2>
          <p className="text-gray-900">
            这个测试验证了更多的样式组合。
          </p>
        </div>

        <div className="mt-8 p-4 bg-purple-500 text-white">
          <p className="text-lg">内边距测试: p-4</p>
          <p className="mt-4">外边距测试: mt-4</p>
        </div>
      </div>
    </div>
  )
}