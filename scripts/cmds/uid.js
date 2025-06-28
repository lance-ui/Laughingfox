export default {
  config: {
    name: "uid"
  },
  onRun: async ({message,senderID}) => {
    message.reply(senderID)
  }
