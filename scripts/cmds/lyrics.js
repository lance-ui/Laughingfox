import fetch from "node-fetch";

const getResponse = async (key) => {
  const res = await fetch(`https://kaiz-apis.gleeze.com/api/lyrics?title=${encodeURIComponent(key)}&apikey=${global.client.config.keys.kaiz}`)
  if(!res.ok)
    throw new Error("failed to get response from api ,make sure tht u set the api key in config")
  const data = await res.json();
  return data;
};

export default {
  config: {
    name: "lyrics",
    category: "utility",
    cooldown: 5,
  },
  onRun: async ({ message, args, font }) => {
    try{
      const prompt = args.join(" ");
      const response = await getResponse(prompt);
      let body = "";
      body += `*title*: ${response.title}\n\n`;
      body += `${response.lyrics}\n`;
      body += "> powered by lance";
      await message.sendImage(body,response.thumbnail)
    }catch (error) {
      console.log(error)
      message.reply(`an error occured: ${error.message}`)
    }
  }
}