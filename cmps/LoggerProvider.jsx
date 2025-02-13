const { createContext, useContext, useState, useEffect, useCallback } = React;

// Create Context
const LoggerContext = createContext();

// Logger Provider (Manages All Logs)
export function LoggerProvider({ children }) {
    const [data, setData] = useState([]); // Store logs as an array
    const [logs, setLogs] = useState({}); // Store logs as an object (key = logId)

    useEffect(() => {
        function handleExternalData(event) {
            setData(prev => [...prev, event.detail]); // Append new logs (Functional update)
        }
        window.addEventListener("externalData", handleExternalData);
        return () => window.removeEventListener("externalData", handleExternalData);
    }, []);

    // Memoize `addLogLine` so it doesn't change on every render
    const addLogLine = useCallback((logId, message, level = null, id = null) => {
        setLogs((prevLogs) => ({
            ...prevLogs,
            [logId]: [...(prevLogs[logId] || []), { message, level, id }]
        }));
    }, []);

    useEffect(() => {
        if (data.length > 0) {
            // Process ALL logs instead of just the latest one
            data.forEach(log => {
                addLogLine(log.logId, log.message, log.level, log.id);
            });

            setData([]); // Clear processed logs to prevent re-processing
        }
    }, [data, addLogLine]); // ✅ Depend on `data` and `addLogLine`

    return (
        <LoggerContext.Provider value={{ logs, addLogLine }}>
            {children}
        </LoggerContext.Provider>
    );
}

// Hook for Easy Access
export const useLogger = () => useContext(LoggerContext);
