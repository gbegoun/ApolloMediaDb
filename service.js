
export function getFabricPrintInstructionIdentifierByName(name){
    const fabricPrintInstructions = getPrintInstructions()
    const instruction = fabricPrintInstructions.find(instr => instr.identifier.identificationName === name);
    return instruction?.instruction.identifier ?? null
}

export function getPrintInstructions(){
    return JSON.parse(localStorage.getItem("FabricPrintInstructionList"))
}

export async function sendRequest(data, url) {
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        return response; 

    } catch (error) {
        return response; 
    }
}
