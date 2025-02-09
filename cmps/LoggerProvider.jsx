const { createContext, useContext, useState,useEffect } = React


// Create Context
const LoggerContext = createContext();

// Logger Provider (Manages All Logs)
export function LoggerProvider({ children }) {

    const [data, setData] = useState("")
    const [logs, setLogs] = useState({}); // Store logs as an object (key = logId)

    useEffect (()=> {
        function handleExternalData(event) {
            setData(event.detail)
        }
        window.addEventListener("externalData", handleExternalData);
        return () => window.removeEventListener("externalData", handleExternalData);
    },[])

    React.useEffect(() => {
        if (data){
            addLogLine(data.logId, data.message, data.level, data.id)
        }
        
    }, [data]);

    // Function to Add a Log Line to a Specific Log
    const addLogLine = (logId, message, level=null, id=null) => {
        setLogs((prevLogs) => {
            const newLogEntry = {message,level,id}
            return {
                ...prevLogs,
                [logId]: [...(prevLogs[logId] || []), newLogEntry] // Append to the selected log
            }
            
        });
    };


    return (
        <LoggerContext.Provider value={{ logs, addLogLine }}>
            {children}
        </LoggerContext.Provider>
    );
}

// Hook for Easy Access
export const useLogger = () => useContext(LoggerContext);
