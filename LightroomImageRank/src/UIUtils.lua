--[[
UI Utilities module for Image Quality Rank plugin
Provides functions for UI customization and visual indicators
]]

local LrView = import 'LrView'
local LrColor = import 'LrColor'
local LrApplication = import 'LrApplication'
local LrDialogs = import 'LrDialogs'
local LrDevelopController = import 'LrDevelopController'
local LrFunctionContext = import 'LrFunctionContext'
local LrTasks = import 'LrTasks'

local Settings = require 'Settings'

local UIUtils = {}

-- Convert hex color string to LrColor
function UIUtils.hexToColor(hexStr)
    -- Remove # if present
    if string.sub(hexStr, 1, 1) == "#" then
        hexStr = string.sub(hexStr, 2)
    end
    
    -- Parse hex values
    local r = tonumber(string.sub(hexStr, 1, 2), 16) / 255
    local g = tonumber(string.sub(hexStr, 3, 4), 16) / 255
    local b = tonumber(string.sub(hexStr, 5, 6), 16) / 255
    
    return LrColor(r, g, b)
end

-- Get color for quality score
function UIUtils.getScoreColor(score)
    local settings = Settings.getSettings()
    local thresholds = settings.qualityThresholds
    local colors = settings.displayColors
    
    if score >= thresholds.excellent then
        return UIUtils.hexToColor(colors.excellent)
    elseif score >= thresholds.good then
        return UIUtils.hexToColor(colors.good)
    elseif score >= thresholds.average then
        return UIUtils.hexToColor(colors.average)
    elseif score >= thresholds.belowAverage then
        return UIUtils.hexToColor(colors.belowAverage)
    else
        return UIUtils.hexToColor(colors.poor)
    end
end

-- Get rating label for a score
function UIUtils.getScoreLabel(score)
    local settings = Settings.getSettings()
    local thresholds = settings.qualityThresholds
    
    if score >= thresholds.excellent then
        return "Excellent"
    elseif score >= thresholds.good then
        return "Good"
    elseif score >= thresholds.average then
        return "Average"
    elseif score >= thresholds.belowAverage then
        return "Below Average"
    else
        return "Poor"
    end
end

-- Create score badge view
function UIUtils.createScoreBadge(score)
    local f = LrView.osFactory()
    
    local color = UIUtils.getScoreColor(score)
    local label = UIUtils.getScoreLabel(score)
    
    return f:row {
        f:static_text {
            title = tostring(math.floor(score + 0.5)),
            text_color = color,
            font = "<system/bold>",
        },
        f:static_text {
            title = " - " .. label,
            text_color = color,
        },
    }
end

-- Show detailed score information
function UIUtils.showScoreDetails(photo)
    LrFunctionContext.callWithContext("showScoreDetails", function(context)
        local f = LrView.osFactory()
        
        local score = tonumber(photo:getPropertyForPlugin(_PLUGIN, 'AIQualityScore')) or 0
        local ranking = photo:getPropertyForPlugin(_PLUGIN, 'AIQualityRanking') or "Unknown"
        
        local c = f:column {
            spacing = f:control_spacing(),
            f:row {
                f:static_text {
                    title = "Image Quality Score",
                    font = "<system/bold>",
                },
            },
            f:row {
                f:static_text {
                    title = "Score:",
                },
                f:static_text {
                    title = tostring(score),
                    text_color = UIUtils.getScoreColor(score),
                    font = "<system/bold>",
                },
            },
            f:row {
                f:static_text {
                    title = "Rating:",
                },
                f:static_text {
                    title = ranking,
                    text_color = UIUtils.getScoreColor(score),
                    font = "<system/bold>",
                },
            },
            f:separator { fill_horizontal = 1 },
            f:row {
                f:static_text {
                    title = "This score is based on AI evaluation of various aspects including:",
                },
            },
            f:row {
                f:static_text {
                    title = "• Technical quality (focus, exposure, noise)",
                },
            },
            f:row {
                f:static_text {
                    title = "• Composition",
                },
            },
            f:row {
                f:static_text {
                    title = "• Lighting",
                },
            },
            f:row {
                f:static_text {
                    title = "• Subject interest",
                },
            },
        }
        
        LrDialogs.presentModalDialog {
            title = "Image Quality Details",
            contents = c,
        }
    end)
end

-- Apply visual indicators to thumbnails in grid view
function UIUtils.applyThumbnailOverlays()
    local catalog = LrApplication.activeCatalog()
    local settings = Settings.getSettings()
    
    if not settings.showScoreInThumbnails then
        return
    end
    
    -- This functionality would typically require additional custom C/C++ code
    -- to integrate with Lightroom's native UI through the SDK
    -- The approach below is conceptual and would need to be implemented
    -- with the appropriate Lightroom SDK APIs
    
    -- Conceptual approach:
    -- 1. Register a thumbnail overlay callback with Lightroom
    -- 2. For each visible thumbnail, check if it has an AI score
    -- 3. If it does, draw a colored badge with the score in the corner of the thumbnail
    
    -- Example of what the implementation might look like:
    --[[
    LrThumbnailOverlay.register {
        name = "AI Quality Score",
        methods = {
            drawOverlay = function(photo, canvas, width, height)
                local score = tonumber(photo:getPropertyForPlugin(_PLUGIN, 'AIQualityScore'))
                
                if score then
                    local color = UIUtils.getScoreColor(score)
                    
                    -- Draw a badge in the top-right corner
                    canvas:setColor(color)
                    canvas:fillRect(width - 40, 5, 35, 20)
                    
                    -- Draw the score text
                    canvas:setColor(LrColor(1, 1, 1)) -- White text
                    canvas:drawText(tostring(math.floor(score)), width - 30, 7)
                end
            end,
        },
    }
    ]]
end

-- Create a context menu for showing score details
function UIUtils.registerContextMenu()
    -- This functionality would typically require additional custom code
    -- to integrate with Lightroom's native UI through the SDK
    
    -- Conceptual approach:
    -- 1. Register a context menu item with Lightroom
    -- 2. When clicked, show the score details dialog for the selected photo
    
    -- Example of what the implementation might look like:
    --[[
    LrContextMenu.register {
        name = "AI Quality Score",
        title = "Show AI Quality Details",
        enable = function(selection)
            -- Enable only if at least one photo is selected and has a score
            if #selection == 0 then
                return false
            end
            
            for _, photo in ipairs(selection) do
                local score = photo:getPropertyForPlugin(_PLUGIN, 'AIQualityScore')
                if score then
                    return true
                end
            end
            
            return false
        end,
        callback = function(selection)
            if #selection > 0 then
                UIUtils.showScoreDetails(selection[1])
            end
        end,
    }
    ]]
end

return UIUtils
