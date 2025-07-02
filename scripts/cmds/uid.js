export default {
  config: {
    name: "uid",
    category: "utility"
  },
  onRun: async ({message,senderID}) => {
    message.reply(senderID)
  }
}