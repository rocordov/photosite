--[[
Settings module for Image Quality Rank plugin
Manages user preferences and plugin configuration
]]

local LrPrefs = import 'LrPrefs'
local LrView = import 'LrView'
local LrDialogs = import 'LrDialogs'
local LrFileUtils = import 'LrFileUtils'
local LrPathUtils = import 'LrPathUtils'
local LrTasks = import 'LrTasks'
local LrColor = import 'LrColor'

local JSON = require 'JSON'

-- Create a settings object
local Settings = {
    -- Default settings
    defaults = {
        mcpEndpoint = "http://localhost:3000",
        apiKey = "",
        imageWidth = 1200,
        imageHeight = 1200,
        jpegQuality = 0.85,
        useMockApi = true, -- For testing without actual MCP
        enableLogFile = true,
        showScoreInThumbnails = true,
        qualityThresholds = {
            excellent = 90,
            good = 75,
            average = 60,
            belowAverage = 40
        },
        displayColors = {
            excellent = "#4CAF50", -- Green
            good = "#8BC34A", -- Light Green
            average = "#FFC107", -- Amber
            belowAverage = "#FF9800", -- Orange
            poor = "#F44336" -- Red
        }
    },
    
    -- Prefs storage key
    prefsKey = "com.ai.lightroom.imagerank",
}

-- Initialize settings and load from storage
function Settings.init()
    local prefs = LrPrefs.prefsForPlugin(Settings.prefsKey)
    
    -- If no prefs exist, set defaults
    if not prefs.initialized then
        for k, v in pairs(Settings.defaults) do
            prefs[k] = v
        end
        prefs.initialized = true
    end
    
    return Settings
end

-- Save settings
function Settings.saveSettings(settings)
    local prefs = LrPrefs.prefsForPlugin(Settings.prefsKey)
    
    for k, v in pairs(settings) do
        prefs[k] = v
    end
    
    return true
end

-- Get all settings
function Settings.getSettings()
    local prefs = LrPrefs.prefsForPlugin(Settings.prefsKey)
    local settings = {}
    
    -- Copy all prefs to a new table
    for k, v in pairs(prefs) do
        settings[k] = v
    end
    
    return settings
end

-- Get a specific setting
function Settings.getSetting(key, defaultValue)
    local prefs = LrPrefs.prefsForPlugin(Settings.prefsKey)
    
    if prefs[key] ~= nil then
        return prefs[key]
    else
        return defaultValue
    end
end

-- Present settings dialog to user
function Settings.showSettingsDialog()
    local result = false
    local prefs = LrPrefs.prefsForPlugin(Settings.prefsKey)
    
    LrTasks.startAsyncTask(function()
        local f = LrView.osFactory()
        
        local c = f:column {
            spacing = f:control_spacing(),
            f:row {
                spacing = f:label_spacing(),
                f:static_text {
                    title = "MCP Configuration",
                    font = "<system/bold>",
                },
            },
            f:row {
                spacing = f:label_spacing(),
                f:static_text {
                    alignment = "right",
                    width = LrView.share "label_width",
                    title = "MCP Endpoint:",
                },
                f:edit_field {
                    fill_horizontal = 1,
                    width_in_chars = 40,
                    value = LrView.bind("mcpEndpoint"),
                },
            },
            f:row {
                spacing = f:label_spacing(),
                f:static_text {
                    alignment = "right",
                    width = LrView.share "label_width",
                    title = "API Key:",
                },
                f:edit_field {
                    fill_horizontal = 1,
                    width_in_chars = 40,
                    value = LrView.bind("apiKey"),
                },
            },
            f:row {
                f:checkbox {
                    title = "Use Mock API (for testing without MCP)",
                    value = LrView.bind("useMockApi"),
                },
            },
            f:separator { fill_horizontal = 1 },
            f:row {
                spacing = f:label_spacing(),
                f:static_text {
                    title = "Image Export Settings",
                    font = "<system/bold>",
                },
            },
            f:row {
                spacing = f:label_spacing(),
                f:static_text {
                    alignment = "right",
                    width = LrView.share "label_width",
                    title = "Max Width:",
                },
                f:edit_field {
                    width_in_chars = 6,
                    value = LrView.bind("imageWidth"),
                    validate = function(view, value)
                        local num = tonumber(value)
                        return num ~= nil and num > 0 and num <= 5000
                    end,
                },
                f:static_text {
                    title = "pixels",
                },
            },
            f:row {
                spacing = f:label_spacing(),
                f:static_text {
                    alignment = "right",
                    width = LrView.share "label_width",
                    title = "Max Height:",
                },
                f:edit_field {
                    width_in_chars = 6,
                    value = LrView.bind("imageHeight"),
                    validate = function(view, value)
                        local num = tonumber(value)
                        return num ~= nil and num > 0 and num <= 5000
                    end,
                },
                f:static_text {
                    title = "pixels",
                },
            },
            f:row {
                spacing = f:label_spacing(),
                f:static_text {
                    alignment = "right",
                    width = LrView.share "label_width",
                    title = "JPEG Quality:",
                },
                f:slider {
                    min = 0,
                    max = 100,
                    value = LrView.bind {
                        key = "jpegQualitySlider",
                        transform = function(value, fromModel)
                            if fromModel then
                                return value * 100
                            else
                                return value / 100
                            end
                        end,
                    },
                },
                f:static_text {
                    alignment = "left",
                    width = 40,
                    title = LrView.bind {
                        key = "jpegQualitySlider",
                        transform = function(value, fromModel)
                            local val = fromModel and value or value / 100
                            return string.format("%d%%", val * 100)
                        end,
                    },
                },
            },
            f:separator { fill_horizontal = 1 },
            f:row {
                spacing = f:label_spacing(),
                f:static_text {
                    title = "Display Options",
                    font = "<system/bold>",
                },
            },
            f:row {
                f:checkbox {
                    title = "Show quality score on thumbnails",
                    value = LrView.bind("showScoreInThumbnails"),
                },
            },
            f:row {
                f:checkbox {
                    title = "Enable detailed logging",
                    value = LrView.bind("enableLogFile"),
                },
            },
        }
        
        local props = {
            mcpEndpoint = prefs.mcpEndpoint,
            apiKey = prefs.apiKey,
            imageWidth = prefs.imageWidth,
            imageHeight = prefs.imageHeight,
            jpegQualitySlider = prefs.jpegQuality,
            useMockApi = prefs.useMockApi,
            enableLogFile = prefs.enableLogFile,
            showScoreInThumbnails = prefs.showScoreInThumbnails,
        }
        
        local dialogResult = LrDialogs.presentModalDialog {
            title = "Image Quality Rank Settings",
            contents = c,
            accessoryView = f:push_button {
                title = "Reset to Defaults",
                action = function()
                    props.mcpEndpoint = Settings.defaults.mcpEndpoint
                    props.apiKey = Settings.defaults.apiKey
                    props.imageWidth = Settings.defaults.imageWidth
                    props.imageHeight = Settings.defaults.imageHeight
                    props.jpegQualitySlider = Settings.defaults.jpegQuality * 100
                    props.useMockApi = Settings.defaults.useMockApi
                    props.enableLogFile = Settings.defaults.enableLogFile
                    props.showScoreInThumbnails = Settings.defaults.showScoreInThumbnails
                end,
            },
            actionVerb = "Save",
            cancelVerb = "Cancel",
            propertyTable = props,
        }
        
        if dialogResult == "ok" then
            -- Save settings
            prefs.mcpEndpoint = props.mcpEndpoint
            prefs.apiKey = props.apiKey
            prefs.imageWidth = props.imageWidth
            prefs.imageHeight = props.imageHeight
            prefs.jpegQuality = props.jpegQualitySlider / 100
            prefs.useMockApi = props.useMockApi
            prefs.enableLogFile = props.enableLogFile
            prefs.showScoreInThumbnails = props.showScoreInThumbnails
            
            result = true
        end
    end)
    
    return result
end

return Settings
