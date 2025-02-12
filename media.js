import {getFabricPrintInstructionIdentifierByName, sendRequest, getMediaBlankByName} from "./service.js";
import { ids } from "./ids.js";

let logId=""

export class Media {
    static getFabricPrintInstructionIdentifierByName = getFabricPrintInstructionIdentifierByName
    constructor() {
        
        this.initiated = false;
        this.mediaBlank = null;

        this.loadingInstructionsMain = null;
        this.printInstructionMain = null;
        this.mediaInstructionsMain = null;

        this.loadingInstructionsBack = null;
        this.printInstructionBack = null;
        this.mediaInstructionsBack = null;
    }

    async create(data){
        try {
            logId = data["media name"]
            this.data = data;
            // WriteToLog(`>`,"new-line");
            WriteToLog(`[${data["#"]}] ${data["media name"]}`,"header",data["#"]);
            WriteToLog(` │  Generating Media`);
            
            this.mediaBlank = this.generateMediaBlank();
            this.loadingInstructionsMain = this.generateLoadingInstruction("main");
            this.mediaInstructionsMain = this.generateMediaInstruction("main");
            this.loadingInstructionsBack = this.generateLoadingInstruction("back");
            this.mediaInstructionsBack = this.generateMediaInstruction("back");
            await this.addPrintAreas();
            WriteToLog(` │  └> Finished Generating ${data["media name"]}`);
            return true

        } catch (error) {
            WriteToLog(`Unexpected error: ${error}`);
            return false
        }
    }

    checkMedia() {
        let legal = true;
        if (this.mediaInstructionsMain && this.mediaInstructionsMain.pallet === "Not Supported") {
            WriteToLog("Illegal Pallet");
            legal = false;
        }
        return legal;
    }
    
    generateMediaBlank() {
        const name = this.data["media name"];
        const sku = this.data["sku name"];
        const mediaType = this.data["description - style"];
        const color = this.data["color"] ? this.data["color"] : "Black";
        const size = this.data["shirt size"];
        return new MediaBlank(name, sku, mediaType, color, size);
    }

    generateLoadingInstruction(side) {
        WriteToLog(" │  ├───> Generating Loading Instructions " + this.data[`loading instruction ${side}`]);
        const name = this.data[`loading instruction ${side}`];
        const stroke = this.data[`stroke ${side}`];
        const span = this.data[`gripper span ${side}`];
        const loadingSequence = this.data[`sequence logic ${side}`];
        const tensionRelief = this.data[`tension relief ${side}`];

        return new LoadingInstructions(name, span, stroke, loadingSequence, tensionRelief);
    }

    generateMediaInstruction(side) {

        const name = this.data[`loading instruction ${side}`];

        let printInstructionName = this.data[`print instruction ${side}`];
        let printInstructionIdentifier = getFabricPrintInstructionIdentifierByName(printInstructionName)

        if (printInstructionIdentifier == null) {
            WriteToLog(` │  ├───> No print instruction ${printInstructionName} found`,"warning");
            if (!this.data.color) {
                printInstructionIdentifier = ids.deafultPrintInstructions.color.identifier;
            } else if (this.data.color.toLowerCase() === "black") {
                printInstructionIdentifier = ids.deafultPrintInstructions.dark.identifier;
            } else if (this.data.color.toLowerCase() === "white") {
                printInstructionIdentifier = ids.deafultPrintInstructions.light.identifier;
            } else {
                printInstructionIdentifier = ids.deafultPrintInstructions.color.identifier;
            }
            WriteToLog(` │  │      └> Setting to ${printInstructionIdentifier.identificationName}`,"warning");
        }
        const pallet = this.data[`pallet ${side}`].split(" ")[0];
        WriteToLog(` │  ├───> Pallet: ${pallet}`)
        return new MediaInstructions(
            name,
            this.mediaBlank,
            pallet,
            side === "main" ? this.loadingInstructionsMain : this.loadingInstructionsBack,
            printInstructionIdentifier
        );
    }

    async addPrintAreas() {
        try {
            let path = "standard";
            
            if (
                this.loadingInstructionsMain &&
                this.loadingInstructionsMain.loadingSequence.toLowerCase() === "medium automatic surface"
            ) {
                path = "medium";
            }
            if (
                this.loadingInstructionsMain &&
                this.loadingInstructionsMain.loadingSequence.toLowerCase() === "small automatic surface"
            ) {
                path = "small";
            }
    
            const response = await fetch(`./PrintAreas/${path}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${path}.json: ${response.statusText}`);
            }
    
            const data = await response.json();
    
            if (this.mediaBlank) {
                this.mediaBlank.printAreas = data;
                WriteToLog(` │  ├───> Setting Print Area To ${path}`);
            }
        } catch (error) {
            console.log("Error loading print areas:", error);
        }
    }

    async addToDB() {
        try {
            // const media = getMediaBlankByName(this.mediaBlank.mediaName)
            // if (media)
            // {
            //     console.log("************* media exists")
            // }

            WriteToLog(` ├─┬─> Adding Media ${this.mediaBlank.mediaName} - SKU: ${this.mediaBlank.sku}`);
    
            if (!this.checkMedia()) {
                return false
            }

            let respsonse = await this.mediaBlank.addToDb();
            let responseJson = await respsonse.json()

            if (respsonse.status !== 200) {
                WriteToLog(" │   ├> Failed to add media blank", "error");
                WriteToLog(` │   └> ${responseJson.validationErrors.join(" / ")}`, "error");
                WriteToLog(` └────> Failed To Add Media - ${this.mediaBlank.mediaName}\n`, "error");
                return false
            }
            WriteToLog(" │   └> Media Blank Added Succesfully")

            const data = {mediaBlanks:responseJson.mediaBlanks}
            console.log(data)

            respsonse = await this.mediaBlank.updatePrintAreas(data, this.mediaInstructionsMain.pallet);
            if (respsonse.status !== 200) {
                WriteToLog(" │   ├> Failed to update print area", "error");
                responseJson = await respsonse.json()
                WriteToLog(` │   └>${responseJson.validationErrors.join(" / ")}`, "error");
                WriteToLog(` └────> Failed To Add Media - ${this.mediaBlank.mediaName}\n`, "error");
                return false
            }
            WriteToLog(" │   └> Print Area Updated Succesfully")
    
            respsonse = await this.loadingInstructionsMain.addToDb();
            if (respsonse.status !== 200) {
                WriteToLog(" │   ├> Failed to add loading instruction main", "error");
                responseJson = await respsonse.json()

                for (const key in responseJson.errors) {
                    const errorMessages = responseJson.errors[key][0];
                    WriteToLog(` │   └>${errorMessages}`, "error");
                }
                WriteToLog(` └────> Failed To Add Media - ${this.mediaBlank.mediaName}\n`, "error");
                return false
            }
            WriteToLog(` │   └> Loading Instructions Main Added Succesfully - ${this.loadingInstructionsMain.guid}`);
    
            respsonse = await this.mediaInstructionsMain.addToDb();
            if (respsonse.status !== 200) {
                WriteToLog(" │    Failed to add main media instructions", "error");
                WriteToLog(` └────> Failed To Add Media - ${this.mediaBlank.mediaName}\n`, "error");
                return false
            }
            WriteToLog(` │   └> Media Instructions Main Added Succesfully - ${this.mediaInstructionsMain.guid}`);
    
            respsonse = await this.loadingInstructionsBack.addToDb();
            if (respsonse.status !== 200) {
                WriteToLog(" │   └> Failed To Add Loading Instruction Back", "error");
                responseJson = await respsonse.json()

                for (const key in responseJson.errors) {
                    const errorMessages = responseJson.errors[key][0];
                    WriteToLog(` │     └>${errorMessages}`, "error");
                }
                WriteToLog(` └────> Failed To Add Media - ${this.mediaBlank.mediaName}\n`, "error");
                return false
            }
            WriteToLog(` │   └> Loading Instructions Back Added Succesfully - ${this.loadingInstructionsBack.guid}`);

            respsonse = await this.mediaInstructionsBack.addToDb();
            if (respsonse.status !== 200) {
                WriteToLog(" │   └> Failed to add Back media instructions", "error");
                WriteToLog(` └────> Failed To Add Media - ${this.mediaBlank.mediaName}\n`, "error");
                return false
            }
            WriteToLog(` │   └> Media Instructions Back Added Succesfully - ${this.mediaInstructionsBack.guid}`);

            WriteToLog(` └────> Finishing Adding Media - ${this.mediaBlank.mediaName}`,"success");
            return true;

        } catch (error) {
            WriteToLog(`Unexpected error: ${error}`);
            return false
        }
        
    }
}

class Instruction {
    constructor() {
        this.api_url = "";
    }

    async addToDb() {
        try{
            const url = localStorage.getItem("ServerURL")
            const fullUrl = url + this.api_url;
            const data = await this.toJson();
            const respsonse = await sendRequest(data, this.api_url);
            return respsonse;
        }
        catch (err){
            console.error(err)
            WriteToLog(err,"error")
        }
    }

    print(printArray, prefix ="") {
        const output = printArray.reduce((acc,element) => {
            acc.push(`${element[0]}: ${element[1]} `)
            return acc
        },[]);
        WriteToLog(`${prefix} ${output.join(" / ")}`)
    }

    toJson() {
        // return JSON.stringify(this);
    }
}

class MediaBlank extends Instruction {
    constructor(name, sku, mediaType, mediaColor, mediaSize) {
        super();
        this.api_url = "/api/v1/MediaDb/AddExternalMedias";
        this.api_url_update = "/api/v1/MediaDb/UpdateExternalMedias";
        WriteToLog(` │  ├───> Creating Media Blank ${name}`);
        this.guid = crypto.randomUUID();
        this.mediaName = name;
        this.sku = sku;
        this.mediaType = mediaType;
        this.mediaColor = mediaColor;
        this.mediaSize = mediaSize;
        this.print(" │  │     └>")
    }

    async updatePrintAreas(data, palletSize) {
        const pallet = ids.palletSize[palletSize];
        const url = localStorage.getItem("ServerURL")
        data["mediaBlanks"][0]["printAreas"][0] = { ...data["mediaBlanks"][0]["printAreas"][0], ...pallet };
        data["mediaBlanks"][0]["printAreas"][2] = { ...data["mediaBlanks"][0]["printAreas"][2], ...pallet };
        return sendRequest(data, this.api_url_update);
    }

    async update(){
        
    }

    print(prefix = "") {
         const printArray = [
            ["GUID", this.guid],
            ["SKU", this.sku],
            ["Type", this.mediaType],
            ["Color", this.mediaColor],
            ["Size", this.mediaSize]
        ]
        super.print(printArray, prefix)     
    }

    async toJson() {
        try {
            // Load JSON file asynchronously
            const response = await fetch("./Templates/AddExternalMedias.json");
            if (!response.ok) {
                throw new Error(`Failed to load AddExternalMedias.json: ${response.statusText}`);
            }
            const data = await response.json();
    
            // Modify the JSON data
            data["mediaBlanks"][0]["name"] = String(this.mediaName);
    
            data["mediaBlanks"][0]["identifier"]["id"] = this.guid;
            data["mediaBlanks"][0]["identifier"]["identificationName"] = String(this.mediaName);
            data["mediaBlanks"][0]["identifier"]["sku"] = String(this.sku);
    
            data["mediaBlanks"][0]["mediaProportion"]["identifier"]["identificationName"] = this.mediaSize;
            data["mediaBlanks"][0]["mediaProportion"]["name"] = ids.sizeName[this.mediaSize];
    
            data["mediaBlanks"][0]["defaultFabric"]["colorInfo"]["identifier"]["identificationName"] = this.mediaColor;
    
            return data;

        } catch (error) {
            WriteToLog("Error loading JSON:", error);
            return null;
        }
    }
}

class LoadingInstructions extends Instruction {
    
    constructor(name, span, stroke, loadingSequence, tensionRelief) {
        super();
        this.api_url = "/api/v1/MediaInstructionsDb/AddLoadingInstructions";
        this.guid = crypto.randomUUID();
        this.name = name;
        this.span = span || 501;
        this.stroke = stroke || 801;
        this.loadingSequence = loadingSequence || "Flaps & Tension Relief";
        this.tensionRelief = tensionRelief || "Regular Relief";
        this.autoLoaderEnabled = stroke !== "Use manual Loading";
        this.print(" │  │      └>")
    }

    print(prefix = "") {
        const printArray = [
            ["ID", this.guid],
            ["span", this.span],
            ["stroke", this.stroke],
            ["loadingSequence", this.loadingSequence],
            ["tensionRelief", this.tensionRelief]
        ]
        super.print(printArray,prefix)     
    }
    async toJson() {
        try {
            const response = await fetch("./Templates/AddLoadingInstructions.json");
            if (!response.ok) {
                throw new Error(`Failed to load LoadingInstructions.json: ${response.statusText}`);
            }
            const data = await response.json();
    
            data["loadingInstructions"]["name"] = String(this.name);
            data["loadingInstructions"]["identifier"]["id"] = this.guid;
            data["loadingInstructions"]["identifier"]["identificationName"] = String(this.name);
            data["loadingInstructions"]["span"] = this.span;
            data["loadingInstructions"]["stroke"] = this.stroke;
            data["loadingInstructions"]["autoLoaderEnabled"] = this.autoLoaderEnabled;
    
            data["loadingInstructions"]["loadingSequence"]["identifier"]["identificationName"] = this.loadingSequence;
            data["loadingInstructions"]["loadingSequence"]["identifier"]["id"] = ids.loadingSequence[this.loadingSequence];
    
            data["loadingInstructions"]["tensionRelief"]["identifier"]["identificationName"] = this.tensionRelief;
            data["loadingInstructions"]["tensionRelief"]["identifier"]["id"] = ids.tensionRelief[this.tensionRelief];
            
            return data;
    
        } catch (error) {
            WriteToLog("Error loading JSON:", error);
            return null;
        }
    }

}

class MediaInstructions extends Instruction {
    
    constructor(name, mediaBlank, pallet, loadingInstructions, printInstructionIdentifier) {
        super();
        WriteToLog(` │  ├───> Generating Media Instructions ${name}`)
        this.api_url = "/api/v1/MediaInstructionsDb/AddSlimMediaInstructions";
        this.guid = crypto.randomUUID();
        this.name = name;
        this.mediaBlankIdentifier = mediaBlank.guid;
        this.printInstructionIdentifier = printInstructionIdentifier;
        this.loadingInstructionsIdentifier = loadingInstructions.guid;
        this.pallet = pallet;
        this.print(" │  │      └>")
    }

    print(prefix = "") {
        const printArray = [
            ["ID", this.guid],
            ["mediaBlankIdentifier", this.mediaBlankIdentifier],
            ["printInstructionName", this.printInstructionIdentifier.identificationName],
            ["loadingInstructionsIdentifier", this.loadingInstructionsIdentifier],
        ]
        super.print(printArray,prefix)     
    }

    async toJson() {
        try {
            const response = await fetch("./Templates/AddSlimMediaInstructions.json"); 
            if (!response.ok) {
                throw new Error(`Failed to load AddMediaPrintInstructions.json: ${response.statusText}`);
            }
            const data = await response.json();
    
            data["mediaPrintInstructions"]["mediaPrintInstructionsIdentifier"]["identificationName"] = this.name;
            data["mediaPrintInstructions"]["mediaPrintInstructionsIdentifier"]["id"] = this.guid;
    
            data["mediaPrintInstructions"]["mediaBlankIdentifier"]["id"] = this.mediaBlankIdentifier;
            
            data["mediaPrintInstructions"]["defaultFabricPrintInstructionIdentifier"] = this.printInstructionIdentifier
    
            data["mediaPrintInstructions"]["defaultLoadingInstructionIdentifier"]["id"] = this.loadingInstructionsIdentifier;
    
            data["mediaPrintInstructions"]["supportedSurfacesTypes"] = [
                {
                    surfaceTypeIdentifier: { id: ids.surface[this.pallet] },
                    surfaceLayoutName: this.pallet
                }
            ];
            return data;
    
        } catch (error) {
            WriteToLog("Error loading JSON:", error);
            return null;
        }
    }

}


function WriteToLog(message, level = null, id = null) {

    // const newLine = document.createElement("div");
    
    // newLine.classList.add("line");

    // if (level) {
    //     newLine.classList.add(level);
    // }
    // if (id) {
    //     newLine.setAttribute("id", "id" + id); 
    // }
    // newLine.innerHTML = text;
    
    console.log("WriteToLog", message)
    window.dispatchEvent(new CustomEvent("externalData", {detail: {logId, message, level, id} }));
}
