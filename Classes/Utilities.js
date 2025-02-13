export function WriteToLog(message, logId, level) {
    window.dispatchEvent(new CustomEvent("externalData", {detail: {message, logId, level} }));
}