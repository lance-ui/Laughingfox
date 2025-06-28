export default {
  config: {
    name: "tid"
  },
  onRun: async ({message,threadID}) => {
    message.reply(threadID)
  }
}