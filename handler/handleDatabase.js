
export default async function ({
    event,
    Users,
    Threads,
    log,
    senderID,
    threadID
}) {
    try {
        const user = await Users.get(senderID);
        if (!user) {
            await Users.createData(senderID);
        }

        const thread = await Threads.get(threadID);
        if (!thread && threadID.endsWith("@s.whatsapp.net")) {
            await Threads.createData(threadID);
        }
    } catch (error) {
        log.error(error);
    }
}
