async function handleEvent({ sock, event, log, font, update }) {
    const events = global.client.events;
    for (const eventCmd of events.values()) {
        try {
            await eventCmd.onEvent({
              sock,
              event,
              log,
              font,
              update
            })
        } catch (error) {
            log.error(`Error running event: ${eventCmd.config.name}`);
            console.log(error);
        }
    }
}

export default handleEvent;
