import { WriteToLog } from "./Utilities.js"

export class Media {
    
    static getFabricPrintInstructionIdentifierByName = getFabricPrintInstructionIdentifierByName
    constructor() {
        
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

