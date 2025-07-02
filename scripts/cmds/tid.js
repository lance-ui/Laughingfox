export default {
  config: {
    name: "tid",
    category: "utility"
  },
  onRun: async ({message,threadID}) => {
    message.reply(threadID)
  }
}