--[[
Main module for Image Quality Rank plugin
Evaluates images based on quality scores from an external AI model via MCP
]]

local LrApplication = import 'LrApplication'
local LrDialogs = import 'LrDialogs'
local LrExportSession = import 'LrExportSession'
local LrFileUtils = import 'LrFileUtils'
local LrHttp = import 'LrHttp'
local LrLogger = import 'LrLogger'
local LrPathUtils = import 'LrPathUtils'
local LrProgressScope = import 'LrProgressScope'
local LrTasks = import 'LrTasks'
local LrFunctionContext = import 'LrFunctionContext'
local LrView = import 'LrView'

-- Create plugin logger
local logger = LrLogger('ImageQualityRank')

-- Import local modules
local APIClient = require 'APIClient'
local Settings = require 'Settings'
local UIUtils = require 'UIUtils'
local JSON = require 'JSON'

-- Initialize modules
local function initializePlugin()
    -- Initialize settings
    Settings.init()
    
    -- Enable or disable logging based on settings
    if Settings.getSetting('enableLogFile', true) then
        logger:enable('logfile')
    else
        logger:disable()
    end
    
    -- Initialize API client with settings
    local settings = Settings.getSettings()
    APIClient.init({
        baseUrl = settings.mcpEndpoint,
        apiKey = settings.apiKey,
    })
    
    logger:trace("Plugin initialized")
end

-- Settings command - opens the settings dialog
local function settingsCommand()
    LrTasks.startAsyncTask(function()
        Settings.showSettingsDialog()
    end)
end

-- Entry point for the plugin, called when "Evaluate Image Quality" menu item is selected
local function evaluateImagesCommand()
    -- Make sure the plugin is initialized
    initializePlugin()
    
    LrTasks.startAsyncTask(function()
        logger:trace("Starting image evaluation process")
        
        -- Get current catalog and selection
        local catalog = LrApplication.activeCatalog()
        local targetPhotos = nil
        local selectedCollection = nil
        
        -- Choose between selected photos or entire collection
        local actionChoice = LrDialogs.confirm(
            "Evaluate Images", 
            "Would you like to evaluate selected photos or an entire collection?",
            "Selected Photos", "Entire Collection", "Cancel"
        )
        
        if actionChoice == "cancel" then
            logger:trace("User cancelled operation")
            return
        elseif actionChoice == "ok" then
            -- Selected photos
            targetPhotos = catalog:getTargetPhotos()
            if #targetPhotos == 0 then
                LrDialogs.message("No photos selected", "Please select at least one photo to evaluate.")
                return
            end
        else
            -- Entire collection
            local collections = catalog:getChildCollections()
            local collectionNames = {}
            local collectionTable = {}
            
            for i, collection in ipairs(collections) do
                table.insert(collectionNames, collection:getName())
                collectionTable[collection:getName()] = collection
            end
            
            local chosenCollectionName = LrDialogs.presentModalDialog({
                title = "Choose Collection",
                columns = {
                    {key = 'name', title = 'Collection Name'},
                },
                items = collectionNames,
                allowsMultipleSelection = false,
                initialSelections = {collectionNames[1]},
            })
            
            if not chosenCollectionName or #chosenCollectionName == 0 then
                logger:trace("No collection selected")
                return
            end
            
            selectedCollection = collectionTable[chosenCollectionName[1]]
            targetPhotos = selectedCollection:getPhotos()
        end
        
        -- Confirm operation with user
        local message = string.format("You are about to evaluate %d photos. This may take some time. Proceed?", #targetPhotos)
        local result = LrDialogs.confirm("Confirm Evaluation", message, "Evaluate")
        
        if result == "cancel" then
            logger:trace("User cancelled evaluation")
            return
        end
        
        -- Create progress scope
        local progressScope = LrProgressScope({
            title = "Evaluating Image Quality",
            functionContext = {
                name = "EvaluateImageQuality",
                percent = 0,
            }
        })
        
        -- Process each photo
        local processedPhotos = {}
        for i, photo in ipairs(targetPhotos) do
            -- Update progress
            progressScope:setPortionComplete(i - 1, #targetPhotos)
            progressScope:setCaption("Evaluating photo " .. i .. " of " .. #targetPhotos)
            
            -- Skip virtual copies (optional, remove if not needed)
            if photo:getRawMetadata("isVirtualCopy") then
                logger:trace("Skipping virtual copy")
                goto continue
            end
            
            -- Process the photo
            local success, result = processPhoto(photo, progressScope)
            
            -- Update metadata with quality score
            if success then
                catalog:withWriteAccessDo("Update AI Quality Score", function()
                    photo:setPropertyForPlugin(_PLUGIN, 'AIQualityScore', tostring(result.score))
                    
                    -- Set ranking category based on score
                    local ranking = UIUtils.getScoreLabel(result.score)
                    photo:setPropertyForPlugin(_PLUGIN, 'AIQualityRanking', ranking)
                end)
                
                table.insert(processedPhotos, photo)
            else
                logger:warn("Failed to process photo: " .. tostring(result))
            end
            
            -- Check if operation was cancelled
            if progressScope:isCanceled() then
                logger:trace("Operation cancelled by user")
                break
            end
            
            ::continue::
        end
        
        -- Cleanup and show completion message
        progressScope:done()
        
        if not progressScope:isCanceled() then
            -- Show results and ask if user wants to sort by score
            if #processedPhotos > 0 then
                local sortChoice = LrDialogs.confirm(
                    "Evaluation Complete", 
                    string.format("Successfully evaluated %d photos. Would you like to create a sorted collection based on quality scores?", #processedPhotos),
                    "Create Sorted Collection", "Show Results", "Close"
                )
                
                if sortChoice == "ok" then
                    -- Create sorted collection
                    sortPhotosByScore(processedPhotos)
                elseif sortChoice == "other" then
                    -- Show results dialog
                    showResultsDialog(processedPhotos)
                end
            else
                LrDialogs.message("Evaluation Complete", "No photos were successfully evaluated.")
            end
        end
    end)
end

-- Process a single photo and return quality score
function processPhoto(photo, progressScope)
    local success, errorMessage = pcall(function()
        -- Get a temporary copy of the photo for processing
        local exportSession = LrExportSession({
            photosToExport = {photo},
        })
        
        local settings = Settings.getSettings()
        local exportSettings = exportSession:getExportSettings()
        exportSettings.LR_format = "JPEG"
        exportSettings.LR_jpeg_quality = settings.jpegQuality
        exportSettings.LR_size_doConstrain = true
        exportSettings.LR_size_maxWidth = settings.imageWidth
        exportSettings.LR_size_maxHeight = settings.imageHeight
        exportSettings.LR_export_destinationType = "tempFolder"
        
        -- Export temporary image
        local tempPath = LrPathUtils.getStandardFilePath("temp")
        local exportParams = {
            useSubfolders = false,
            rootFolder = tempPath,
        }
        
        -- Update progress
        progressScope:setCaption("Exporting temporary file for analysis...")
        
        exportSession:doExportOnCurrentTask(exportParams)
        
        -- Get exported file
        local tempFilePath = nil
        for i, rendition in exportSession:renditions() do
            tempFilePath = rendition.destinationPath
            -- We're only processing one photo, so break after the first
            break
        end
        
        if not tempFilePath or not LrFileUtils.exists(tempFilePath) then
            return false, "Failed to create temporary file"
        end
        
        -- Update progress
        progressScope:setCaption("Sending image to AI for analysis...")
        
        -- Call MCP API
        local success, result
        local settings = Settings.getSettings()
        
        if settings.useMockApi then
            success, result = APIClient.mockEvaluateImage(tempFilePath)
        else
            success, result = APIClient.evaluateImage(tempFilePath)
        end
        
        if not success then
            return false, "Failed to evaluate image: " .. tostring(result)
        end
        
        local score = result.score
        
        -- Clean up temporary file
        LrFileUtils.delete(tempFilePath)
        
        return true, {score = score, details = result.details}
    end)
    
    if success then
        return true, errorMessage
    else
        return false, errorMessage
    end
end

-- Show detailed score results in a dialog
function showResultsDialog(photos)
    LrFunctionContext.callWithContext("showResultsDialog", function(context)
        local f = LrView.osFactory()
        
        local c = f:column {
            spacing = f:control_spacing(),
            f:row {
                f:static_text {
                    title = "Image Quality Evaluation Results",
                    font = "<system/bold>",
                },
            },
            f:separator { fill_horizontal = 1 },
        }
        
        -- Add results for each photo
        for i, photo in ipairs(photos) do
            local score = tonumber(photo:getPropertyForPlugin(_PLUGIN, 'AIQualityScore')) or 0
            local ranking = photo:getPropertyForPlugin(_PLUGIN, 'AIQualityRanking') or "Unknown"
            
            table.insert(c, f:row {
                f:static_text {
                    title = photo:getFormattedMetadata("fileName"),
                },
                UIUtils.createScoreBadge(score),
            })
        end
        
        LrDialogs.presentModalDialog {
            title = "Evaluation Results",
            contents = c,
            actionVerb = "OK",
        }
    end)
end

-- Helper function to sort photos by quality score
function sortPhotosByScore(photos)
    local catalog = LrApplication.activeCatalog()
    
    -- Create a collection for sorted results if needed
    local collectionName = "AI Quality Ranked Photos"
    local resultCollection = nil
    
    -- Check if collection already exists
    local collections = catalog:getChildCollections()
    for _, collection in ipairs(collections) do
        if collection:getName() == collectionName then
            resultCollection = collection
            break
        end
    end
    
    -- Create collection if it doesn't exist
    if not resultCollection then
        catalog:withWriteAccessDo("Create AI Ranked Collection", function()
            resultCollection = catalog:createCollection(collectionName)
        end)
    end
    
    -- Sort photos by score
    table.sort(photos, function(a, b)
        local scoreA = tonumber(a:getPropertyForPlugin(_PLUGIN, 'AIQualityScore')) or 0
        local scoreB = tonumber(b:getPropertyForPlugin(_PLUGIN, 'AIQualityScore')) or 0
        return scoreA > scoreB
    end)
    
    -- Add photos to collection in sorted order
    catalog:withWriteAccessDo("Add photos to ranked collection", function()
        -- Clear existing photos from collection
        local existingPhotos = resultCollection:getPhotos()
        resultCollection:removePhotos(existingPhotos)
        
        -- Add sorted photos
        resultCollection:addPhotos(photos)
    end)
    
    -- Show message
    LrDialogs.message(
        "Collection Created", 
        string.format("Added %d photos to the '%s' collection, sorted by quality score.", #photos, collectionName)
    )
    
    return resultCollection
end

-- Return the main entry point function and the settings command
return {
    evaluateImagesCommand = evaluateImagesCommand,
    settingsCommand = settingsCommand,
}
