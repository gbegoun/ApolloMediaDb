import { WriteToLog } from "./Utilities.js"
import { ids } from "../ids.js";
import {getFabricPrintInstructionsByName , sendRequest, getMediaBlankByName} from "../service.js";

let logId

export class Media {
    
    static getFabricPrintInstructionsByName  = getFabricPrintInstructionsByName 
    constructor() {
        
        this.mediaBlank = null;

        this.loadingInstructionsMain = null;
        this.printInstructionsMain = null;
        this.mediaInstructionsMain = null;

        this.loadingInstructionsBack = null;
        this.printInstructionsBack = null;
        this.mediaInstructionsBack = null;
    }

    async create(data){
        try 
        {
            logId = `${data["#"]}.${data["media name"]}`
            this.name = data["media name"]
            this.data = data;
            WriteToLog(`Generating Media ${data["media name"]}`, logId);
            
            this.mediaBlank = new MediaBlank(data)
            await this.addPrintAreas()
            this.loadingInstructionsMain = new LoadingInstructions("main", data)
            this.printInstructiosnMain = new PrintInstructions("main", data)
            this.mediaInstructionsMain = new MediaInstructions("main", data, this.mediaBlank,this.loadingInstructionsMain, this.printInstructiosnMain)

            this.loadingInstructionsBack = new LoadingInstructions("back", data)
            this.printInstructiosnBack = new PrintInstructions("back", data)
            this.mediaInstructionsBack = new MediaInstructions("back", data, this.mediaBlank,this.loadingInstructionsBack, this.printInstructiosnBack)

            // await this.addPrintAreas();
            // WriteToLog(` │  └> Finished Generating ${data["media name"]}`);
            // return true
            WriteToLog(`   └> Media Created Succesfully`, logId);
            return true

        } catch (error) {
            WriteToLog(`Unexpected error: ${error}`, logId,"error");
            return false
        }
    }

    async addPrintAreas() {
        try {
            let path = "standard";
            
            if (String(this.data["Pallet Main"]).toLowerCase() ==="medium automatic surface") {
                path = "medium";
            }
            if (String(this.data["Pallet Main"]).toLowerCase() ==="small automatic surface") {
                path = "small";
            }
    
            const response = await fetch(`../PrintAreas/${path}.json`);
            if (!response.ok) {
                console.error(`Failed to load ${path}.json: ${response.statusText}`);
            }
    
            const data = await response.json();
    
            if (this.mediaBlank) {
                this.mediaBlank.printAreas = data;
                WriteToLog(`   │     └> Setting Print Area To ${path}`,logId);
            }
        } catch (err) {
            WriteToLog(err.message,logId,"error");
        }
    }

    async addToDB(){
        WriteToLog(`Adding Media ${this.name} To Database`, logId);
        try{


            WriteToLog(`    ├> Adding Media Blank`, logId);
            let response = await this.mediaBlank.addToDB()
            
            if (response.status!=200)
            {
                const body = await response.json()
                const errors = body.validationErrors
                errors.forEach(error => {
                    WriteToLog(`    │    ├> ${error}`, logId, "error")
                })
                WriteToLog(`    │    └> Failed To Add Media Blank`, logId, "error")
                WriteToLog(`    └> Failed To Add Media  ${this.name}`, logId, "error")
                return false   
            }
            WriteToLog(`    ├> Media Blank ${this.name} Added Succesfully`, logId)

            WriteToLog(`    ├> Adding Loading Instructions Main`, logId);
            response = await this.loadingInstructionsMain.addToDB()
            if (response.status!=200)
            {
                const body = await response.json()
                const keys = Object.keys(body.errors)
                console.error("Error for ", logId)
                console.error(body)
                WriteToLog(`    └> Failed To Add Loading Instructions Main ${this.name}`, logId, "error")
                return false
            }
            WriteToLog(`    ├> Loading Instructions Main Added Succesfully`, logId)

            WriteToLog(`    ├> Adding Media Instructions Main`, logId);
            response = await this.mediaInstructionsMain.addToDB()
            if (response.status!=200){
                WriteToLog(`    └> Failed To Add Media Instructions Main ${this.name}`, logId, "error")        
                return false
            }
            WriteToLog(`    ├> Media Instructions Main Added Succesfully`, logId)

            WriteToLog(`    ├> Adding Loading Instructions Back`, logId);
            response = await this.loadingInstructionsBack.addToDB()
            if (response.status!=200)
            {
                const body = await response.json()
                const keys = Object.keys(body.errors)
                console.error("Error for ", logId)
                console.error(body)
                WriteToLog(`    └> Failed To Add Loading Instructions Back ${this.name}`, logId, "error")
                return false
            }
            WriteToLog(`    ├> Loading Instructions Back Added Succesfully`, logId)

            WriteToLog(`    ├> Adding Media Instructions Back`, logId);
            response = await this.mediaInstructionsBack.addToDB()
            if (response.status!=200){
                WriteToLog(`    └> Failed To Add Media Instructions Back ${this.name}`, logId, "error")        
                return false
            }
            WriteToLog(`    ├> Media Instructions Back Added Succesfully`, logId)

            WriteToLog(`    └> Media Added Successfully ${this.name}`, logId)
            return true
        }
        catch (err){
            WriteToLog("Unexpected Error, check logs", logId,"error");
            console.error(err)
            return false
        }
    }
}

class MediaBlank{
    json = {}
    api_url_add = "/api/v1/MediaDb/AddExternalMedias";
    api_url_update = "/api/v1/MediaDb/UpdateExternalMedias";

    constructor (data){
        WriteToLog(`   ├> Generating Media Blank - ${data["media name"]}`, logId);
        try{
            this.json = {mediaBlanks: [{
                name: data["media name"],
                identifier: {
                    id: crypto.randomUUID(),
                    
                    identificationName: data["media name"],
                    sku: data["sku name"]
                },
                mediaProportion: {
                    identifier: {
                        identificationName: data["shirt size"]
                    },
                    name: ids.sizeName[data["shirt size"]]
                },
                defaultFabric: {
                    colorInfo: {
                        identifier: {
                            identificationName: data["color"] ? data["color"] : "Black"
                        }
                    }
                },
                mediaType: {
                    mediaTypeIdentifier: {
                        identificationName: data["description - style"]
                    }
                }
            }]}
            
        }
        catch (err){
            WriteToLog(`   └> ${err.message,logId}`,logId , "error")
        }
        
    }

    getId() {
        return this.json.mediaBlanks[0].identifier.id;
    }

    async addToDB()
    {
        const response = await(sendRequest(this.json,this.api_url_add))   
        return response
    }


}

class LoadingInstructions{
    api_url_add = "/api/v1/MediaInstructionsDb/AddLoadingInstructions"

    constructor (side, data){
        WriteToLog(`   ├> Generating Loading Instruction ${side} - ${data["media name"]} ${side}`, logId);
        try{
            this.json = {
                "loadingInstructions": {
                    "id": 0,
                    "identifier": {
                        "id": crypto.randomUUID(),
                        "identificationName": data[`loading instruction ${side}`]
                    },
                    "name":data[`loading instruction ${side}`],
                    "originLoadingInstructionsIdentifier": null,
                    "useLintRoller": true,
                    "span": data[`gripper span ${side}`],
                    "stroke":  isFinite(data[`stroke ${side}`]) ? data[`stroke ${side}`] : 801,
                    "autoLoaderEnabled": isFinite(data[`stroke ${side}`]),
                    "continuousEnabled": false,
                    "loadingInstructionsProperties": {},
                    "isFactoryCreated": false,
                    "loadingSequence": {
                        "identifier": {
                            "id": ids.loadingSequence[data[`sequence logic ${side}`]],
                            "identificationName": data[`sequence logic ${side}`]
                        },
                        "id": 1
                    },
                    "tensionRelief": {
                        "id": 1,
                        "identifier": {
                            "id": ids.tensionRelief[data[`tension relief ${side}`]],
                            "identificationName": data[`tension relief ${side}`]
                        },
                        "dateModified": null
                    }
                }
            }
        }
        catch (err){
            WriteToLog(`   └> ${err.message}`,logId,"error")
        }
    }

    getId() {
        return this.json.loadingInstructions.identifier.id;
    }

    async addToDB()
    {
        const response = await(sendRequest(this.json,this.api_url_add))   
        return response
    }
}

class PrintInstructions {
    constructor(side, data) {
        try {
            const name = data[`print instruction ${side}`]        
            WriteToLog(`   ├> Setting print instruction ${side} - ${name}`, logId)
            this.json = getFabricPrintInstructionsByName(name)
            
            if(this.json==null){    
                const mediaColor = data.color.toLowerCase()
                if (!mediaColor || mediaColor==="black" || mediaColor==="") {
                    this.json = getFabricPrintInstructionsByName("Apollo Dark STD")
                } else if (mediaColor==="white") {
                    this.json = getFabricPrintInstructionsByName("Apollo Light STD")
                } else {
                    this.json = getFabricPrintInstructionsByName("Apollo Color STD")
                }
                WriteToLog(`   │      └> Print Instructions ${name} not found, setting to ${this.json.fabricPrintInstructionsIdentifier.identificationName}`, logId, "warning")
            } else {
                WriteToLog(`   │      └ Print Instructions ${name} found`, logId)
            }
        } 
        catch (err) {
            //lkdsjflksdj
            WriteToLog(`   └> ${err.message}`,logId,"error")
        }
    }

    getId(){
        return this.json.fabricPrintInstructionsIdentifier.id
    }

    getName(){
        return this.json.fabricPrintInstructionsIdentifier.identificationName
    }
    getExternalId(){
        return this.json.fabricPrintInstructionsIdentifier.externalId
    }
}

class MediaInstructions{
    api_url_add = "/api/v1/MediaInstructionsDb/AddSlimMediaInstructions";
    constructor (side, data, mediaBlank, loadingInstructions, printInstructions){
        WriteToLog(`   ├> Populating Media Instruction ${data["media name"]} ${side}`, logId);
        try{

            const pallet = data[`pallet ${side}`].split(" ")[0]
            this.json = {
                "mediaPrintInstructions": {
                    "mediaPrintInstructionsIdentifier": {
                        "id": crypto.randomUUID(),
                        "identificationName": data[`loading instruction ${side}`]
                    },
                    "mediaBlankIdentifier": {
                        "id": mediaBlank.getId()
                    },
                    "defaultFabricPrintInstructionIdentifier": {
                        "id": printInstructions.getId(),
                        "externalId": printInstructions.getExternalId(),
                        "identificationName": printInstructions.getName()
                    },
                    "defaultLoadingInstructionIdentifier": {
                        "id": loadingInstructions.getId()
                    },
                    "instructionsPerPrintAreas": [],
                    "supportedSurfacesTypes": [
                        {
                            "surfaceTypeIdentifier": {
                                "id": ids.surface[pallet]
                            },
                            "surfaceLayoutName": pallet
                        }
                    ]
                }
            }
            console.log(this.json)
        }
        catch (err){
            WriteToLog(err.message,logId,"error")
        }
    }

    async addToDB()
    {
        const response = await(sendRequest(this.json,this.api_url_add))   
        return response
    }
}