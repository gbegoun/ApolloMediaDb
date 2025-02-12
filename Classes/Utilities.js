function WriteToLog(message, logId, {rest}) {
    window.dispatchEvent(new CustomEvent("externalData", {detail: {message, logId, ...rest} }));
}