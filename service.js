
export function getFabricPrintInstructionIdentifierByName(name){
    const fabricPrintInstructions = getPrintInstructions()
    const instruction = fabricPrintInstructions.find(instr => instr.identifier.identificationName === name);
    return instruction && instruction.instruction ? instruction.instruction.identifier : null;

}

export function getPrintInstructions(){
    return JSON.parse(localStorage.getItem("FabricPrintInstructionList"))
}

export async function sendRequest(data, endpoint) {
    try {
        const response = await fetch(localStorage.getItem("ServerURL") + endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        return response; 

    } catch (error) {
        return response; 
    }
}


export async function getMediaBlanks() {
    console.log("Getting Media Blanks");

    try {
        const response = await fetch(localStorage.getItem("ServerURL") + "/api/v1/MediaDb/GetMediaList", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ criteria: {} })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        // Store "mediaBlanks" in localStorage
        if (data.mediaBlanks) {
            console.log("Media Blanks Loaded To Local")
            localStorage.setItem("MediaBlanks", JSON.stringify(data.mediaBlanks));
        } else {
            console.warn("No 'mediaBlanks' key found in response.");
        }

        return data.mediaBlanks; // Return the parsed data if needed

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

export async function getMediaBlankByName(name)
{
    const mediaBlanks = await JSON.parse(localStorage.getItem("MediaBlanks"))
    const media = mediaBlanks.filter(item => item.identifier.identificationName===name)[0]
    console.log(media)
}